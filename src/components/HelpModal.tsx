"use client";

import { useState, useEffect } from 'react';
import { HelpCircle, X, Info, Users, Sparkles, Trophy, BarChart3, CalendarDays } from 'lucide-react';

export default function HelpModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transition: 'all 0.3s ease',
        }}
        aria-label="Help"
        onMouseOver={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
        onMouseOut={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
      >
        <HelpCircle size={24} />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            animation: 'fadeIn 0.3s ease-out',
          }}
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Content */}
          <div 
            style={{
              maxWidth: '500px',
              width: '100%',
              background: 'rgba(30, 41, 59, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '32px',
              color: 'white',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
            onClick={e => e.stopPropagation()}
            className="animate-fade-in"
          >
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '25px',
                background: 'transparent',
                color: 'var(--text-muted)',
              }}
            >
              <X size={24} />
            </button>

            <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Info color="var(--accent)" />
              How to Play
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ background: 'rgba(109, 40, 217, 0.2)', padding: '10px', borderRadius: '12px', height: 'fit-content' }}>
                  <Users size={24} color="var(--primary-glow)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Join or Create</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.4' }}>
                    Enter your nickname and a 4-letter room code to join friends, or create a new room to host your own game.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ background: 'rgba(236, 72, 153, 0.2)', padding: '10px', borderRadius: '12px', height: 'fit-content' }}>
                  <Sparkles size={24} color="var(--secondary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Wait for Players</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.4' }}>
                    Once in the lobby, wait for your friends to join using your unique room code.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '10px', borderRadius: '12px', height: 'fit-content' }}>
                  <Trophy size={24} color="var(--accent)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Score Big</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.4' }}>
                    Answer questions as fast as possible! Quick answers earn more points and put you on top of the leaderboard.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '10px', borderRadius: '12px', height: 'fit-content' }}>
                  <BarChart3 size={24} color="#10b981" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Track Stats</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.4' }}>
                    Check the <strong>Stats</strong> tab to see your overall Wins, Losses, and Draws globally. Tap "Reset Stats" anytime to wipe the board clean.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '10px', borderRadius: '12px', height: 'fit-content' }}>
                  <CalendarDays size={24} color="#3b82f6" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Review History</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.4' }}>
                    Dive into the <strong>History</strong> tab to review past matches, see who played, and expand the details to see exactly who won.
                  </p>
                </div>
              </div>
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%', marginTop: '32px' }}
              onClick={() => setIsOpen(false)}
            >
              Got it!
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Made with ❤️ and ☕
            </div>
          </div>
        </div>
      )}
    </>
  );
}
