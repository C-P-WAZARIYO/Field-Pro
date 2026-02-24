import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import "../styles/Auth.css";

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Route decides mode (single source of truth)
  const isLogin = location.pathname === "/auth/login";

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    emp_id: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        // LOGIN
        const result = await login(formData.email, formData.password);

        if (result.success) {
          navigate("/dashboard");
        } else {
          alert(result.message);
        }
      } else {
        // SIGNUP
        await API.post("/auth/register", formData);
        alert("Account created successfully");
        navigate("/auth/login");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <h2>{isLogin ? "Welcome Back, CP" : "Join the Pilot"}</h2>

        <p className="subtitle">
          {isLogin
            ? "Log in to access your analytics"
            : "Start your ₹7,000 trial today"}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input
                name="firstName"
                type="text"
                placeholder="First Name"
                required
                onChange={handleChange}
              />

              <input
                name="lastName"
                type="text"
                placeholder="Last Name"
                required
                onChange={handleChange}
              />

              <input
                name="username"
                type="text"
                placeholder="Username"
                required
                onChange={handleChange}
              />
              <input
                name="phone"
                type="tel"
                placeholder="Phone (10 digits)"
                required
                onChange={handleChange}
              />

              <input
                name="emp_id"
                type="text"
                placeholder="Employee ID (optional)"
                onChange={handleChange}
              />
            </>
          )}

          <input
            name="email"
            type="email"
            placeholder="Email Address"
            required
            onChange={handleChange}
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            onChange={handleChange}
          />

          <button className="auth-button" type="submit">
            {isLogin ? "Login to Dashboard" : "Create Admin Account"}
          </button>
        </form>

        <p className="auth-toggle-text">
          {isLogin ? "New here?" : "Already registered?"}
          <span
            onClick={() =>
              navigate(isLogin ? "/auth/signup" : "/auth/login")
            }
          >
            {isLogin ? " Sign up for the Trial" : " Back to Login"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Auth;
