"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Crown, Play, CheckCircle2, XCircle, Trophy, Home, Users } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RoomClientProps {
  code: string;
}

export default function RoomClient({ code }: RoomClientProps) {
  const router = useRouter();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  
  const [room, setRoom] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(10);
  const [myAnswer, setMyAnswer] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [gameOverConfetti, setGameOverConfetti] = useState(false);

  useEffect(() => {
    // Client-side local storage init
    const id = localStorage.getItem('quizPlayerId');
    const name = localStorage.getItem('quizPlayerName');
    if (!id || !name) {
      router.push('/');
      return;
    }
    setPlayerId(id);
    setPlayerName(name);

    // Initial Fetch
    const fetchState = async () => {
      const { data: r } = await supabase.from('rooms').select('*').eq('code', code).single();
      const { data: p } = await supabase.from('players').select('*').eq('room_code', code);
      if (r) setRoom(r);
      if (p) setPlayers(p.sort((a,b) => b.score - a.score));
    };

    fetchState();

    // Subscribe to Room changes
    const roomSub = supabase.channel(`room:${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${code}` }, payload => {
        setRoom(payload.new);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_code=eq.${code}` }, payload => {
        fetchState();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomSub);
    };
  }, [code, router]);

  // Game Loop Timer Handler
  useEffect(() => {
    if (room?.status !== 'playing') return;

    if (isRevealed) {
      // Host automatically goes to next question after 4 seconds
      const hostCheck = players.find(p => p.id === playerId);
      if (hostCheck?.is_host) {
        const nextQ = setTimeout(async () => {
          if (room.current_question + 1 >= room.questions.length) {
            await supabase.from('rooms').update({ status: 'finished' }).eq('code', code);
            // Save game details for history & scoreboard
            try {
              await fetch('/api/save-game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  roomCode: code,
                  rounds: room.questions.length,
                  players: players.map(p => ({ name: p.name, score: p.score }))
                })
              });
            } catch (err) {
              console.error("Failed to save game history", err);
            }
          } else {
            await supabase.from('rooms').update({ current_question: room.current_question + 1 }).eq('code', code);
          }
        }, 4000);
        return () => clearTimeout(nextQ);
      }
      return;
    }

    // Question Timer
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Time is up, reveal answers
      setIsRevealed(true);
    }
  }, [room?.status, room?.current_question, timeLeft, isRevealed, players, playerId, code, room?.questions?.length]);

  // Reset state when question changes
  useEffect(() => {
    if (room?.status === 'playing') {
      setTimeLeft(10);
      setIsRevealed(false);
      setMyAnswer(null);
    }
  }, [room?.current_question, room?.status]);

  // Handle Confetti on Finish
  useEffect(() => {
    if (room?.status === 'finished' && !gameOverConfetti) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      setGameOverConfetti(true);
    }
  }, [room?.status, gameOverConfetti]);

  const decodeHTML = (html: string) => {
    // simple decode
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  const handleStartGame = async () => {
    if (!room || room.questions.length === 0) return;
    await supabase.from('rooms').update({
      status: 'playing',
      current_question: 0
    }).eq('code', code);
  };

  const submitAnswer = async (answer: string) => {
    if (myAnswer || isRevealed) return; // Prevent double answer
    setMyAnswer(answer);

    const question = room.questions[room.current_question];
    const isCorrect = answer === question.correct_answer;

    if (isCorrect) {
      // Points based on time left (max 10, min 1)
      const points = timeLeft * 10;
      const me = players.find(p => p.id === playerId);
      if (me) {
        await supabase.from('players').update({ score: me.score + points }).eq('id', playerId);
      }
    }
  };

  if (!room) {
    return <div className="container animate-fade-in"><div className="loader" style={{margin: 'auto'}}></div></div>;
  }

  const isHost = players.find(p => p.id === playerId)?.is_host;
  const currentQuestion = room.questions ? room.questions[room.current_question] : null;

  return (
    <main className="container animate-fade-in" style={{ justifyContent: room.status === 'playing' ? 'flex-start' : 'center' }}>
      
      {room.status === 'waiting' && (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--accent)' }}>Room Code</h2>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius)', fontSize: '3rem', letterSpacing: '10px', marginBottom: '2rem', fontWeight: 800 }}>
            {room.code}
          </div>
          
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Users size={24} /> Players Waiting ({players.length})
          </h3>
          
          <div style={{ display: 'grid', gap: '10px', marginBottom: '2rem' }}>
            {players.map(p => (
              <div key={p.id} style={{ background: 'var(--surface)', padding: '12px 20px', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{p.name} {p.id === playerId && '(You)'}</span>
                {p.is_host && <Crown size={20} color="var(--accent)" />}
              </div>
            ))}
          </div>

          {isHost ? (
            <button className="btn-primary" onClick={handleStartGame} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '1.2rem', padding: '15px' }}>
              <Play fill="white" /> Start Game
            </button>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Waiting for host to start...</p>
          )}
        </div>
      )}

      {room.status === 'playing' && currentQuestion && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '10px 20px', borderRadius: 'var(--radius)' }}>
            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>Question {room.current_question + 1} / {room.questions.length}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '1.5rem', color: timeLeft <= 3 ? 'var(--error)' : 'white' }}>
              {timeLeft}s
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', flex: 1 }}>
            <h2 style={{ fontSize: '1.5rem', lineHeight: '1.4', marginBottom: '2rem', textAlign: 'center' }}>
              {decodeHTML(currentQuestion.question)}
            </h2>

            <div style={{ display: 'grid', gap: '12px' }}>
              {currentQuestion.options.map((opt: string, i: number) => {
                let btnClass = 'btn-quiz-option';
                
                if (isRevealed) {
                  if (opt === currentQuestion.correct_answer) btnClass += ' correct';
                  else if (opt === myAnswer) btnClass += ' incorrect';
                } else if (opt === myAnswer) {
                  btnClass += ' selected';
                }

                return (
                  <button 
                    key={i} 
                    className={btnClass}
                    onClick={() => submitAnswer(opt)}
                    disabled={isRevealed || myAnswer !== null}
                  >
                    <span>{decodeHTML(opt)}</span>
                    {isRevealed && opt === currentQuestion.correct_answer && <CheckCircle2 color="var(--success)" size={20} />}
                    {isRevealed && opt === myAnswer && opt !== currentQuestion.correct_answer && <XCircle color="var(--error)" size={20} />}
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Active Leaderboard Bar */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: 'var(--radius)', overflowX: 'auto', display: 'flex', gap: '15px' }}>
             {players.map(p => (
               <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.name}</div>
                 <div style={{ fontWeight: 'bold' }}>{p.score}</div>
               </div>
             ))}
          </div>

        </div>
      )}

      {room.status === 'finished' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <Trophy size={60} color="var(--accent)" style={{ margin: '0 auto 1.5rem auto' }} />
          <h1 className="text-gradient pulse" style={{ fontSize: '3rem', marginBottom: '2rem' }}>Final Scores</h1>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '3rem' }}>
            {players.map((p, i) => (
              <div 
                key={p.id} 
                style={{ 
                  background: i === 0 ? 'rgba(245, 158, 11, 0.2)' : 'var(--surface)', 
                  border: i === 0 ? '1px solid var(--accent)' : '1px solid transparent',
                  padding: '16px 24px', 
                  borderRadius: 'var(--radius)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  transform: i === 0 ? 'scale(1.05)' : 'scale(1)',
                  zIndex: i === 0 ? 10 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: i === 0 ? 'var(--accent)' : 'var(--text-muted)' }}>#{i + 1}</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>{p.name} {p.id === playerId && '(You)'}</span>
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{p.score} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>pts</span></span>
              </div>
            ))}
          </div>

          <button className="btn-secondary" onClick={() => router.push('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            <Home size={20} /> Back to Home
          </button>
        </div>
      )}

    </main>
  );
}
