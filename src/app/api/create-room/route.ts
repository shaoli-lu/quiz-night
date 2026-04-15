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

    let results: any[] = [];
    try {
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
      if (!tdbRes.ok) throw new Error('OpenTDB fetch failed');
      const tdbData = await tdbRes.json();

      if (tdbData.response_code !== 0 || !tdbData.results.length) {
        throw new Error('No results from OpenTDB');
      }
      results = tdbData.results;
    } catch (err) {
      console.warn('OpenTDB fetch failed, falling back to Supabase questions', err);
      // Fallback to Supabase `questions` table
      let query = supabase.from('questions').select('*');
      if (category && category !== 'any') {
        query = query.eq('category', category.toString());
      }
      if (difficulty && difficulty !== 'any') {
        query = query.eq('difficulty', difficulty);
      }
      
      let { data, error } = await query.limit(50);

      // If we don't have enough specific matches, loosen criteria
      if (error || !data || data.length < 10) {
        console.warn('Not enough specific fallback questions, loosening criteria...');
        let looseQuery = supabase.from('questions').select('*');
        if (category && category !== 'any') {
          looseQuery = looseQuery.eq('category', category.toString());
        }
        const { data: looseData } = await looseQuery.limit(50);

        if (!looseData || looseData.length < 10) {
           // Fetch any questions if even that fails
           const { data: anyData } = await supabase.from('questions').select('*').limit(50);
           data = anyData || [];
        } else {
           data = looseData;
        }
      }

      if (!data || data.length === 0) {
         console.error('Fallback query results were empty or there was an error.', error);
         return NextResponse.json({ error: 'Could not fetch questions from Trivia Database or Fallback.' }, { status: 500 });
      }
      results = data;
    }

    // Deduplicate questions to ensure no duplicates in the 10 rounds
    const uniqueQuestionsMap = new Map();
    for (const q of results) {
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
