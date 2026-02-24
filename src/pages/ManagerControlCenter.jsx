import React, { useState } from 'react';
import {
  Users, ToggleRight, ToggleLeft, RefreshCw, FileDown, Grid3x3,
  Edit2, Check, X, Download, GripVertical
} from 'lucide-react';
import ComplianceFooter from '../components/ComplianceFooter';

const ManagerControlCenter = () => {
  const [activeTab, setActiveTab] = useState('employees');
  const [employees, setEmployees] = useState([
    { id: 1, empId: 'EMP001', name: 'Raj Kumar', role: 'Executive', isActive: true },
    { id: 2, empId: 'EMP002', name: 'Priya Singh', role: 'Supervisor', isActive: true },
    { id: 3, empId: 'EMP003', name: 'Amit Patel', role: 'Executive', isActive: false },
    { id: 4, empId: 'EMP004', name: 'Neha Sharma', role: 'HR', isActive: true },
  ]);

  const [caseReassignment, setCaseReassignment] = useState([
    { caseId: 'CASE001', accountId: 'ACC12345', customerName: 'John Doe', currentEmp: 'EMP001', status: 'VISITED' },
    { caseId: 'CASE002', accountId: 'ACC12346', customerName: 'Jane Smith', currentEmp: 'EMP002', status: 'PENDING' },
  ]);

  const [payoutGrids, setPayoutGrids] = useState([
    { id: 1, bank: 'HDFC', product: 'Agriculture', bkt: 'BKT-0', payoutPercent: 15 },
    { id: 2, bank: 'HDFC', product: 'Agriculture', bkt: 'BKT-1', payoutPercent: 12 },
    { id: 3, bank: 'ICICI', product: 'Wheels', bkt: 'SMA-0', payoutPercent: 20 },
  ]);

  const [editingGrid, setEditingGrid] = useState(null);
  const [newGrid, setNewGrid] = useState({
    bank: '',
    product: '',
    bkt: '',
    payoutPercent: ''
  });

  const toggleEmployeeStatus = (empId) => {
    setEmployees(employees.map(emp =>
      emp.id === empId ? { ...emp, isActive: !emp.isActive } : emp
    ));
  };

  const handleReassignCase = (caseId, newEmpId) => {
    setCaseReassignment(caseReassignment.map(c =>
      c.caseId === caseId ? { ...c, currentEmp: newEmpId } : c
    ));
  };

  const handleSavePayoutGrid = () => {
    if (editingGrid) {
      setPayoutGrids(payoutGrids.map(g =>
        g.id === editingGrid.id ? editingGrid : g
      ));
    } else if (newGrid.bank && newGrid.product && newGrid.bkt && newGrid.payoutPercent) {
      setPayoutGrids([...payoutGrids, { id: Date.now(), ...newGrid }]);
      setNewGrid({ bank: '', product: '', bkt: '', payoutPercent: '' });
    }
    setEditingGrid(null);
  };

  const downloadReport = (format) => {
    alert(`Downloading report in ${format} format...`);
    // Implementation would generate PDF/Excel
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Manager Control Center</h1>
          <p className="text-orange-100">Manage operations, employees, and payouts for Jaipur Pilot</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white rounded-lg p-2 shadow-md">
          {[
            { id: 'employees', label: 'Employee Management', icon: Users },
            { id: 'reassign', label: 'Case Re-assignment', icon: RefreshCw },
            { id: 'payout', label: 'Payout Grid', icon: Grid3x3 },
            { id: 'reporting', label: 'Master Reporting', icon: Download },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Employee Management Tab */}
        {activeTab === 'employees' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Employee Management</h2>
            <p className="text-gray-600 mb-6">Use the "Kill Switch" below to disable or enable employee access instantly.</p>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Employee ID</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Role</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Service Status</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id} className="border-b border-gray-200 hover:bg-gray-50 transition-all">
                      <td className="py-4 px-4 font-mono text-gray-800">{emp.empId}</td>
                      <td className="py-4 px-4 font-semibold text-gray-800">{emp.name}</td>
                      <td className="py-4 px-4 text-gray-600">{emp.role}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          emp.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {emp.isActive ? '✓ Active' : '✗ Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => toggleEmployeeStatus(emp.id)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                            emp.isActive
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'bg-green-100 text-green-600 hover:bg-green-200'
                          }`}
                        >
                          {emp.isActive ? (
                            <>
                              <ToggleLeft className="w-5 h-5" />
                              Disable
                            </>
                          ) : (
                            <>
                              <ToggleRight className="w-5 h-5" />
                              Enable
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Case Re-assignment Tab */}
        {activeTab === 'reassign' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Case Re-assignment</h2>
            <p className="text-gray-600 mb-6">Move cases from one employee to another if an employee is absent or underperforming.</p>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Case ID</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Account ID</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Customer</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Current Employee</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Re-assign To</th>
                  </tr>
                </thead>
                <tbody>
                  {caseReassignment.map(caseItem => (
                    <tr key={caseItem.caseId} className="border-b border-gray-200 hover:bg-gray-50 transition-all">
                      <td className="py-4 px-4 font-mono text-gray-800">{caseItem.caseId}</td>
                      <td className="py-4 px-4 font-mono text-gray-600">{caseItem.accountId}</td>
                      <td className="py-4 px-4 text-gray-800">{caseItem.customerName}</td>
                      <td className="py-4 px-4 text-gray-600">{caseItem.currentEmp}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          caseItem.status === 'VISITED' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {caseItem.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={caseItem.currentEmp}
                          onChange={(e) => handleReassignCase(caseItem.caseId, e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="EMP001">EMP001 - Raj Kumar</option>
                          <option value="EMP002">EMP002 - Priya Singh</option>
                          <option value="EMP003">EMP003 - Amit Patel</option>
                          <option value="EMP004">EMP004 - Neha Sharma</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payout Grid Tab */}
        {activeTab === 'payout' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Payout Grid Builder</h2>
            <p className="text-gray-600 mb-6">Define bank-wise, product-wise, and BKT-wise payout percentages.</p>

            {/* Add New Grid */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8 border-2 border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4">
                {editingGrid ? 'Edit Payout Rule' : 'Add New Payout Rule'}
              </h3>
              <div className="grid md:grid-cols-5 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Bank (e.g., HDFC)"
                  value={editingGrid?.bank || newGrid.bank}
                  onChange={(e) => editingGrid
                    ? setEditingGrid({ ...editingGrid, bank: e.target.value })
                    : setNewGrid({ ...newGrid, bank: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="text"
                  placeholder="Product (e.g., Agriculture)"
                  value={editingGrid?.product || newGrid.product}
                  onChange={(e) => editingGrid
                    ? setEditingGrid({ ...editingGrid, product: e.target.value })
                    : setNewGrid({ ...newGrid, product: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="text"
                  placeholder="BKT (e.g., BKT-0)"
                  value={editingGrid?.bkt || newGrid.bkt}
                  onChange={(e) => editingGrid
                    ? setEditingGrid({ ...editingGrid, bkt: e.target.value })
                    : setNewGrid({ ...newGrid, bkt: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="number"
                  placeholder="Payout %"
                  value={editingGrid?.payoutPercent || newGrid.payoutPercent}
                  onChange={(e) => editingGrid
                    ? setEditingGrid({ ...editingGrid, payoutPercent: e.target.value })
                    : setNewGrid({ ...newGrid, payoutPercent: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSavePayoutGrid}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Save
                  </button>
                  {editingGrid && (
                    <button
                      onClick={() => setEditingGrid(null)}
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition-all flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Existing Grids */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Bank</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Product</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">BKT</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Payout %</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutGrids.map(grid => (
                    <tr key={grid.id} className="border-b border-gray-200 hover:bg-gray-50 transition-all">
                      <td className="py-4 px-4 font-semibold text-gray-800">{grid.bank}</td>
                      <td className="py-4 px-4 text-gray-800">{grid.product}</td>
                      <td className="py-4 px-4 text-gray-600">{grid.bkt}</td>
                      <td className="py-4 px-4 text-center font-bold text-orange-600">{grid.payoutPercent}%</td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => setEditingGrid(grid)}
                          className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg font-semibold hover:bg-blue-200 transition-all flex items-center justify-center gap-2 mx-auto"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Master Reporting Tab */}
        {activeTab === 'reporting' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Master Reporting</h2>
            <p className="text-gray-600 mb-8">Download comprehensive reports for all users and cases.</p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Daily Reports */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-300">
                <h3 className="text-lg font-bold text-blue-900 mb-4">Daily Reports</h3>
                <p className="text-sm text-blue-800 mb-6">
                  Comprehensive daily summaries of all employees' activities and case statuses.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => downloadReport('PDF')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => downloadReport('Excel')}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    Download Excel
                  </button>
                </div>
              </div>

              {/* Weekly Reports */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-2 border-purple-300">
                <h3 className="text-lg font-bold text-purple-900 mb-4">Weekly Reports</h3>
                <p className="text-sm text-purple-800 mb-6">
                  Weekly aggregated metrics, performance trends, and productivity analysis.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => downloadReport('PDF')}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => downloadReport('Excel')}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    Download Excel
                  </button>
                </div>
              </div>

              {/* Monthly Reports */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border-2 border-orange-300">
                <h3 className="text-lg font-bold text-orange-900 mb-4">Monthly Reports</h3>
                <p className="text-sm text-orange-800 mb-6">
                  Complete monthly analysis, revenue impact, and employee performance scorecards.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => downloadReport('PDF')}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => downloadReport('Excel')}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    Download Excel
                  </button>
                </div>
              </div>

              {/* Custom Reports */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border-2 border-gray-300">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Custom Reports</h3>
                <p className="text-sm text-gray-800 mb-6">
                  Generate custom reports based on specific date ranges and employee filters.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => downloadReport('PDF')}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    Build Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compliance Footer */}
      <ComplianceFooter />
    </div>
  );
};

export default ManagerControlCenter;
