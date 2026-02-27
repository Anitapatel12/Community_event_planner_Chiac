const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const DEFAULT_BACKEND_PORT = 5001;
const DEFAULT_FRONTEND_PORT = 3000;
const MIN_NODE_MAJOR = 18;
const MAX_PORT_ATTEMPTS = 25;
const DATABASE_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRESQL_URL",
  "NEON_DATABASE_URL",
];

const rootDir = process.cwd();
const backendEnvPath = path.join(rootDir, "backend", ".env");
const frontendDir = path.join(rootDir, "frontend");
const viteBinPath = path.join(frontendDir, "node_modules", "vite", "bin", "vite.js");

function parseEnvFile(rawText) {
  const result = {};
  const lines = String(rawText || "").split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex < 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!key) continue;

    result[key] = value;
  }

  return result;
}

function loadBackendEnvValues() {
  if (!fs.existsSync(backendEnvPath)) {
    return {};
  }

  return parseEnvFile(fs.readFileSync(backendEnvPath, "utf8"));
}

function parsePort(value, fallbackPort) {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed > 0 && parsed < 65536) {
    return parsed;
  }
  return fallbackPort;
}

function portFromFrontendUrl(urlValue) {
  if (!urlValue) return null;
  try {
    const parsed = new URL(urlValue);
    const portValue = Number(parsed.port);
    if (Number.isInteger(portValue) && portValue > 0 && portValue < 65536) {
      return portValue;
    }
    return parsed.protocol === "https:" ? 443 : 80;
  } catch {
    return null;
  }
}

function ensureNodeVersion() {
  const nodeMajor = Number(process.versions.node.split(".")[0] || 0);
  if (nodeMajor >= MIN_NODE_MAJOR) {
    return;
  }

  console.error(
    `[runner] Node.js ${MIN_NODE_MAJOR}+ is required. Current version: ${process.versions.node}`
  );
  process.exit(1);
}

function resolveDatabaseUrl(runtimeEnv, backendEnv) {
  let resolved = "";
  for (const key of DATABASE_ENV_KEYS) {
    const runtimeValue = String(runtimeEnv[key] || "").trim();
    if (runtimeValue) {
      resolved = runtimeValue;
      break;
    }

    const backendValue = String(backendEnv[key] || "").trim();
    if (backendValue) {
      resolved = backendValue;
      break;
    }
  }

  if (!resolved) {
    console.error(
      `[runner] Database URL is missing. Set one of ${DATABASE_ENV_KEYS.join(
        ", "
      )} in backend/.env or your shell environment.`
    );
    process.exit(1);
  }

  try {
    const parsed = new URL(resolved);
    const validProtocols = new Set(["postgres:", "postgresql:"]);
    if (!validProtocols.has(parsed.protocol)) {
      throw new Error(`Unsupported protocol: ${parsed.protocol}`);
    }
  } catch (error) {
    console.error(`[runner] DATABASE_URL is invalid: ${error.message}`);
    process.exit(1);
  }

  return resolved;
}

function canListen(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.unref();

    probe.on("error", () => {
      resolve(false);
    });

    probe.listen(port, () => {
      probe.close(() => resolve(true));
    });
  });
}

