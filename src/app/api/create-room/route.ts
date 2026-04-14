import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to generate 4-letter code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: Request) {
  try {
    const { hostName, category, difficulty } = await req.json();

    if (!hostName) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // 1. Fetch questions from OpenTDB
    // Fetch more than needed to ensure we can filter out duplicates
    let url = `https://opentdb.com/api.php?amount=50&type=multiple`;
    if (category && category !== 'any') {
      url += `&category=${category}`;
    }
    if (difficulty && difficulty !== 'any') {
      url += `&difficulty=${difficulty}`;
    }

    const tdbRes = await fetch(url);
    const tdbData = await tdbRes.json();

    if (tdbData.response_code !== 0 || !tdbData.results.length) {
      return NextResponse.json({ error: 'Could not fetch questions from Trivia Database.' }, { status: 500 });
    }

    // Deduplicate questions to ensure no duplicates in the 10 rounds
    const uniqueQuestionsMap = new Map();
    for (const q of tdbData.results) {
      if (!uniqueQuestionsMap.has(q.question)) {
        uniqueQuestionsMap.set(q.question, q);
      }
    }
    const uniqueQuestions = Array.from(uniqueQuestionsMap.values()).slice(0, 10);

    if (uniqueQuestions.length === 0) {
      return NextResponse.json({ error: 'Not enough unique questions found.' }, { status: 500 });
    }

    // Format questions to include decoded text and shuffled options
    const questions = uniqueQuestions.map((q: any) => {
      const options = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);
      return {
        question: q.question,
        correct_answer: q.correct_answer,
        options
      };
    });

    const roomCode = generateRoomCode();

    // 2. Create Room in Supabase
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .insert({
        code: roomCode,
        status: 'waiting',
        category: category || 'any',
        difficulty: difficulty || 'any',
        questions: questions
      })
      .select('code')
      .single();

    if (roomError) {
      throw roomError;
    }

    // 3. Create Host Player
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .insert({
        room_code: roomCode,
        name: hostName,
        is_host: true
      })
      .select('*')
      .single();

    if (playerError) {
      throw playerError;
    }

    return NextResponse.json({
      roomCode: roomData.code,
      playerId: playerData.id
    });

  } catch (error: any) {
    console.error('Create room error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
