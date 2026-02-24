import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

export default function ExecutiveDashboard() {
  const [cases, setCases] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [filters, setFilters] = useState({
    bkt: '',
    product_type: '',
    npa_status: '',
    priority: '',
    status: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCases();
    fetchPerformance();
  }, [filters]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await axios.get(`/cases/executive/${JSON.parse(localStorage.getItem('user')).id}?${params}`);
      setCases(response.data.data);
    } catch (error) {
      console.error('Failed to fetch cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      const response = await axios.get(`/cases/performance/${user.id}?month=${month}&year=${year}`);
      setPerformance(response.data.data);
    } catch (error) {
      console.error('Failed to fetch performance:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your assigned cases and performance</p>
        </div>

        {/* Performance Summary */}
        {performance && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-600">Total Cases</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{performance.totalCases}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-600">Visited</div>
              <div className="text-3xl font-bold text-blue-600 mt-2">{performance.visitedCases}</div>
              <div className="text-xs text-gray-500 mt-1">{performance.visitRate.toFixed(1)}% visit rate</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-600">Total POS</div>
              <div className="text-3xl font-bold text-green-600 mt-2">₹{(performance.totalPOS / 100000).toFixed(1)}L</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-600">Recovery Rate</div>
              <div className="text-3xl font-bold text-purple-600 mt-2">{performance.recoveryRate.toFixed(1)}%</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">BKT</label>
              <select name="bkt" value={filters.bkt} onChange={handleFilterChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">All</option>
                <option value="BKT-0">BKT-0</option>
                <option value="BKT-1">BKT-1</option>
                <option value="BKT-2">BKT-2</option>
                <option value="BKT-3">BKT-3+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
              <select name="product_type" value={filters.product_type} onChange={handleFilterChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">All</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Wheels">Wheels</option>
                <option value="Mortgage">Mortgage</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">NPA Status</label>
              <select name="npa_status" value={filters.npa_status} onChange={handleFilterChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">All</option>
                <option value="NPA">NPA</option>
                <option value="PNPA">PNPA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select name="priority" value={filters.priority} onChange={handleFilterChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">All</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="VISITED">Visited</option>
                <option value="PAID">Paid</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cases List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Assigned Cases ({cases.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Account ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">POS Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">BKT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cases.map((caseItem) => (
                  <tr key={caseItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{caseItem.acc_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{caseItem.customer_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">₹{caseItem.pos_amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{caseItem.bkt}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${caseItem.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : caseItem.status === 'VISITED' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {caseItem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-blue-600 hover:text-blue-900 font-medium">Submit Feedback</button>
                    </td>
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
