import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import { generateExecutiveReport, appendExecutiveReport } from '../components/PdfReport';

const ExecutivePerformance = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [performance, setPerformance] = useState(null);
  const [executive, setExecutive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ bank: '', product: '', bkt: '', month: new Date().getMonth()+1, year: new Date().getFullYear() });

  useEffect(() => {
    const bank = searchParams.get('bank') || '';
    const product = searchParams.get('product') || '';
    const bkt = searchParams.get('bkt') || '';
    const month = parseInt(searchParams.get('month')) || new Date().getMonth()+1;
    const year = parseInt(searchParams.get('year')) || new Date().getFullYear();
    setFilters({ bank, product, bkt, month, year });
    fetchPerformance({ bank, product, bkt, month, year });
    fetchExecutive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);
      if (filters.bank) params.append('bank', filters.bank);
      if (filters.product) params.append('product', filters.product);
      if (filters.bkt) params.append('bkt', filters.bkt);

      const res = await API.get(`/cases/performance/${id}?${params.toString()}`);
      setPerformance(res.data?.data || null);
    } catch (err) {
      setPerformance(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutive = async () => {
    try {
      const res = await API.get(`/admin/employees/${id}`);
      setExecutive(res.data?.data || null);
    } catch (err) {
      setExecutive(null);
    }
  };

  const applyFilter = (b, p, bk) => {
    if (!performance) return null;
    let filtered = { ...performance };
    if (b) filtered.bankBreakdown = (performance.bankBreakdown || []).filter(x => x.bankName === b);
    if (p) filtered.bankBreakdown = (filtered.bankBreakdown || []).map(bank => ({ ...bank, products: (bank.products || []).filter(pr => pr.productName === p) }));
    if (bk) filtered.bankBreakdown = (filtered.bankBreakdown || []).map(bank => ({ ...bank, products: (bank.products || []).map(pr => ({ ...pr, bkts: (pr.bkts || []).filter(bkt => bkt.bkt === bk) })) }));
    return filtered;
  };

  const downloadPdf = () => {
    if (!executive || !performance) return;
    // Prefer server-generated filtered performance for accurate numbers when filters applied
    const params = new URLSearchParams();
    if (filters.month) params.append('month', filters.month);
    if (filters.year) params.append('year', filters.year);
    if (filters.bank) params.append('bank', filters.bank);
    if (filters.product) params.append('product', filters.product);
    if (filters.bkt) params.append('bkt', filters.bkt);

    // Fetch server-side filtered performance and generate PDF
    API.get(`/cases/performance/${id}?${params.toString()}`).then(res => {
      const perf = res.data?.data || performance;
      const doc = generateExecutiveReport(executive, perf);
      doc.save(`${executive.username || executive.emp_id || id}-performance.pdf`);
    }).catch(() => {
      const doc = generateExecutiveReport(executive, applyFilter(filters.bank, filters.product, filters.bkt) || performance);
      doc.save(`${executive.username || executive.emp_id || id}-performance.pdf`);
    });
  };

  if (loading) return <div className="p-6">Loading...</div>;

  if (!performance) return <div className="p-6 text-red-600">No performance data available</div>;

  const filtered = applyFilter(filters.bank, filters.product, filters.bkt) || performance;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Performance: {executive ? `${executive.firstName} ${executive.lastName}` : id}</h2>
        <div className="flex gap-2">
          <button onClick={downloadPdf} className="px-4 py-2 bg-blue-600 text-white rounded">Download PDF</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input name="bank" placeholder="Filter by bank" value={filters.bank} onChange={(e) => setFilters({ ...filters, bank: e.target.value })} className="px-3 py-2 border rounded" />
          <input name="product" placeholder="Filter by product" value={filters.product} onChange={(e) => setFilters({ ...filters, product: e.target.value })} className="px-3 py-2 border rounded" />
          <input name="bkt" placeholder="Filter by bkt" value={filters.bkt} onChange={(e) => setFilters({ ...filters, bkt: e.target.value })} className="px-3 py-2 border rounded" />
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 border rounded">Total POS: ₹{filtered.totalPOS?.toLocaleString() || 0}</div>
          <div className="p-3 border rounded">Total Cases: {filtered.totalCases || 0}</div>
          <div className="p-3 border rounded">POS NotFlow: ₹{filtered.posNotFlow || 0}</div>
          <div className="p-3 border rounded">POS RB: ₹{filtered.posRB || 0}</div>
        </div>

        <div className="mt-4">
          {(filtered.bankBreakdown || []).map(bank => (
            <div key={bank.bankName} className="border rounded p-3 mb-3">
              <h4 className="font-semibold">{bank.bankName}</h4>
              {(bank.products || []).map(product => (
                <div key={product.productName} className="mt-2 pl-4">
                  <div className="font-medium">Product: {product.productName}</div>
                  {(product.bkts || []).map(bkt => (
                    <div key={bkt.bktName} className="mt-1 pl-4 text-sm">{bkt.bktName} — RB: {bkt.rbCount} | NORM: {bkt.normCount} | POS RB: ₹{bkt.posRB} | POS NORM: ₹{bkt.posNorm}</div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExecutivePerformance;
