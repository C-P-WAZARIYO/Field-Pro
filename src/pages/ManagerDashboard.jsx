
import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

// Excel uploads and audit logs
// (rest of the code remains unchanged, but now comes after imports)

export default function ManagerDashboard() {
  const [payoutGrids, setPayoutGrids] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    bank: '',
    product: '',
    bkt: '',
    target_percent: '',
    payout_type: 'FIXED',
    payout_amount: '',
    norm_bonus: '',
    rollback_bonus: '',
    max_earning: '',
  });
  const [filters, setFilters] = useState({
    bank: '',
    product: '',
    bkt: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayoutGrids();
  }, [filters]);

  const fetchPayoutGrids = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.bank) params.append('bank', filters.bank);
      if (filters.product) params.append('product', filters.product);
      if (filters.bkt) params.append('bkt', filters.bkt);

      const response = await axios.get(`/payouts/grids/all?${params}`);
      setPayoutGrids(response.data.data);
    } catch (error) {
      console.error('Failed to fetch payout grids:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/payouts/grids', formData);
      if (response.data.success) {
        setPayoutGrids([...payoutGrids, response.data.data]);
        setFormData({
          bank: '',
          product: '',
          bkt: '',
          target_percent: '',
          payout_type: 'FIXED',
          payout_amount: '',
          norm_bonus: '',
          rollback_bonus: '',
          max_earning: '',
        });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Failed to create payout grid:', error);
    }
  };

  const handleCopyGrid = async (bank, product) => {
    const toProduct = prompt('Enter target product name:');
    if (toProduct) {
      try {
        await axios.post('/payouts/grids/copy', {
          fromBank: bank,
          fromProduct: product,
          toBank: bank,
          toProduct: toProduct,
        });
        fetchPayoutGrids();
      } catch (error) {
        console.error('Failed to copy grid:', error);
      }
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Manager Dashboard</h1>
            <p className="text-gray-600 mt-2">Configure payout grids and manage earnings structures</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              + New Payout Grid
            </button>
            <a href="/leaderboard" className="px-4 py-3 bg-gray-200 rounded-lg">Leaderboard</a>
            <a href="/executives" className="px-4 py-3 bg-gray-200 rounded-lg">Executives</a>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white p-8 rounded-lg shadow mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Payout Grid</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank *</label>
                <input
                  type="text"
                  name="bank"
                  value={formData.bank}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., HDFC, ICICI"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product *</label>
                <input
                  type="text"
                  name="product"
                  value={formData.product}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Agriculture, Wheels"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">BKT *</label>
                <input
                  type="text"
                  name="bkt"
                  value={formData.bkt}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., BKT-0, BKT-1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target % *</label>
                <input
                  type="number"
                  name="target_percent"
                  value={formData.target_percent}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                  placeholder="e.g., 90"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payout Type *</label>
                <select
                  name="payout_type"
                  value={formData.payout_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="FIXED">Fixed Amount</option>
                  <option value="PERCENTAGE">Percentage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payout Amount *</label>
                <input
                  type="number"
                  name="payout_amount"
                  value={formData.payout_amount}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                  placeholder="e.g., 500 or 5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Norm Bonus</label>
                <input
                  type="number"
                  name="norm_bonus"
                  value={formData.norm_bonus}
                  onChange={handleInputChange}
                  step="0.01"
                  placeholder="e.g., 100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rollback Bonus</label>
                <input
                  type="number"
                  name="rollback_bonus"
                  value={formData.rollback_bonus}
                  onChange={handleInputChange}
                  step="0.01"
                  placeholder="e.g., 150"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Earning Cap</label>
                <input
                  type="number"
                  name="max_earning"
                  value={formData.max_earning}
                  onChange={handleInputChange}
                  step="0.01"
                  placeholder="e.g., 50000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Create Grid
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-6 py-3 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              name="bank"
              placeholder="Filter by Bank"
              value={filters.bank}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              name="product"
              placeholder="Filter by Product"
              value={filters.product}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              name="bkt"
              placeholder="Filter by BKT"
              value={filters.bkt}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Payout Grids Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Payout Grids ({payoutGrids.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Bank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">BKT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Target %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Payout</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Norm Bonus</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Rollback Bonus</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Max Cap</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payoutGrids.map((grid) => (
                  <tr key={grid.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{grid.bank}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{grid.product}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{grid.bkt}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{grid.target_percent}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {grid.payout_type === 'FIXED' ? `₹${grid.payout_amount}` : `${grid.payout_amount}%`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">₹{grid.norm_bonus}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">₹{grid.rollback_bonus}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {grid.max_earning ? `₹${grid.max_earning}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleCopyGrid(grid.bank, grid.product)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Copy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

          {/* Excel Uploads Preview/Download */}
          <div className="bg-white rounded-lg shadow mt-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Uploaded Excel Files</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Upload ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Filename</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Supervisor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total Cases</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Uploaded At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {uploads.map((upload) => (
                    <tr key={upload.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{upload.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{upload.filename}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{upload.supervisorId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{upload.total_cases}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(upload.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a href={`/cases/uploads/${upload.id}/download`} className="text-blue-600 hover:text-blue-900 font-medium" target="_blank" rel="noopener noreferrer">Download</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Logs for Excel Uploads */}
          <div className="bg-white rounded-lg shadow mt-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Excel Upload Audit Logs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Resource</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{log.userId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{log.action}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{log.resource}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{JSON.stringify(log.details)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      </div>
    </div>
  );
}