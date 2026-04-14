"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';

export default function HistoryTab() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('saved_games')
        .select(`
          id, played_at, room_code, rounds,
          saved_players ( player_name, score, is_winner, is_draw )
        `)
        .order('played_at', { ascending: false });

      if (error) throw error;
      setGames(data || []);
    } catch (err: any) {
      console.error(err);
      setError("Please ensure the database setup script has been run!");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(p => p === id ? null : id);
  };

  if (loading) {
    return <div className="loader" style={{ margin: '2rem auto' }}></div>;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--error)', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          {error}
        </div>
      )}

      {games.length === 0 && !error ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No game history available yet.
        </div>
      ) : (
        games.map(game => {
          const isExp = expandedId === game.id;
          const dateStr = new Date(game.played_at).toLocaleString();
          const players = game.saved_players || [];
          // Sort players by score
          players.sort((a: any, b: any) => b.score - a.score);
          const topPlayer = players[0];

          return (
            <div key={game.id} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <button 
                onClick={() => toggleExpand(game.id)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'var(--surface)', border: 'none', cursor: 'pointer', color: 'white', textAlign: 'left' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <Calendar size={14} /> {dateStr}
                    <span style={{ margin: '0 5px' }}>•</span>
                    Room {game.room_code}
                    <span style={{ margin: '0 5px' }}>•</span>
                    {game.rounds} Rounds
                  </div>
                  <div style={{ fontWeight: 'bold' }}>
                    {players.length} Players (Winner: {topPlayer?.player_name || 'None'})
                  </div>
                </div>
                {isExp ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {isExp && (
                <div style={{ padding: '15px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>
                    <span>Player</span>
                    <span style={{ textAlign: 'right' }}>Score</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {players.map((p: any, idx: number) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', alignItems: 'center' }}>
                        <span style={{ fontWeight: p.is_winner ? 'bold' : 'normal', color: p.is_winner ? 'var(--accent)' : 'white' }}>
                          {p.player_name} {p.is_winner && !p.is_draw ? '👑' : ''} {p.is_draw ? '🤝' : ''}
                        </span>
                        <span style={{ textAlign: 'right', fontWeight: 'bold' }}>{p.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
