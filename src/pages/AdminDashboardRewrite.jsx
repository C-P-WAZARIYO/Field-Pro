import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, BarChart3, Lock, Activity, Search, Plus, 
  LogOut, TrendingUp, Clock 
} from 'lucide-react';
import API from '../api/axios';
import ComplianceFooter from '../components/ComplianceFooter';

import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('employees');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Employees State
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterRole, setFilterRole] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [totalPages, setTotalPages] = useState(1);

  // Create User
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '', username: '', password: '', firstName: '', lastName: '', emp_id: '', roleId: ''
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);

  // Online Users
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Roles & Permissions
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [showNewRole, setShowNewRole] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '', permissionIds: [] });

  // Activity & Performance
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [visitedCases, setVisitedCases] = useState([]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'employees') {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, activeTab]);

  // API Calls
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage, limit: 10, search: searchTerm,
        ...(filterRole && { role: filterRole }),
        ...(filterActive !== '' && { isActive: filterActive }),
        sortBy, sortOrder,
      });
      const res = await API.get(`/admin/employees?${params}`);
      setEmployees(Array.isArray(res.data.data) ? res.data.data : []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch employees');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterRole, filterActive, sortBy, sortOrder]);

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/admin/audit-logs?page=${auditPage}&limit=20`);
      setAuditLogs(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      setError('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [auditPage]);

  const fetchOnlineUsers = useCallback(async () => {
    try {
      const res = await API.get('/admin/online-users');
      setOnlineUsers(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      setOnlineUsers([]);
    }
  }, []);

  const fetchRolesPermissions = useCallback(async () => {
    try {
      const res = await API.get('/admin/roles-permissions');
      setRoles(Array.isArray(res.data.data?.roles) ? res.data.data.roles : []);
      setPermissions(Array.isArray(res.data.data?.permissions) ? res.data.data.permissions : []);
    } catch (err) {
      setRoles([]); setPermissions([]);
    }
  }, []);

  const fetchPerformance = useCallback(async () => {
    try {
      const res = await API.get('/admin/performance-analytics');
      const metricsData = res.data.data;
      setPerformanceMetrics(Array.isArray(metricsData?.metrics) ? metricsData.metrics : Array.isArray(metricsData) ? metricsData : []);
    } catch (err) {
      setPerformanceMetrics([]);
    }
  }, []);

  const fetchVisitedCases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/cases/visited?limit=50&offset=0');
      setVisitedCases(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      setVisitedCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Effects for Tabs
  useEffect(() => {
    if (activeTab === 'employees') fetchEmployees();
    if (activeTab === 'logs') fetchAuditLogs();
    if (activeTab === 'sessions') {
      fetchOnlineUsers();
      const interval = setInterval(fetchOnlineUsers, 30000);
      return () => clearInterval(interval);
    }
    if (activeTab === 'permissions') fetchRolesPermissions();
    if (activeTab === 'performance') fetchPerformance();
    if (activeTab === 'visited') fetchVisitedCases();
  }, [activeTab, fetchEmployees, fetchAuditLogs, fetchOnlineUsers, fetchRolesPermissions, fetchPerformance]);

  // Handlers
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await API.post('/admin/employees', { ...formData, roleId: formData.roleId || undefined });
      setFormData({ email: '', username: '', password: '', firstName: '', lastName: '', emp_id: '', roleId: '' });
      setShowCreateForm(false);
      setCurrentPage(1);
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleUpdateRole = async (userId, roleIds) => {
    try {
      await API.put(`/admin/employees/${userId}/role`, { roleIds });
      fetchEmployees();
    } catch (err) {
      setError('Failed to update user role');
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      await API.post('/admin/roles', newRole);
      setNewRole({ name: '', description: '', permissionIds: [] });
      setShowNewRole(false);
      fetchRolesPermissions();
    } catch (err) {
      setError('Failed to create role');
    }
  };

  const handleLogoutUser = async (sessionId) => {
    try {
      await API.post(`/admin/sessions/${sessionId}/logout`);
      fetchOnlineUsers();
    } catch (err) {
      setError('Failed to logout user');
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h1>Admin Dashboard</h1>
          <p>Comprehensive System Management</p>
        </div>
      </header>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <a href="/leaderboard" className="btn-create" style={{ padding: '0.5rem 0.75rem' }}>Leaderboard</a>
        <a href="/executives" className="btn-create" style={{ padding: '0.5rem 0.75rem' }}>Executives</a>
      </div>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#fca5a5', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        <nav className="tab-nav">
          {[
            { id: 'employees', label: 'Employees', icon: Users },
            { id: 'logs', label: 'Audit Logs', icon: Activity },
            { id: 'sessions', label: 'Online Users', icon: Clock },
            { id: 'permissions', label: 'Roles', icon: Lock },
            { id: 'performance', label: 'Performance', icon: TrendingUp },
            { id: 'leaderboard', label: 'Leaderboard', icon: BarChart3 },
            { id: 'executives', label: 'Executives', icon: Users },
            { id: 'visited', label: 'Visited', icon: Activity },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setError(null); }}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* EMPLOYEES TAB */}
        {activeTab === 'employees' && (
          <div>
            <div className="form-container">
              <div className="filter-group">
                <div style={{ flex: '1', position: 'relative', minWidth: '250px' }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: '#64748b' }} />
                  <input
                    type="text"
                    placeholder="Search by email, username, emp_id..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="emp-input"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
                <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-create">
                  <Plus size={16} /> Create User
                </button>
              </div>

              <div className="filter-group">
                <select className="emp-select" value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }} style={{ flex: '1', minWidth: '150px' }}>
                  <option value="">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Employee">Employee</option>
                  <option value="Executive">Executive</option>
                </select>
                <select className="emp-select" value={filterActive} onChange={(e) => { setFilterActive(e.target.value); setCurrentPage(1); }} style={{ flex: '1', minWidth: '150px' }}>
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
                <select className="emp-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ flex: '1', minWidth: '150px' }}>
                  <option value="createdAt">Sort by Date</option>
                  <option value="lastLoginAt">Sort by Last Login</option>
                  <option value="username">Sort by Username</option>
                </select>
                <select className="emp-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ flex: '1', minWidth: '150px' }}>
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>

            {showCreateForm && (
              <div className="form-container">
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem' }}>Create New User</h3>
                <form onSubmit={handleCreateUser}>
                  <div className="form-grid">
                    <input type="email" placeholder="Email" className="emp-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                    <input type="text" placeholder="Username" className="emp-input" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                    <input type="password" placeholder="Password" className="emp-input" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                    <input type="text" placeholder="First Name" className="emp-input" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                    <input type="text" placeholder="Last Name" className="emp-input" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                    <input type="text" placeholder="Employee ID" className="emp-input" value={formData.emp_id} onChange={(e) => setFormData({ ...formData, emp_id: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className="btn-create" style={{ flex: 1, justifyContent: 'center' }}>Create User</button>
                    <button type="button" onClick={() => setShowCreateForm(false)} className="btn-cancel" style={{ flex: 1 }}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Emp ID</th>
                    <th>Roles</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
                  ) : employees.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No employees found</td></tr>
                  ) : (
                    employees.map(emp => (
                      <tr key={emp.id}>
                        <td style={{ fontWeight: '700', color: '#fff' }}>{emp.username}</td>
                        <td>{emp.email}</td>
                        <td>{emp.emp_id || '-'}</td>
                        <td>
                          <select className="emp-select" style={{ padding: '0.4rem', borderRadius: '6px' }} defaultValue={emp.roles[0]?.role?.id || ''} onChange={(e) => handleUpdateRole(emp.id, [e.target.value])}>
                            <option value="">Select Role</option>
                            {roles.map(r => ( <option key={r.id} value={r.id}>{r.name}</option> ))}
                          </select>
                        </td>
                        <td>
                          <span style={{ color: emp.isActive ? '#10b981' : '#ef4444', fontWeight: '800', fontSize: '0.8rem' }}>
                            {emp.isActive ? '● ACTIVE' : '○ INACTIVE'}
                          </span>
                        </td>
                        <td>{emp.lastLoginAt ? new Date(emp.lastLoginAt).toLocaleDateString() : 'Never'}</td>
                        <td><button className="btn-action">Edit</button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`page-btn ${currentPage === page ? 'active' : ''}`}>
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AUDIT LOGS TAB */}
        {activeTab === 'logs' && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No audit logs</td></tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: '700', color: '#fff' }}>{log.user?.username || 'System'}</td>
                      <td>{log.action}</td>
                      <td>{log.resource}</td>
                      <td style={{ opacity: 0.8 }}>{JSON.stringify(log.details).substring(0, 50)}...</td>
                      <td>{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ONLINE USERS TAB */}
        {activeTab === 'sessions' && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>IP Address</th>
                  <th>Time Online</th>
                  <th>Last Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {onlineUsers.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No online users</td></tr>
                ) : (
                  onlineUsers.map(session => (
                    <tr key={session.id}>
                      <td style={{ fontWeight: '700', color: '#fff' }}>{session.user?.username}</td>
                      <td>{session.ipAddress || 'Unknown'}</td>
                      <td style={{ color: '#10b981', fontWeight: '700' }}>{session.timeOnline}</td>
                      <td>{new Date(session.lastActiveAt).toLocaleTimeString()}</td>
                      <td>
                        <button onClick={() => handleLogoutUser(session.id)} className="btn-danger">
                          <LogOut size={14} /> Logout
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ROLES & PERMISSIONS TAB */}
        {activeTab === 'permissions' && (
          <div>
            <button onClick={() => setShowNewRole(!showNewRole)} className="btn-create" style={{ marginBottom: '1.5rem' }}>
              <Plus size={16} /> Create Role
            </button>

            {showNewRole && (
              <div className="form-container">
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem' }}>Create New Role</h3>
                <form onSubmit={handleCreateRole}>
                  <div className="form-grid">
                    <input type="text" placeholder="Role Name" className="emp-input" value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} required />
                    <input type="text" placeholder="Description" className="emp-input" value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className="btn-create" style={{ flex: 1, justifyContent: 'center' }}>Create</button>
                    <button type="button" onClick={() => setShowNewRole(false)} className="btn-cancel" style={{ flex: 1 }}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {roles.map(role => (
                <div key={role.id} className="role-card">
                  <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff', marginBottom: '0.5rem' }}>{role.name}</h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>{role.description}</p>
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.5rem' }}>PERMISSIONS:</p>
                    <div>
                      {role.permissions?.length > 0 ? (
                        role.permissions.map(rp => (
                          <span key={rp.permission.id} className="permission-badge">
                            {rp.permission.name}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>No permissions assigned.</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PERFORMANCE TAB */}
        {activeTab === 'performance' && (
          <div>
            <div className="metric-grid">
              <div className="metric-card">
                <div className="metric-label">Total Employees</div>
                <div className="metric-value">{performanceMetrics.length}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Total Cases</div>
                <div className="metric-value">
                  {performanceMetrics.reduce((sum, m) => sum + m.total_cases, 0)}
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Total Recovered</div>
                <div className="metric-value" style={{ color: '#10b981' }}>
                  ₹{(performanceMetrics.reduce((sum, m) => sum + m.recovered_pos, 0) / 100000).toFixed(1)}L
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Total Earnings</div>
                <div className="metric-value" style={{ color: '#38bdf8' }}>
                  ₹{performanceMetrics.reduce((sum, m) => sum + m.earnings, 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Cases</th>
                    <th>Visited</th>
                    <th>Recovered</th>
                    <th>Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceMetrics.map(metric => (
                    <tr key={metric.id}>
                      <td style={{ fontWeight: '700', color: '#fff' }}>{metric.executive?.username}</td>
                      <td>{metric.total_cases}</td>
                      <td>{metric.visited_cases}</td>
                      <td>₹{metric.recovered_pos.toLocaleString()}</td>
                      <td style={{ fontWeight: '800', color: '#10b981' }}>₹{metric.earnings.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'visited' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Visited Cases (Recent)</h3>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Acc ID</th>
                    <th>Customer</th>
                    <th>Bank</th>
                    <th>Product</th>
                    <th>Visits</th>
                    <th>Last Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {visitedCases.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No visited cases</td></tr>
                  ) : (
                    visitedCases.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: '700', color: '#fff' }}>{c.acc_id}</td>
                        <td>{c.customer_name}</td>
                        <td>{c.bank_name}</td>
                        <td>{c.product_type}</td>
                        <td>{c.visits}</td>
                        <td>{c.lastVisitAt ? new Date(c.lastVisitAt).toLocaleString() : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
      <ComplianceFooter />
    </div>
  );
};

export default AdminDashboard;