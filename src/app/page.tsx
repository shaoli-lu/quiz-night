"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sparkles, Users, UserPlus, Trophy, CalendarDays, Gamepad2 } from 'lucide-react';
import ScoreboardTab from '@/components/ScoreboardTab';
import HistoryTab from '@/components/HistoryTab';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'play' | 'scoreboard' | 'history'>('play');
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('any');
  const [difficulty, setDifficulty] = useState('any');

  useEffect(() => {
    fetch('https://opentdb.com/api_category.php')
      .then(res => res.json())
      .then(data => {
        if (data.trivia_categories) {
          setCategories(data.trivia_categories);
        }
      })
      .catch(console.error);
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomCode.trim()) {
      setError('Name and Room Code are required.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const code = roomCode.toUpperCase();
      // Check if room exists
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('code, status')
        .eq('code', code)
        .single();
        
      if (roomError || !room) {
        throw new Error('Room not found! Check the code and try again.');
      }
      
      if (room.status !== 'waiting') {
        throw new Error('Game has already started or finished.');
      }
      
      // Join room
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({ room_code: code, name: name.trim() })
        .select('*')
        .single();
        
      if (playerError) throw playerError;

      // Save playerId in localStorage
      localStorage.setItem('quizPlayerId', player.id);
      localStorage.setItem('quizPlayerName', player.name);
      
      router.push(`/room/${code}`);
    } catch (err: any) {
      setError(err.message || 'Failed to join room');
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name first.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostName: name.trim(),
          category: selectedCategory,
          difficulty
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      localStorage.setItem('quizPlayerId', data.playerId);
      localStorage.setItem('quizPlayerName', name.trim());
      
      router.push(`/room/${data.roomCode}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create room');
      setLoading(false);
    }
  };

  return (
    <main className="container animate-fade-in" style={{ justifyContent: 'center' }}>
      <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Sparkles color="var(--accent)" size={40} />
          <span className="text-gradient pulse">Quiz Night</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1.2rem' }}>
          Real-time multiplayer trivia challenge
        </p>
        
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--error)', padding: '12px', borderRadius: 'var(--radius)', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
          <button 
            style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius)', background: activeTab === 'play' ? 'var(--accent)' : 'transparent', color: activeTab === 'play' ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}
            onClick={() => setActiveTab('play')}
          >
            <Gamepad2 size={18} /> Play
          </button>
          <button 
            style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius)', background: activeTab === 'scoreboard' ? 'var(--accent)' : 'transparent', color: activeTab === 'scoreboard' ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}
            onClick={() => setActiveTab('scoreboard')}
          >
            <Trophy size={18} /> Stats
          </button>
          <button 
            style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius)', background: activeTab === 'history' ? 'var(--accent)' : 'transparent', color: activeTab === 'history' ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}
            onClick={() => setActiveTab('history')}
          >
            <CalendarDays size={18} /> History
          </button>
        </div>

        {activeTab === 'play' && (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: 'var(--radius)' }}>
              <button 
                style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius)', background: !isCreating ? 'var(--surface)' : 'transparent', color: !isCreating ? 'white' : 'var(--text-muted)' }}
                onClick={() => setIsCreating(false)}
              >
                Join Room
              </button>
              <button 
                style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius)', background: isCreating ? 'var(--surface)' : 'transparent', color: isCreating ? 'white' : 'var(--text-muted)' }}
                onClick={() => setIsCreating(true)}
              >
                Create Room
              </button>
            </div>

            <form onSubmit={isCreating ? handleCreate : handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input 
                type="text" 
                placeholder="Your Nickname" 
                className="input-field"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={15}
                required
              />
              
              {!isCreating && (
                <input 
                  type="text" 
                  placeholder="4-Letter Room Code" 
                  className="input-field"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={4}
                  required
                />
              )}

              {isCreating && (
                <>
                  <select 
                    className="input-field" 
                    value={selectedCategory} 
                    onChange={e => setSelectedCategory(e.target.value)}
                  >
                    <option value="any">Any Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <select 
                    className="input-field" 
                    value={difficulty} 
                    onChange={e => setDifficulty(e.target.value)}
                  >
                    <option value="any">Any Difficulty</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </>
              )}

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading}
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '10px' }}
              >
                {loading ? (
                  <div className="loader"></div>
                ) : isCreating ? (
                  <><UserPlus size={20} /> Create New Game</>
                ) : (
                  <><Users size={20} /> Join Game</>
                )}
              </button>
            </form>
          </>
        )}

        {activeTab === 'scoreboard' && <ScoreboardTab />}
        {activeTab === 'history' && <HistoryTab />}
      </div>
    </main>
  );
}
