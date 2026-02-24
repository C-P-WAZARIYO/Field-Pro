import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Import the new styles
import '../styles/commonDashboard.css';

// Role pages
import EmployeeDashboard from './EmployeeDashboard';
import Analytic from './Analytic';
import ManagerPageNew from './ManagerPageNew';

import ReferralDashboard from './ReferralDashboard';
import AdminDashboard from './AdminDashboardRewrite';
import SupervisorDashboard from './SupervisorDashboard';

const CommonDashboard = () => {
  const { user, logout } = useAuth(); // Destructured logout here for cleaner code
  const navigate = useNavigate();

  const getRoleNames = (user) => {
    if (!user) return [];
    if (Array.isArray(user.roles) && user.roles.length > 0) {
      return user.roles.map(r => (r?.role?.name || r?.name || r));
    }
    if (user.role) return [user.role];
    return [];
  };

  const roles = getRoleNames(user);

  // Helper to normalize role names (handles all variations)
  const normalizeRole = (role) => {
    if (!role) return '';
    return role.toLowerCase().replace(/_/g, ' ').trim();
  };

  // Role priority logic
  const isAdmin = roles.some(r => {
    const normalized = normalizeRole(r);
    return normalized === 'admin' || normalized === 'super admin';
  });
  const isManager = roles.some(r => normalizeRole(r) === 'manager');
  const isSupervisor = roles.some(r => normalizeRole(r) === 'supervisor');
  const isAnalytic = roles.some(r => {
    const normalized = normalizeRole(r);
    return ['analytic', 'analyst'].includes(normalized);
  });
  const isEmployee = roles.some(r => normalizeRole(r) === 'employee');
  const isExecutive = roles.some(r => normalizeRole(r) === 'executive');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (err) {
      console.error('Logout failed', err);
      navigate('/auth/login');
    }
  };

  const renderByRole = () => {
    if (isAdmin) return <AdminDashboard />;
    if (isManager) return <ManagerPageNew />;
    if (isSupervisor) return <SupervisorDashboard />;
    if (isAnalytic) return <Analytic />;
    if (isEmployee) return <EmployeeDashboard />;
    if (isExecutive) return <EmployeeDashboard />;
    
    // Default fallback (Welcome Card)
    return (
      <div className="welcome-card">
        <h2 className="welcome-title">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
        </h2>
        <p className="welcome-text">
          Select an area below or check your specific role dashboard.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => navigate('/profile')} className="btn-primary">
            Go to Profile
          </button>
          <button onClick={() => navigate('/blog')} className="btn-secondary">
            Read Blog
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        
        {/* Header Section */}
        <div className="dashboard-header">
          <div className="header-title">
            <h1>Dashboard</h1>
            <p className="header-subtitle">Role-based workspace</p>
          </div>
          
          <div className="user-badge">
            <div className="user-name">
              {user?.firstName || user?.username || user?.email || 'User'}
            </div>
            <div className="user-role">
              {roles.length > 0 ? roles.join(' • ') : 'No Active Role'}
            </div>
          </div>
        </div>

        {/* Main Role Content */}
        {renderByRole()}

        {/* Bottom Action Bar */}
        <div className="action-bar">
          <button onClick={() => navigate('/profile')} className="btn-primary">
            My Profile
          </button>
          <button onClick={() => navigate('/blog')} className="btn-secondary">
            Internal Blog
          </button>
          <button onClick={handleLogout} className="btn-danger">
            Sign Out
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default CommonDashboard;