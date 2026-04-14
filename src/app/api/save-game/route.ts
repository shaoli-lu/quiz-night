import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { roomCode, rounds, players } = await req.json();

    // 1. Insert into saved_games
    const { data: game, error: gameError } = await supabase
      .from('saved_games')
      .insert({
        room_code: roomCode,
        rounds: rounds
      })
      .select('id')
      .single();

    if (gameError) throw gameError;

    // Determine winners
    const maxScore = Math.max(...players.map((p: any) => p.score));
    const winners = players.filter((p: any) => p.score === maxScore);
    const isDraw = winners.length > 1;

    // 2. Insert into saved_players
    const playerInserts = players.map((p: any) => ({
      game_id: game.id,
      player_name: p.name,
      score: p.score,
      is_winner: p.score === maxScore,
      is_draw: p.score === maxScore && isDraw
    }));

    const { error: playersError } = await supabase
      .from('saved_players')
      .insert(playerInserts);

    if (playersError) throw playersError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to save game:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
