import React from 'react';
import '../styles/Features.css';
import { Link } from 'react-router-dom';

const Features = () => {
  return (
    <div className="features-container">
      {/* Header Section */}
      <header className="features-header">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Scalable Solutions for Every Team</h1>
        <p className="text-lg text-slate-600">Choose the plan that fits your operational needs.</p>
      </header>

      {/* Pricing Toggle/Cards */}
      <section className="pricing-section">
        <div className="pricing-grid">
          
          {/* Plan 1: Standard */}
          <div className="pricing-card">
            <div className="card-header">
              <h2 className="plan-name">Standard</h2>
              <div className="price">
                <span className="currency">₹</span>
                <span className="amount">399</span>
                <span className="period">/per user/mo</span>
              </div>
              <p className="plan-desc">Essential tracking for small field teams.</p>
            </div>
            <ul className="plan-features">
              <li>✅ Basic Case Allocation</li>
              <li>✅ GPS Location Verification</li>
              <li>✅ Employee Feedback Forms</li>
              <li>✅ Standard Reporting</li>
              <li>❌ Multi-level Management</li>
              <li>❌ API Access</li>
            </ul>
            <button className="plan-btn-outline">Choose Standard</button>
          </div>

          {/* Plan 2: Enterprise (Highlighted) */}
          <div className="pricing-card featured">
            <div className="badge">Most Popular</div>
            <div className="card-header">
              <h2 className="plan-name">Enterprise</h2>
              <div className="price">
                <span className="currency">₹</span>
                <span className="amount">799</span>
                <span className="period">/per user/mo</span>
              </div>
              <p className="plan-desc">Advanced analytics for large operations.</p>
            </div>
            <ul className="plan-features">
              <li>✅ Everything in Standard</li>
              <li>✅ Dynamic Analytics Dashboard</li>
              <li>✅ Live Location Tracking Map</li>
              <li>✅ Case Re-allocation Tools</li>
              <li>✅ Photo Upload with GPS Metadata</li>
              <li>✅ Admin Audit Logs</li>
              <li>✅ Real-time WhatsApp Group Integration</li>
<li>✅ Automated "Anomaly" Alerts to Managers</li>
            </ul>
            <button className="plan-btn-solid">Get Started</button>
          </div>
          


        </div>
        <div className="trial-banner">
            <div className="trial-content">
                <span className="badge-new">SPECIAL OFFER</span>
                <h3>Start your Pilot Program: <strong>₹7,000</strong> for up to <strong>50 Users</strong></h3>
                <p>Get full Enterprise access for 30 days. No long-term commitment required.</p>
            </div>
            <button className="trial-btn">Start 1-Month Trial</button>
        </div>
      </section>

      {/* In-Depth Features Detail */}
      <section className="detail-section">
        <h2 className="text-3xl font-bold text-center mb-12">Deep Dive into Features</h2>
        <div className="detail-grid">
          <div className="detail-item">
            <h3>📍 Intelligent Geofencing</h3>
            <p>Our system cross-references feedback locations. If an employee submits multiple cases from the same coordinate, the manager gets an instant "Anomaly" alert.</p>
          </div>
          <div className="detail-item">
            <h3>🔄 Seamless Re-allocation</h3>
            <p>Manager dashboard allows for bulk moving of accounts. Move 100 cases from an absent employee to "In-House" or a different user with one click.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Features;