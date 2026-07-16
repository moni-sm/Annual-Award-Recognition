import React, { useEffect, useState } from "react";
import axios from "axios";
import "../App.css";

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    division: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [divisionsList, setDivisionsList] = useState([]);
  const [divisionsLoading, setDivisionsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        setDivisionsLoading(true);
        const response = await axios.get(`${baseUrl}/employees/divisions`);
        setDivisionsList(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Failed to load divisions:", err);
        setDivisionsList([]);
      } finally {
        setDivisionsLoading(false);
      }
    };

    fetchDivisions();
  }, [baseUrl]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await axios.post(`${baseUrl}/auth/login`, formData);

      setMessage({ text: response.data.message, type: "success" });
      
      // Pass the authenticated user data back up to App.jsx
      setTimeout(() => {
        onLoginSuccess(response.data.user);
      }, 1000);
      
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Authentication failed. Please try again.";
      setMessage({ text: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <p className="login-subtitle">
          First time logging in? Enter a password to register and activate your account.
        </p>

        {message.text && (
          <div className={`message-banner ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="division">Division</label>
          <select
            name="division"
            id="division"
            required
            value={formData.division}
            onChange={handleChange}
          >
            <option value="">
              {divisionsLoading ? "Loading divisions..." : "-- Select Division --"}
            </option>
            {divisionsList.map((div) => (
              <option key={div} value={div}>
                {div}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="email"> Email Id</label>
          <input
            type="email"
            name="email"
            id="email"
            placeholder="name@conceptia.in"
            required
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              id="password"
              placeholder="Enter your password"
              required
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🔓"  : "🔒" }
            </button>
          </div>
        </div>

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? "Authenticating..." : "Login / Register"}
        </button>
      </form>
    </div>
  );
};

export default Login;