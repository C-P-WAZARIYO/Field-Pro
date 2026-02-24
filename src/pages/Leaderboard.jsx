import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Leaderboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await API.get('/cases/leaderboard');
        const data = res.data?.data || res.data || [];
        setRows(data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) return <div className="p-6">Loading leaderboard...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Executive Leaderboard</h2>
      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Rank</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Emp ID</th>
              <th className="px-4 py-2 text-right">Total Cases</th>
              <th className="px-4 py-2 text-right">Total POS</th>
              <th className="px-4 py-2 text-right">POS NotFlow (%)</th>
              <th className="px-4 py-2 text-right">POS RB (%)</th>
              <th className="px-4 py-2 text-right">POS NORM (%)</th>
              <th className="px-4 py-2 text-right">Recovered</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y">
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-gray-500">No data available</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.userId || r.id || r.empId}>
                <td className="px-4 py-2">{r.rank ?? '-'}</td>
                <td className="px-4 py-2">{r.name || r.fullName || (r.user && r.user.name) || '-'}</td>
                <td className="px-4 py-2">{r.empId || r.emp_id || (r.user && r.user.emp_id) || '-'}</td>
                <td className="px-4 py-2 text-right">{r.totalCases ?? r.total_cases ?? 0}</td>
                <td className="px-4 py-2 text-right">{r.totalPOS ?? r.total_pos ?? 0}</td>
                <td className="px-4 py-2 text-right">{(typeof r.posNotFlowRate !== 'undefined') ? `${(r.posNotFlowRate*100).toFixed(1)}%` : (r.posNotFlow ? r.posNotFlow : '-')}</td>
                <td className="px-4 py-2 text-right">{(typeof r.posRBRate !== 'undefined') ? `${(r.posRBRate*100).toFixed(1)}%` : (r.posRB ? r.posRB : '-')}</td>
                <td className="px-4 py-2 text-right">{(typeof r.posNormRate !== 'undefined') ? `${(r.posNormRate*100).toFixed(1)}%` : (r.posNorm ? r.posNorm : '-')}</td>
                <td className="px-4 py-2 text-right">{r.totalRecoveredAmount ?? r.recoveredAmount ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
