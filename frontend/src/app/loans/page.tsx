'use client';
import { useEffect, useState } from 'react';
import { fetchLoans, createLoan } from '@/lib/api';

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [rate, setRate] = useState('');
  const [minPay, setMinPay] = useState('');

  const load = async () => setLoans(await fetchLoans());
  useEffect(() => { load().catch(console.error); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await createLoan({ name, balance: Number(balance), interest_rate: Number(rate), minimum_payment: Number(minPay), type: 'Unknown' });
    setName(''); setBalance(''); setRate(''); setMinPay('');
    await load();
  };

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Loans</h1>
      <form onSubmit={add} className="grid grid-cols-4 gap-2 mb-6">
        <input className="border p-2" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="border p-2" placeholder="Balance" value={balance} onChange={e=>setBalance(e.target.value)} />
        <input className="border p-2" placeholder="Rate %" value={rate} onChange={e=>setRate(e.target.value)} />
        <input className="border p-2" placeholder="Min Payment" value={minPay} onChange={e=>setMinPay(e.target.value)} />
        <button className="col-span-4 bg-blue-600 text-white p-2 rounded">Add Loan</button>
      </form>
      <ul className="space-y-2">
        {loans.map(l => (
          <li key={l._id} className="border p-3 rounded flex justify-between">
            <span>{l.name}</span>
            <span>${l.balance} @ {l.interest_rate}%</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
