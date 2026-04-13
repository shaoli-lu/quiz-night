"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid password');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container animate-fade-in" style={{ justifyContent: 'center' }}>
      <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Sparkles color="var(--accent)" size={40} />
          <span className="text-gradient">Quiz Night</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1.2rem' }}>
          Please enter the access password to continue
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--error)', padding: '12px', borderRadius: 'var(--radius)', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="password" 
              placeholder="Enter Password" 
              className="input-field"
              style={{ paddingLeft: '48px' }}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setPassword('')}
              required
              autoFocus
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '10px' }}
          >
            {loading ? (
              <div className="loader"></div>
            ) : (
              <>Access <ArrowRight size={20} /></>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
