import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

function Navbar({ isLoggedIn, currentUser, userRole, onLogout }) {
  const location = useLocation();
  
  const [open, setOpen] = useState(false);

  return (
    <nav className="surface-card gradient-border shadow-md sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-indigo-500 via-cyan-500 to-pink-500 text-white p-2 rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <Link to="/" aria-label="EventHub home" className="text-xl font-extrabold gradient-text tracking-tight">
              EventHub
            </Link>
          </div>
          
          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className={`font-medium px-3 py-1.5 rounded-full transition-all ${location.pathname === '/' ? "gradient-chip text-indigo-700" : "text-gray-600 hover:text-blue-600 hover:bg-white/70"}`}
            >
              Home
            </Link>
            {isLoggedIn && (
              <Link 
                to="/create" 
                className={`font-medium px-3 py-1.5 rounded-full transition-all ${location.pathname === '/create' ? "gradient-chip text-indigo-700" : "text-gray-600 hover:text-blue-600 hover:bg-white/70"}`}
              >
                Create Event
              </Link>
            )}
          </div>

          {/* User Info and Logout */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Welcome, <span className="font-medium text-gray-800">{currentUser}</span>
                  </span>
                  {userRole === 'admin' && (
                    <span className="px-2.5 py-0.5 gradient-chip text-indigo-700 text-xs rounded-full font-medium">
                      Admin
                    </span>
                  )}
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-1 text-gray-600 hover:text-red-600 hover:bg-white/70 px-2.5 py-1.5 rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium">Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1.5 rounded-full hover:bg-white/70 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Login</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              className="p-2 rounded-md text-gray-600 hover:bg-white/80"
            >
              {open ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Links */}
          {open && (
            <div className="absolute right-4 top-16 w-44 surface-card gradient-border rounded-xl shadow-lg py-2 md:hidden">
              <Link to="/" onClick={() => setOpen(false)} className={`block px-4 py-2 text-sm transition-colors ${location.pathname === '/' ? "text-indigo-700 font-medium" : "text-gray-600 hover:text-blue-600"}`}>Home</Link>
              <Link to="/create" onClick={() => setOpen(false)} className={`block px-4 py-2 text-sm transition-colors ${location.pathname === '/create' ? "text-indigo-700 font-medium" : "text-gray-600 hover:text-blue-600"}`}>Create Event</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
