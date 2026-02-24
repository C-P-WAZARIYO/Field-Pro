import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

function hasPermission(user, perm) {
  if (!user) return false;
  if (user.roles?.includes('super_admin')) return true;
  return user.permissions?.includes(perm);
}

export default function Permissions() {
  const { user } = useAuth();
  const [perms, setPerms] = useState([]);
  const [name, setName] = useState('');
  const [resource, setResource] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/permissions');
        setPerms(res.data?.data || []);
      } catch (e) {
        setError(e.response?.data?.error?.message || 'Failed to load permissions');
      } finally {
        setLoading(false);
      }
    };
    if (hasPermission(user, 'roles:read')) load();
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { name, resource };
      const res = await API.post('/permissions', payload);
      setPerms((p) => [res.data?.data || res.data, ...p]);
      setName('');
      setResource('');
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Create failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this permission?')) return;
    try {
      await API.delete(`/permissions/${id}`);
      setPerms((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Delete failed');
    }
  };

  if (!hasPermission(user, 'roles:read')) return <div className="p-6">Access denied</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Permissions</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}

      <form onSubmit={handleCreate} className="mb-6 grid grid-cols-3 gap-2">
        <input value={resource} onChange={(e) => setResource(e.target.value)} placeholder="resource (e.g., users)" className="px-3 py-2 border rounded col-span-1" />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="action (e.g., create)" className="px-3 py-2 border rounded col-span-1" />
        <button disabled={!name || !resource} className="px-4 py-2 bg-blue-600 text-white rounded col-span-1">Create</button>
      </form>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <ul className="space-y-2">
          {perms.map((p) => (
            <li key={p.id} className="flex justify-between items-center p-3 border rounded">
              <div>
                <div className="font-medium">{p.resource}:{p.action || p.name}</div>
                {p.description && <div className="text-sm text-gray-600">{p.description}</div>}
              </div>
              {hasPermission(user, 'roles:manage') && (
                <button onClick={() => handleDelete(p.id)} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
