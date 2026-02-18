const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const PLACEHOLDER_HINT = "route working";

function isPlaceholderPayload(payload) {
  return (
    typeof payload === "string" &&
    payload.toLowerCase().includes(PLACEHOLDER_HINT)
  );
}

async function readPayload(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export async function detectBackendStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/events`, {
      method: "GET",
      headers: { Accept: "application/json, text/plain" },
    });

    if (!response.ok) {
      return {
        connected: false,
        placeholderRoutes: false,
        reason: `HTTP ${response.status}`,
      };
    }

    const payload = await readPayload(response);

    return {
      connected: true,
      placeholderRoutes: isPlaceholderPayload(payload),
      reason: null,
    };
  } catch {
    return {
      connected: false,
      placeholderRoutes: false,
      reason: "unreachable",
    };
  }
}

export { API_BASE_URL };
