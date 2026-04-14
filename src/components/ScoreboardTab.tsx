"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, RotateCcw } from 'lucide-react';

export default function ScoreboardTab() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      // NOTE: This relies on the scoreboard SQL View. 
      // If the view doesn't exist, it will throw an error.
      const { data, error: sbError } = await supabase
        .from('scoreboard')
        .select('*')
        .order('wins', { ascending: false })
        .order('draws', { ascending: false })
        .order('losses', { ascending: true });

      if (sbError) throw sbError;
      setStats(data || []);
    } catch (err: any) {
      console.error(err);
      setError("Please ensure the database setup script has been run!");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset ALL stats? This cannot be undone.")) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/reset-stats', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStats([]);
    } catch (err: any) {
      console.error(err);
      alert("Failed to reset stats: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loader" style={{ margin: '2rem auto' }}></div>;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--error)', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          {error}
        </div>
      )}

      {stats.length === 0 && !error ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No stats available yet. Go play some games!
        </div>
      ) : (
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '15px', background: 'var(--surface)', fontWeight: 'bold' }}>
            <div>Name</div>
            <div style={{ textAlign: 'center' }}>Wins</div>
            <div style={{ textAlign: 'center' }}>Losses</div>
            <div style={{ textAlign: 'center' }}>Draws</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {stats.map((s, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '15px', borderBottom: '1px solid var(--surface)', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: i === 0 ? 'bold' : 'normal', color: i === 0 ? 'var(--accent)' : 'white' }}>
                  {i === 0 && <Trophy size={16} color="var(--accent)" />}
                  {s.name}
                </div>
                <div style={{ textAlign: 'center', color: 'var(--success)' }}>{s.wins}</div>
                <div style={{ textAlign: 'center', color: 'var(--error)' }}>{s.losses}</div>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{s.draws}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="btn-secondary" onClick={handleReset} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
        <RotateCcw size={18} /> Reset Stats
      </button>

    </div>
  );
}