async function findFreePort(preferredPort, usedPorts = new Set()) {
  for (let attempt = 0; attempt < MAX_PORT_ATTEMPTS; attempt += 1) {
    const candidate = preferredPort + attempt;
    if (usedPorts.has(candidate)) {
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const free = await canListen(candidate);
    if (free) {
      return candidate;
    }
  }

  throw new Error(
    `Unable to find a free port after ${MAX_PORT_ATTEMPTS} attempts, starting from ${preferredPort}`
  );
}

function spawnProcess(command, args, options) {
  const child = spawn(command, args, {
    ...options,
    stdio: "inherit",
  });

  child.on("error", (error) => {
    console.error(`[runner] Failed to start process "${command} ${args.join(" ")}":`, error);
  });

  return child;
}

function ensureFrontendRuntime() {
  if (fs.existsSync(viteBinPath)) {
    return;
  }

  console.log(
    "[runner] Frontend dependencies are missing. Installing with \"npm install --prefix frontend\"..."
  );

  const npmExecPath = process.env.npm_execpath;
  const installArgs = ["install", "--prefix", "frontend"];
  const installResult =
    npmExecPath && fs.existsSync(npmExecPath)
      ? spawnSync(process.execPath, [npmExecPath, ...installArgs], {
          cwd: rootDir,
          env: process.env,
          stdio: "inherit",
        })
      : spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", installArgs, {
          cwd: rootDir,
          env: process.env,
          stdio: "inherit",
        });

  if (installResult.error) {
    console.error("[runner] Failed to install frontend dependencies:", installResult.error.message);
    process.exit(1);
  }

  if (installResult.status !== 0) {
    console.error(
      `[runner] Frontend dependency installation failed with exit code ${installResult.status}.`
    );
    process.exit(installResult.status || 1);
  }

  if (!fs.existsSync(viteBinPath)) {
    console.error(
      "[runner] Frontend dependencies still missing after install. Re-run \"npm install --prefix frontend\"."
    );
    process.exit(1);
  }
}

async function main() {
  ensureNodeVersion();
  ensureFrontendRuntime();

  const backendEnv = loadBackendEnvValues();
  const databaseUrl = resolveDatabaseUrl(process.env, backendEnv);

  const preferredBackendPort = parsePort(
    process.env.PORT || backendEnv.PORT,
    DEFAULT_BACKEND_PORT
  );

  const preferredFrontendPort = parsePort(
    process.env.FRONTEND_PORT || portFromFrontendUrl(process.env.FRONTEND_URL || backendEnv.FRONTEND_URL),
    DEFAULT_FRONTEND_PORT
  );

  const reservedPorts = new Set();
  const backendPort = await findFreePort(preferredBackendPort, reservedPorts);
  reservedPorts.add(backendPort);
  const frontendPort = await findFreePort(preferredFrontendPort, reservedPorts);

  const backendOrigin = `http://localhost:${backendPort}`;
  const frontendOrigin = `http://localhost:${frontendPort}/`;

  if (backendPort !== preferredBackendPort) {
    console.log(
      `[runner] Backend port ${preferredBackendPort} is busy. Using ${backendPort} instead.`
    );
  }
  if (frontendPort !== preferredFrontendPort) {
    console.log(
      `[runner] Frontend port ${preferredFrontendPort} is busy. Using ${frontendPort} instead.`
    );
  }

  console.log(`[runner] Backend:  ${backendOrigin}`);
  console.log(`[runner] Frontend: ${frontendOrigin} (Vite may choose next free port)`);

  const backendProcess = spawnProcess(process.execPath, [path.join("backend", "server.js")], {
    cwd: rootDir,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      PORT: String(backendPort),
      FRONTEND_URL: frontendOrigin,
    },
  });

  const frontendProcess = spawnProcess(
    process.execPath,
    [
      viteBinPath,
      "--host",
      "localhost",
      "--port",
      String(frontendPort),
    ],
    {
      cwd: frontendDir,
      env: {
        ...process.env,
        VITE_BACKEND_ORIGIN: backendOrigin,
      },
    }
  );

  let shuttingDown = false;

  const shutdown = (exitCode = 0) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;

    if (backendProcess && !backendProcess.killed) {
      backendProcess.kill();
    }
    if (frontendProcess && !frontendProcess.killed) {
      frontendProcess.kill();
    }

    setTimeout(() => {
      process.exit(exitCode);
    }, 250);
  };

  const handleChildExit = (name, code, signal) => {
    if (shuttingDown) {
      return;
    }

    const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    console.error(`[runner] ${name} process exited (${reason}). Stopping all services.`);
    shutdown(code && code !== 0 ? code : 1);
  };

  backendProcess.on("exit", (code, signal) => handleChildExit("Backend", code, signal));
  frontendProcess.on("exit", (code, signal) => handleChildExit("Frontend", code, signal));

  process.on("SIGINT", () => shutdown(0));
  process.on("SIGTERM", () => shutdown(0));
}

main().catch((error) => {
  console.error("[runner] Startup failed:", error);
  process.exit(1);
});
