import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Download, Upload, Bell, ToggleRight, ToggleLeft, Lock,
  FileText, TrendingUp, AlertCircle, MapPin, Clock, CheckCircle, XCircle, Search, Plus
} from 'lucide-react';
import API from '../api/axios';
import ComplianceFooter from '../components/ComplianceFooter';

// Import custom styles
import '../styles/ManagerPageNew.css';

const ManagerPageNew = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // ===== HELPER FUNCTIONS =====
  const normalizeRole = (role) => {
    if (!role) return '';
    return role.toLowerCase().replace(/_/g, ' ').trim();
  };

  const isAdminUser = (emp) => {
    if (!emp) return false;
    if (emp.roles && Array.isArray(emp.roles)) {
      return emp.roles.some(r => {
        const roleName = r?.role?.name || r?.name;
        const normalized = normalizeRole(roleName);
        return normalized === 'admin' || normalized === 'super admin';
      });
    }
    if (emp.role && typeof emp.role === 'object') {
      const normalized = normalizeRole(emp.role.name);
      return normalized === 'admin' || normalized === 'super admin';
    }
    if (typeof emp.role === 'string') {
      const normalized = normalizeRole(emp.role);
      return normalized === 'admin' || normalized === 'super admin';
    }
    return false;
  };

  // State
  const [employees, setEmployees] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [searchEmp, setSearchEmp] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [allocationFile, setAllocationFile] = useState(null);
  const [payoutGrid, setPayoutGrid] = useState([]);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutFormData, setPayoutFormData] = useState({
    employee_id: '', amount: '', commission_percent: '', bonus: '', deductions: '', description: ''
  });

  const [reportType, setReportType] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const [notifications, setNotifications] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackFilter, setFeedbackFilter] = useState('unresolved');

  // ===== FETCH FUNCTIONS =====
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: 1, limit: 100,
        ...(searchEmp && { search: searchEmp }),
        ...(filterStatus && { isActive: filterStatus })
      });
      const res = await API.get(`/admin/employees?${params}`);
      let empData = Array.isArray(res.data.data) ? res.data.data : [];
      empData = empData.filter(emp => !isAdminUser(emp));
      
      setEmployees(empData);
      setTotalEmployees(empData.length);
      setError(null);
    } catch (err) {
      setError('Failed to fetch employees: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [searchEmp, filterStatus]);

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await API.get(`/case/feedback?status=${feedbackFilter}`);
      setFeedbackList(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      setFeedbackList([]);
    }
  }, [feedbackFilter]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await API.get('/admin/audit-logs?page=1&limit=20');
      const logs = Array.isArray(res.data.data) ? res.data.data : [];
      const filterAlerts = logs.filter(log => 
        log.action?.includes('GPS') || log.action?.includes('FAULTY') || 
        log.action?.includes('ERROR') || log.action?.includes('VIOLATION')
      );
      setAlerts(filterAlerts.slice(0, 10));
      setNotifications(logs.slice(0, 5));
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') fetchEmployees();
    else if (activeTab === 'feedback') fetchFeedback();
    else if (activeTab === 'alerts') fetchNotifications();
  }, [activeTab, fetchEmployees, fetchFeedback, fetchNotifications]);

  // ===== HANDLERS =====
  const handleToggleEmployee = async (employeeId, currentStatus) => {
    try {
      await API.put(`/admin/employees/${employeeId}/status`, { isActive: !currentStatus });
      setSuccess('Employee status updated');
      fetchEmployees();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update employee status');
    }
  };

  const handleUploadAllocation = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);
    try {
      await API.post('/manager/upload-allocation', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Allocation file uploaded successfully');
      setAllocationFile(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to upload allocation file: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayout = async (e) => {
    e.preventDefault();
    if (!payoutFormData.employee_id || !payoutFormData.amount) {
      setError('Employee ID and Amount are required');
      return;
    }
    try {
      await API.post('/manager/payout-grid', payoutFormData);
      setSuccess('Payout record added');
      setPayoutFormData({ employee_id: '', amount: '', commission_percent: '', bonus: '', deductions: '', description: '' });
      setShowPayoutForm(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to add payout record');
    }
  };

  const handleDownloadReport = async () => {
    try {
      const params = {
        reportType,
        month: reportType === 'monthly' ? selectedMonth : undefined,
        week: reportType === 'weekly' ? selectedMonth : undefined,
        date: reportType === 'daily' ? selectedMonth : undefined
      };
      const res = await API.get('/manager/reports', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentChild.removeChild(link);
      setSuccess('Report downloaded');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to download report');
    }
  };

  return (
    <div className="manager-container">
      {/* Header */}
      <header className="manager-header">
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h1>Manager Workspace</h1>
          <p>Operations & Allocations Command Center</p>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        
        {/* Alerts */}
        {error && (
          <div className="status-msg status-error">
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
          </div>
        )}
        {success && (
          <div className="status-msg status-success">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <nav className="tab-nav">
          {[
            { id: 'overview', label: 'Employee Overview', icon: Users },
            { id: 'allocation', label: 'Allocation & Payout', icon: FileText },
            { id: 'reports', label: 'Reports', icon: Download },
            { id: 'feedback', label: 'Feedback', icon: CheckCircle },
            { id: 'alerts', label: 'System Alerts', icon: Bell },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ============ EMPLOYEE OVERVIEW TAB ============ */}
        {activeTab === 'overview' && (
          <div>
            <div className="metric-grid">
              <div className="metric-card">
                <div className="metric-label">Total Staff</div>
                <div className="metric-value">{totalEmployees}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Active Today</div>
                <div className="metric-value" style={{ color: '#10b981' }}>
                  {employees.filter(e => e.lastLoginAt && new Date(e.lastLoginAt).toDateString() === new Date().toDateString()).length}
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Active (7 Days)</div>
                <div className="metric-value" style={{ color: '#c084fc' }}>
                  {employees.filter(e => {
                    const lastLogin = new Date(e.lastLoginAt);
                    return (new Date() - lastLogin) / (1000 * 60 * 60 * 24) <= 7;
                  }).length}
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Inactive</div>
                <div className="metric-value" style={{ color: '#ef4444' }}>
                  {employees.filter(e => !e.isActive).length}
                </div>
              </div>
            </div>

            <div className="form-container" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1', position: 'relative', minWidth: '250px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search by name, email, emp_id..."
                  value={searchEmp}
                  onChange={(e) => setSearchEmp(e.target.value)}
                  className="emp-input"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
              <select className="emp-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: 'auto', minWidth: '150px' }}>
                <option value="">All Status</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>

            <div className="manager-table-container">
              <table className="manager-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Emp ID</th>
                    <th>Last Login</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading database...</td></tr>
                  ) : employees.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No employees found</td></tr>
                  ) : (
                    employees.map(emp => (
                      <tr key={emp.id}>
                        <td style={{ fontWeight: '800', color: '#fff' }}>{emp.firstName} {emp.lastName}</td>
                        <td>{emp.email}</td>
                        <td>{emp.emp_id || 'N/A'}</td>
                        <td>{emp.lastLoginAt ? new Date(emp.lastLoginAt).toLocaleDateString() : 'Never'}</td>
                        <td>
                          <span style={{ color: emp.isActive ? '#10b981' : '#ef4444', fontWeight: '800', fontSize: '0.8rem' }}>
                            {emp.isActive ? '● ACTIVE' : '○ INACTIVE'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleEmployee(emp.id, emp.isActive)}
                            disabled={isAdminUser(emp)}
                            className="btn-action"
                            style={emp.isActive && !isAdminUser(emp) ? { color: '#ef4444', borderColor: '#ef4444' } : {}}
                          >
                            {isAdminUser(emp) ? (
                              <><Lock size={14} /> Admin</>
                            ) : emp.isActive ? (
                              <><ToggleRight size={14} /> Suspend</>
                            ) : (
                              <><ToggleLeft size={14} /> Activate</>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============ ALLOCATION & PAYOUT TAB ============ */}
        {activeTab === 'allocation' && (
          <div>
            <div className="form-container">
              <h3 className="form-header"><Upload size={20} /> Bulk Allocation Upload</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Upload CSV/Excel file. Required headers: <code>emp_id, area, target_cases</code>
              </p>
              
              <div className="upload-zone">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    setAllocationFile(e.target.files?.[0]);
                    handleUploadAllocation(e);
                  }}
                  id="allocationInput"
                  style={{ display: 'none' }}
                />
                <label htmlFor="allocationInput" className="btn-primary" style={{ display: 'inline-flex', width: 'auto', padding: '1rem 2rem' }}>
                  Select File from Computer
                </label>
                {allocationFile && (
                  <p style={{ marginTop: '1rem', color: '#c084fc', fontWeight: '600' }}>{allocationFile.name}</p>
                )}
              </div>
            </div>

            <div className="form-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 className="form-header" style={{ margin: 0 }}><FileText size={20} /> Payout Ledger</h3>
                <button onClick={() => setShowPayoutForm(!showPayoutForm)} className="btn-primary">
                  <Plus size={16} /> Add Record
                </button>
              </div>

              {showPayoutForm && (
                <form onSubmit={handleAddPayout} style={{ background: '#020617', padding: '1.5rem', borderRadius: '12px', border: '1px solid #1e293b', marginBottom: '2rem' }}>
                  <div className="form-grid">
                    <input type="text" placeholder="Employee ID" value={payoutFormData.employee_id} onChange={(e) => setPayoutFormData({ ...payoutFormData, employee_id: e.target.value })} className="emp-input" required />
                    <input type="number" placeholder="Amount (₹)" value={payoutFormData.amount} onChange={(e) => setPayoutFormData({ ...payoutFormData, amount: e.target.value })} className="emp-input" required />
                    <input type="number" placeholder="Commission %" value={payoutFormData.commission_percent} onChange={(e) => setPayoutFormData({ ...payoutFormData, commission_percent: e.target.value })} className="emp-input" />
                    <input type="number" placeholder="Bonus (₹)" value={payoutFormData.bonus} onChange={(e) => setPayoutFormData({ ...payoutFormData, bonus: e.target.value })} className="emp-input" />
                    <input type="number" placeholder="Deductions (₹)" value={payoutFormData.deductions} onChange={(e) => setPayoutFormData({ ...payoutFormData, deductions: e.target.value })} className="emp-input" />
                  </div>
                  <textarea placeholder="Description / Notes" value={payoutFormData.description} onChange={(e) => setPayoutFormData({ ...payoutFormData, description: e.target.value })} className="emp-area" style={{ marginBottom: '1rem' }} />
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>Process Record</button>
                    <button type="button" onClick={() => setShowPayoutForm(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                  </div>
                </form>
              )}

              <div className="manager-table-container">
                <table className="manager-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Base Amount</th>
                      <th>Commission</th>
                      <th>Bonus</th>
                      <th>Deductions</th>
                      <th>Net Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payoutGrid.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No payout records found.</td></tr>
                    ) : (
                      payoutGrid.map((record, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '800', color: '#fff' }}>{record.employee_id}</td>
                          <td>₹{record.amount}</td>
                          <td>{record.commission_percent}%</td>
                          <td style={{ color: '#10b981' }}>+ ₹{record.bonus}</td>
                          <td style={{ color: '#ef4444' }}>- ₹{record.deductions}</td>
                          <td style={{ fontWeight: '900', color: '#c084fc', fontSize: '1.1rem' }}>
                            ₹{(parseFloat(record.amount) + parseFloat(record.bonus || 0) - parseFloat(record.deductions || 0)).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============ REPORTS TAB ============ */}
        {activeTab === 'reports' && (
          <div className="form-container">
            <h3 className="form-header"><Download size={20} /> Data Export</h3>
            
            <div className="form-grid" style={{ alignItems: 'end', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: '700' }}>REPORT TYPE</label>
                <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="emp-select">
                  <option value="daily">Daily Report</option>
                  <option value="weekly">Weekly Report</option>
                  <option value="monthly">Monthly Report</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: '700' }}>
                  {reportType === 'daily' ? 'SELECT DATE' : reportType === 'weekly' ? 'SELECT WEEK' : 'SELECT MONTH'}
                </label>
                <input
                  type={reportType === 'daily' ? 'date' : 'month'}
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="emp-input"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <button onClick={handleDownloadReport} className="btn-primary" style={{ height: '45px' }}>
                <Download size={16} /> Generate CSV
              </button>
            </div>

            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1.5rem' }}>
              <h4 style={{ color: '#fff', fontWeight: '700', marginBottom: '1rem' }}>Available Templates</h4>
              <div className="metric-grid">
                {[
                  { name: 'Employee Performance', desc: 'Cases handled, recovery amount, total earnings.' },
                  { name: 'Payout Summary', desc: 'All salary components and final net payable amounts.' },
                  { name: 'Attendance & Activity', desc: 'Login frequency, active hours, and system alerts.' },
                ].map((report, idx) => (
                  <div key={idx} style={{ padding: '1.5rem', border: '1px solid #334155', borderRadius: '12px', background: '#020617' }}>
                    <p style={{ fontWeight: '800', color: '#c084fc', marginBottom: '0.5rem' }}>{report.name}</p>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{report.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============ FEEDBACK TAB ============ */}
        {activeTab === 'feedback' && (
          <div className="manager-table-container">
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontWeight: '800', color: '#fff' }}>Field Feedback</h3>
              <select value={feedbackFilter} onChange={(e) => setFeedbackFilter(e.target.value)} className="emp-select" style={{ width: 'auto', padding: '0.4rem 1rem' }}>
                <option value="unresolved">Pending Resolution</option>
                <option value="resolved">Resolved Cases</option>
                <option value="all">View All</option>
              </select>
            </div>

            <table className="manager-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {feedbackList.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No feedback in this category.</td></tr>
                ) : (
                  feedbackList.map(feedback => (
                    <tr key={feedback.id}>
                      <td style={{ fontWeight: '800', color: '#fff' }}>{feedback.user?.firstName} {feedback.user?.lastName}</td>
                      <td>{feedback.title || 'N/A'}</td>
                      <td>{feedback.category || 'General'}</td>
                      <td>
                        <span style={{ color: feedback.resolved ? '#10b981' : '#f59e0b', fontWeight: '800', fontSize: '0.8rem' }}>
                          {feedback.resolved ? '● RESOLVED' : '○ PENDING'}
                        </span>
                      </td>
                      <td>{new Date(feedback.createdAt).toLocaleDateString()}</td>
                      <td><button className="btn-action"><CheckCircle size={14}/> View</button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ============ ALERTS TAB ============ */}
        {activeTab === 'alerts' && (
          <div>
            <div className="metric-grid">
              
              {/* Critical Alerts */}
              <div className="form-container" style={{ marginBottom: 0 }}>
                <h3 className="form-header" style={{ color: '#ef4444' }}><AlertCircle size={20} /> Critical Flags</h3>
                <div className="alert-list">
                  {alerts.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>System clear. No critical alerts.</p>
                  ) : (
                    alerts.map(alert => (
                      <div key={alert.id} className="alert-item critical">
                        <p className="alert-title">{alert.action}</p>
                        <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.2rem' }}>User: {alert.user?.username}</p>
                        <p className="alert-meta">{new Date(alert.createdAt).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* General Notifications */}
              <div className="form-container" style={{ marginBottom: 0 }}>
                <h3 className="form-header" style={{ color: '#3b82f6' }}><Bell size={20} /> System Logs</h3>
                <div className="alert-list">
                  {notifications.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No recent logs.</p>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className="alert-item info">
                        <p className="alert-title">{notif.action}</p>
                        <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.2rem' }}>{notif.resource}</p>
                        <p className="alert-meta">{new Date(notif.createdAt).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="form-container" style={{ marginTop: '1.5rem' }}>
              <h4 style={{ color: '#fff', fontWeight: '700', marginBottom: '1rem' }}>Alert Legend</h4>
              <div className="metric-grid">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <MapPin size={24} style={{ color: '#ef4444' }} />
                  <div>
                    <p style={{ fontWeight: '800', color: '#fff' }}>GPS Variance</p>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Login detected outside of assigned geofence.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <XCircle size={24} style={{ color: '#f97316' }} />
                  <div>
                    <p style={{ fontWeight: '800', color: '#fff' }}>Data Fault</p>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Inconsistent data or failed media upload.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <Clock size={24} style={{ color: '#eab308' }} />
                  <div>
                    <p style={{ fontWeight: '800', color: '#fff' }}>Time Anomaly</p>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Unusual login hours or excessive idle time.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
      <ComplianceFooter />
    </div>
  );
};

export default ManagerPageNew;