import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import { Link, useNavigate } from 'react-router-dom';
import { generateExecutiveReport, appendExecutiveReport } from '../components/PdfReport';
import jsPDF from 'jspdf';

const Executives = () => {
  const [executives, setExecutives] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ bank: '', product: '', bkt: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchExecutives();
  }, []);

  const fetchExecutives = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ role: 'Executive', page, limit });
      const res = await API.get(`/admin/employees?${params}`);
      const data = res.data?.data || [];
      setExecutives(data);
      setTotal(res.data?.pagination?.total || res.data?.total || data.length);
    } catch (err) {
      setError('Failed to fetch executives');
      setExecutives([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const viewPerformance = (id) => {
    navigate(`/executives/${id}`);
  };

  const downloadAll = async () => {
    // Bulk-download: fetch each executive performance and append to single PDF
    try {
      const doc = new jsPDF();
      let first = true;
      for (const exec of executives) {
        try {
          const perfRes = await API.get(`/cases/performance/${exec.id}`);
          const perf = perfRes.data?.data;
          if (doc) {
            appendExecutiveReport(doc, exec, perf, first);
            first = false;
          } else {
            const d = generateExecutiveReport(exec, perf);
            d.save(`${exec.username || exec.emp_id || exec.id}-performance.pdf`);
          }
        } catch (e) {
          console.warn('Failed to fetch perf for', exec.id);
        }
      }
      if (doc) {
        doc.save('all-executives-performance.pdf');
      }
    } catch (err) {
      console.error('Bulk download failed', err);
      setError('Bulk download failed');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Executives</h2>
        <div className="flex gap-3">
          <button onClick={downloadAll} className="px-4 py-2 bg-blue-600 text-white rounded">Download All</button>
          <Link to="/leaderboard" className="px-4 py-2 bg-gray-200 rounded">View Leaderboard</Link>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input name="bank" placeholder="Filter by bank" value={filters.bank} onChange={handleFilterChange} className="px-3 py-2 border rounded" />
          <input name="product" placeholder="Filter by product" value={filters.product} onChange={handleFilterChange} className="px-3 py-2 border rounded" />
          <input name="bkt" placeholder="Filter by bkt" value={filters.bkt} onChange={handleFilterChange} className="px-3 py-2 border rounded" />
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div>
          <label className="text-sm mr-2">Page size</label>
          <select value={limit} onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); fetchExecutives(); }} className="border rounded px-2 py-1">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div className="text-sm text-gray-600">Total executives: {total}</div>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Emp ID</th>
              <th className="px-4 py-2 text-left">Username</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-6 text-center">Loading...</td></tr>
            ) : executives.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center">No executives found</td></tr>
            ) : (
              executives.map(exec => (
                <tr key={exec.id} className="border-t">
                  <td className="px-4 py-3">{exec.firstName} {exec.lastName}</td>
                  <td className="px-4 py-3">{exec.emp_id || '-'}</td>
                  <td className="px-4 py-3">{exec.username || exec.email}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => viewPerformance(exec.id)} className="px-3 py-1 bg-green-600 text-white rounded mr-2">View Performance</button>
                    <a href={`/executives/${exec.id}?download=pdf`} className="px-3 py-1 bg-gray-200 rounded">Direct PDF</a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex justify-center items-center gap-3">
        <button disabled={page <= 1} onClick={() => { setPage(p => Math.max(1, p - 1)); fetchExecutives(); }} className="px-3 py-1 bg-gray-200 rounded">Prev</button>
        <span>Page {page}</span>
        <button disabled={(page * limit) >= total} onClick={() => { setPage(p => p + 1); fetchExecutives(); }} className="px-3 py-1 bg-gray-200 rounded">Next</button>
      </div>
    </div>
  );
};

export default Executives;
