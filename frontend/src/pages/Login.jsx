import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "user"
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Mock authentication - accept any login for demo purposes
    // In production, this would validate against a backend
    const user = {
      username: formData.username,
      role: formData.role
    };

    onLogin(user);
    navigate("/");
  };

  const inputClasses = (fieldName) => `
    w-full px-4 py-2.5 border rounded-xl bg-white/90 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all outline-none
    ${errors[fieldName] ? "border-red-500 bg-red-50/90" : "border-slate-300/80 hover:border-cyan-400/60"}
  `;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="surface-card gradient-border rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-indigo-500 via-cyan-500 to-pink-500 text-white p-3 rounded-lg inline-block mb-4 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold gradient-text">Welcome to EventHub</h1>
            <p className="text-slate-500 mt-2">Sign in to manage your events</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                className={inputClasses("username")}
              />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className={inputClasses("password")}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Select Role <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={inputClasses("role")}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <p className="text-gray-500 text-xs mt-1">
                {formData.role === "admin"
                  ? "Admin can manage all events"
                  : "User can create own events and RSVP"}
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full btn-gradient px-6 py-3 rounded-lg font-medium transition-all shadow-md flex items-center justify-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Sign In</span>
              </button>
            </div>
          </form>

          {/* Demo Info */}
          <div className="mt-6 p-4 rounded-xl soft-gradient-panel border border-white/70">
            <p className="text-sm text-slate-600 font-medium mb-2">Demo Accounts:</p>
            <div className="text-xs text-slate-500 space-y-1">
              <p>- Admin: username "admin" + any password</p>
              <p>- User: username "user" + any password</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
