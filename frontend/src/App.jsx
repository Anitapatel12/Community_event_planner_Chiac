import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import Home from "./pages/Home";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";
import EventDetails from "./pages/EventDetails";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";
import Toast from "./components/Toast";
import About from "./pages/About";
import Contact from "./pages/Contact";
import { fetchEventsFromApi } from "./services/eventsApi";

const AUTH_STORAGE_KEY = "eventhub_auth_session";

function loadAuthSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return { isLoggedIn: false, currentUser: null, currentUserId: null, userRole: null };
    }

    const parsed = JSON.parse(raw);
    const isLoggedIn = Boolean(parsed?.isLoggedIn);
    const parsedUserId = Number(parsed?.currentUserId);
    const currentUserId =
      Number.isInteger(parsedUserId) && parsedUserId > 0 ? parsedUserId : null;

    // Legacy sessions without a numeric user id cannot perform backend mutations.
    if (isLoggedIn && !currentUserId) {
      return { isLoggedIn: false, currentUser: null, currentUserId: null, userRole: null };
    }

    return {
      isLoggedIn,
      currentUser: parsed?.currentUser || null,
      currentUserId,
      userRole: parsed?.userRole || null,
    };
  } catch {
    return { isLoggedIn: false, currentUser: null, currentUserId: null, userRole: null };
  }
}

function ProtectedRoute({
  children,
  requireAdmin = false,
  isLoggedIn,
  userRole,
  onUnauthorized,
}) {
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && userRole !== "admin") {
    onUnauthorized?.();
    return <Navigate to="/home" replace />;
  }

  return children;
}

function App() {
  const backendCheckStartedRef = useRef(false);
  const initialAuth = loadAuthSession();

  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const [events, setEvents] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(initialAuth.isLoggedIn);
  const [currentUser, setCurrentUser] = useState(initialAuth.currentUser);
  const [currentUserId, setCurrentUserId] = useState(initialAuth.currentUserId);
  const [userRole, setUserRole] = useState(initialAuth.userRole);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const hideToast = () => {
    setToast(null);
  };

  const refreshEvents = useCallback(async () => {
    try {
      const apiEvents = await fetchEventsFromApi();
      setEvents(apiEvents);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    // Clear legacy cached event data from previous frontend-only mode builds.
    localStorage.removeItem("events");
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ isLoggedIn, currentUser, currentUserId, userRole })
      );
    } catch {
      // Ignore persistence failures and keep runtime behavior intact.
    }
  }, [isLoggedIn, currentUser, currentUserId, userRole]);

  useEffect(() => {
    if (backendCheckStartedRef.current) return;
    backendCheckStartedRef.current = true;

    let active = true;
    let hasShownBackendWarning = false;

    const syncEvents = async () => {
      const loaded = await refreshEvents();
      if (!active) return;

      if (!loaded) {
        setEvents([]);
        if (!hasShownBackendWarning) {
          hasShownBackendWarning = true;
          showToast("Backend not reachable. Start backend and refresh.", "warning");
        }
        return;
      }

      hasShownBackendWarning = false;
    };

    syncEvents();
    const intervalId = setInterval(syncEvents, 10000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [refreshEvents, showToast]);

  const handleLogin = (user) => {
    const resolvedUsername = user?.username || user?.name || "user";
    const resolvedRole =
      user?.role || (String(resolvedUsername).toLowerCase() === "admin" ? "admin" : "user");

    setIsLoggedIn(true);
    setCurrentUser(resolvedUsername);
    setCurrentUserId(user?.id ?? null);
    setUserRole(resolvedRole);
    refreshEvents();
    showToast(`Welcome, ${resolvedUsername}!`, "success");
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    const now = new Date();
    const upcomingEvents = events.filter((event) => {
      if (!event.date) return false;
      const eventDateTime = new Date(`${event.date}T${event.time || "00:00"}`);
      return eventDateTime > now;
    });

    if (upcomingEvents.length > 0) {
      const timer = setTimeout(() => {
        showToast(`You have ${upcomingEvents.length} upcoming event(s)!`, "info");
      }, 1200);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [events, isLoggedIn, showToast]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentUserId(null);
    setUserRole(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    showToast("Logged out successfully!", "success");
    window.location.href = "/login";
  };

  return (
    <BrowserRouter>
      <div className="app-shell min-h-screen font-sans text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 transition-colors duration-300">
        <Navbar
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          userRole={userRole}
          onLogout={handleLogout}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
        <main className="container mx-auto px-4 py-6 relative">
          <Routes>
            <Route
              path="/login"
              element={isLoggedIn ? <Navigate to="/home" replace /> : <Login onLogin={handleLogin} />}
            />
            <Route path="/" element={<Navigate to={isLoggedIn ? "/home" : "/login"} replace />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole}>
                  <Home
                    events={events}
                    currentUser={currentUser}
                    currentUserId={currentUserId}
                    userRole={userRole}
                    refreshEvents={refreshEvents}
                    showToast={showToast}
                  />
                </ProtectedRoute>
              }
            />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/create"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole}>
                  <CreateEvent
                    currentUserId={currentUserId}
                    userRole={userRole}
                    refreshEvents={refreshEvents}
                    showToast={showToast}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit/:id"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole}>
                  <EditEvent
                    events={events}
                    currentUser={currentUser}
                    currentUserId={currentUserId}
                    userRole={userRole}
                    refreshEvents={refreshEvents}
                    showToast={showToast}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/event/:id"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole}>
                  <EventDetails
                    events={events}
                    currentUser={currentUser}
                    userRole={userRole}
                    showToast={showToast}
                  />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>

        {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      </div>
    </BrowserRouter>
  );
}

export default App;
