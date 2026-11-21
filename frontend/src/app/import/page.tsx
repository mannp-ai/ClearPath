'use client';
import { useState } from 'react';

export default function ImportPage() {
  const [status, setStatus] = useState('');
  const run = async () => {
    const raw = localStorage.getItem('loans');
    const loans = raw ? JSON.parse(raw) : [];
    const token = localStorage.getItem('accessToken');
    const res = await fetch('http://localhost:4000/api/v1/loans/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ loans }),
    });
    const data = await res.json();
    setStatus(`Imported ${data.imported} loans`);
  };
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Import Local Loans</h1>
      <button onClick={run} className="bg-blue-600 text-white p-2 rounded">Import from browser storage</button>
      <p className="mt-4">{status}</p>
    </main>
  );
}
