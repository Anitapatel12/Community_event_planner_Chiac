import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Home from "./pages/Home";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";
import EventDetails from "./pages/EventDetails";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";
import Toast from "./components/Toast";
import { detectBackendStatus } from "./services/backendCompatibility";

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
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  const backendCheckStartedRef = useRef(false);

  // Load events from localStorage on initial render
  const [events, setEvents] = useState(() => {
    const savedEvents = localStorage.getItem('events');
    return savedEvents ? JSON.parse(savedEvents) : [];
  });
  
  // Save events to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('events', JSON.stringify(events));
  }, [events]);
  
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  
  // Toast state for notifications
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  // Non-blocking backend compatibility check.
  useEffect(() => {
    if (backendCheckStartedRef.current) return;
    backendCheckStartedRef.current = true;

    let active = true;

    const checkBackend = async () => {
      const status = await detectBackendStatus();
      if (!active) return;

      if (!status.connected) {
        showToast("Backend not reachable. Running in frontend-only mode.", "warning");
        return;
      }

      if (status.placeholderRoutes) {
        showToast("Backend connected. Placeholder API detected, using local event data.", "info");
      }
    };

    checkBackend();
    return () => {
      active = false;
    };
  }, []);

  // Handle login
  const handleLogin = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user.username);
    setUserRole(user.role);
    showToast(`Welcome, ${user.username}!`, "success");
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setUserRole(null);
    showToast("Logged out successfully!", "success");
    // Navigate to login page after logout
    window.location.href = "/login";
  };

  return (
    <BrowserRouter>
      <div className="app-shell min-h-screen font-sans text-gray-900">
        <Navbar isLoggedIn={isLoggedIn} currentUser={currentUser} userRole={userRole} onLogout={handleLogout} />
        <main className="container mx-auto px-4 py-6 relative">
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route
              path="/"
              element={
                <Home
                  events={events}
                  setEvents={setEvents}
                  currentUser={currentUser}
                  userRole={userRole}
                  showToast={showToast}
                />
              }
            />
            <Route path="/create" element={
              <ProtectedRoute
                isLoggedIn={isLoggedIn}
                userRole={userRole}
              >
                <CreateEvent setEvents={setEvents} currentUser={currentUser} userRole={userRole} showToast={showToast} />
              </ProtectedRoute>
            } />
            <Route path="/edit/:id" element={
              <ProtectedRoute
                isLoggedIn={isLoggedIn}
                userRole={userRole}
              >
                <EditEvent events={events} setEvents={setEvents} currentUser={currentUser} userRole={userRole} showToast={showToast} />
              </ProtectedRoute>
            } />
            <Route path="/event/:id" element={<EventDetails events={events} currentUser={currentUser} userRole={userRole} showToast={showToast} />} />
          </Routes>
        </main>
        
        {/* Toast Notification */}
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={hideToast} 
          />
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
