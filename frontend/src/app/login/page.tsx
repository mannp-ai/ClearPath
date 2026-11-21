'use client';
import { useState } from 'react';
import { login } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
    router.push('/loans');
  };
  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="border p-2 w-full" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border p-2 w-full" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="bg-blue-600 text-white p-2 rounded w-full">Login</button>
      </form>
    </main>
  );
}
