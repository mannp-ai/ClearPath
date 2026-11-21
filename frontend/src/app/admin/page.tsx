'use client';
import { useEffect, useState } from 'react';

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch('http://localhost:4000/api/v1/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setUsers(d.users || []));
  }, []);
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin — Users</h1>
      <table className="w-full border">
        <thead><tr><th className="border p-2">Email</th><th className="border p-2">Role</th><th className="border p-2">Status</th></tr></thead>
        <tbody>{users.map(u => <tr key={u._id}><td className="border p-2">{u.email}</td><td className="border p-2">{u.role}</td><td className="border p-2">{u.status}</td></tr>)}</tbody>
      </table>
    </main>
  );
}
