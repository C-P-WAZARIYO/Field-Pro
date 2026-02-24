import React, { useEffect, useState } from 'react';
import API from '../api/axios';

// Small helper to download a Blob without adding a dependency
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const VisitedCases = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ month: new Date().getMonth()+1, year: new Date().getFullYear(), bank: '', product: '', bkt: '' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchVisited(); }, [page, limit]);

  const fetchVisited = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', limit);
      params.append('offset', (page-1)*limit);
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);
      if (filters.bank) params.append('bank', filters.bank);
      if (filters.product) params.append('product', filters.product);
      if (filters.bkt) params.append('bkt', filters.bkt);

      const res = await API.get(`/cases/visited?${params.toString()}`);
      setCases(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      setError('Failed to load visited cases');
      setCases([]);
    } finally { setLoading(false); }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const applyFilters = () => { setPage(1); fetchVisited(); };


  // Download CSV with all feedback details for each case
  const downloadCSV = () => {
    if (cases.length === 0) return;
    const rows = [];
    // Header: case fields + feedback fields
    rows.push([
      'Acc ID','Customer','Bank','Product','BKT','Visits','Last Visit',
      'Feedback ID','Visit Code','Observation','Exec First Name','Exec Last Name','Exec ID','Feedback Created','Feedback Updated','Who Met','Met Name','Custom Place','Distance','Next Action Date'
    ]);
    cases.forEach(c => {
      if (Array.isArray(c.feedbacks) && c.feedbacks.length > 0) {
        c.feedbacks.forEach(fb => {
          rows.push([
            c.acc_id,
            c.customer_name || '',
            c.bank_name || '',
            c.product_type || '',
            c.bkt || '',
            c.visits,
            c.lastVisitAt || '',
            fb.id || '',
            fb.visit_code || '',
            String(fb.remarks || '').replace(/\n|\r/g,' '),
            fb.executive?.firstName || '',
            fb.executive?.lastName || '',
            fb.executive?.id || '',
            fb.createdAt || '',
            fb.updatedAt || '',
            fb.who_met || '',    
            fb.met_name || '',   
            fb.custom_place || '',
            fb.distance || '',
            fb.ptp_date || ''
          
          ]);
        });
      }
      // If there are no feedbacks, do not output a row for this case
    });
    // If there are no feedbacks at all, output a single row for each case with empty feedback columns
    if (rows.length === 1) { // only header exists
      cases.forEach(c => {
        rows.push([
          c.acc_id,
          c.customer_name || '',
          c.bank_name || '',
          c.product_type || '',
          c.bkt || '',
          c.visits,
          c.lastVisitAt || '',
          '', '', '', '', '', '', '', ''
        ]);
      });
    }
    const csvContent = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `visited-cases-all-feedbacks-${filters.month}-${filters.year}.csv`);
  };

  // Download full export (all feedback fields, all visited cases for filters)
  const downloadFullExport = async () => {
    try {
      const params = new URLSearchParams();
      params.append('format', 'csv');
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);
      if (filters.bank) params.append('bank', filters.bank);
      if (filters.product) params.append('product', filters.product);
      if (filters.bkt) params.append('bkt', filters.bkt);
      // No pagination for full export
      const res = await API.get(`/cases/visited/export?${params.toString()}`, { responseType: 'blob' });
      downloadBlob(res.data, `visited-cases-full-${filters.month}-${filters.year}.csv`);
    } catch (err) {
      alert('Failed to download full export.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Visited Cases</h2>
        <div className="flex gap-2">
          <button onClick={downloadCSV} className="px-3 py-2 bg-blue-600 text-white rounded">Download CSV (Summary)</button>
          <button onClick={downloadFullExport} className="px-3 py-2 bg-green-700 text-white rounded">Download Full Export</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded mb-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <input name="bank" placeholder="Bank" value={filters.bank} onChange={handleFilterChange} className="px-2 py-1 border rounded" />
          <input name="product" placeholder="Product" value={filters.product} onChange={handleFilterChange} className="px-2 py-1 border rounded" />
          <input name="bkt" placeholder="BKT" value={filters.bkt} onChange={handleFilterChange} className="px-2 py-1 border rounded" />
          <input name="month" type="number" placeholder="Month" value={filters.month} onChange={handleFilterChange} className="px-2 py-1 border rounded" />
          <input name="year" type="number" placeholder="Year" value={filters.year} onChange={handleFilterChange} className="px-2 py-1 border rounded" />
          <div className="flex gap-2">
            <button onClick={applyFilters} className="px-3 py-1 bg-green-600 text-white rounded">Apply</button>
            <button onClick={() => { setFilters({ month: new Date().getMonth()+1, year: new Date().getFullYear(), bank: '', product: '', bkt:'' }); setPage(1); }} className="px-3 py-1 bg-gray-200 rounded">Reset</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Acc ID</th>
              <th className="px-3 py-2 text-left">Customer</th>
              <th className="px-3 py-2 text-left">Bank</th>
              <th className="px-3 py-2 text-left">Product</th>
              <th className="px-3 py-2 text-left">BKT</th>
              <th className="px-3 py-2 text-right">Visits</th>
              <th className="px-3 py-2 text-left">Last Visit</th>
              <th className="px-3 py-2 text-left">Visit Code</th>
              <th className="px-3 py-2 text-left">Observation</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (<tr><td colSpan={8} className="p-6 text-center">Loading...</td></tr>) : cases.length === 0 ? (<tr><td colSpan={8} className="p-6 text-center">No visited cases</td></tr>) : (
              cases.map(c => (
                <tr key={c.id} className="border-t">
                  <td className="px-3 py-2">{c.acc_id}</td>
                  <td className="px-3 py-2">{c.customer_name}</td>
                  <td className="px-3 py-2">{c.bank_name}</td>
                  <td className="px-3 py-2">{c.product_type}</td>
                  <td className="px-3 py-2">{c.bkt}</td>
                  <td className="px-3 py-2 text-right">{c.visits}</td>
                  <td className="px-3 py-2">{c.lastVisitAt ? new Date(c.lastVisitAt).toLocaleString() : '-'}</td>
                  <td className="px-3 py-2">{(c.feedbacks && c.feedbacks.length) ? (c.feedbacks[0].visit_code || '-') : '-'}</td>
                  <td className="px-3 py-2">{(c.feedbacks && c.feedbacks.length) ? (String(c.feedbacks[0].remarks || '-')) : '-'}</td>
                  <td className="px-3 py-2">
                    <a className="px-2 py-1 bg-gray-200 rounded" href={`/cases/${c.id}`}>View Case</a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div>Total: {total}</div>
        <div className="flex gap-2">
          <button disabled={page<=1} onClick={() => { setPage(p => Math.max(1,p-1)); fetchVisited(); }} className="px-3 py-1 bg-gray-200 rounded">Prev</button>
          <span>Page {page}</span>
          <button disabled={(page*limit)>=total} onClick={() => { setPage(p => p+1); fetchVisited(); }} className="px-3 py-1 bg-gray-200 rounded">Next</button>
        </div>
      </div>
    </div>
  );
};

export default VisitedCases;
