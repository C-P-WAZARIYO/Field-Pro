import React from 'react';
import '../styles/Home.css';
import { Link } from 'react-router-dom';


const Home = () => {
  return (
    <div className="home-wrapper">
      {/* NAVIGATION BAR */}
      <nav className="navbar">
        <div className="nav-logo">
          <span className="logo-icon">📊</span>
          <span className="logo-text">FinTrack<span className="text-blue-600">AI</span></span>
        </div>
        <div className="nav-links">
          <Link to="/blog" className="nav-item">Blog</Link>
          <Link to="/features" className="nav-item">Features</Link>
          <Link to="/auth/signup" className="nav-btn signup">Sign Up</Link>
          <Link to="/auth/login" className="nav-btn login">Login</Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <h1>Analytics Built for <span className="highlight">Finance Operations</span></h1>
          <p>Track field performance, verify visits with GPS accuracy, and manage case allocations in one secure dashboard.</p>
          <div className="hero-btns">
            <Link to="/features" className="btn-primary">
  Explore Features
</Link>
            <button className="btn-secondary">View Demo</button>
          </div>
        </div>
        <div className="hero-image">
          {/* Placeholder for your app screenshot or professional illustration */}
          <div className="image-placeholder">
             <img src="/dashboard-preview.png" alt="Analytics Dashboard Preview" />
          </div>
        </div>
      </section>

      {/* QUICK INFO CARDS */}
      <section className="info-grid">
        <div className="info-card">
          <div className="icon">📍</div>
          <h3>GPS Verification</h3>
          <p>Automatic location stamps on every feedback entry to ensure field honesty.</p>
        </div>
        <div className="info-card">
          <div className="icon">📈</div>
          <h3>Smart Allocation</h3>
          <p>Managers can re-assign cases instantly based on employee workload.</p>
        </div>
        <div className="info-card">
          <div className="icon">🔔</div>
          <h3>Follow-up Alerts</h3>
          <p>Never miss a critical account with automated priority reminders.</p>
        </div>
      </section>
    </div>
  );
};

export default Home;