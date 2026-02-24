import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

function hasPermission(user, perm) {
  if (!user) return false;
  if (user.roles?.includes('super_admin')) return true;
  return user.permissions?.includes(perm);
}

export default function Roles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/roles');
        setRoles(res.data?.data || []);
      } catch (e) {
        setError(e.response?.data?.error?.message || 'Failed to load roles');
      } finally {
        setLoading(false);
      }
    };
    if (hasPermission(user, 'roles:read')) load();
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/roles', { name });
      setRoles((p) => [res.data?.data || res.data, ...p]);
      setName('');
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Create failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this role?')) return;
    try {
      await API.delete(`/roles/${id}`);
      setRoles((p) => p.filter((r) => r.id !== id));
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Delete failed');
    }
  };

  if (!hasPermission(user, 'roles:read')) return <div className="p-6">Access denied</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Roles</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}

      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New role name" className="px-3 py-2 border rounded" />
        <button disabled={!name} className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
      </form>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <ul className="space-y-2">
          {roles.map((r) => (
            <li key={r.id} className="flex justify-between items-center p-3 border rounded">
              <div>
                <div className="font-medium">{r.name}</div>
                {r.description && <div className="text-sm text-gray-600">{r.description}</div>}
              </div>
              {hasPermission(user, 'roles:delete') && (
                <button onClick={() => handleDelete(r.id)} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
