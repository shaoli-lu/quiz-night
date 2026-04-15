import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase keys. Run with: node --env-file=.env.local scripts/seedSupabase.mjs');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  try {
    console.log('1/2 Fetching categories from OpenTDB...');
    const catRes = await fetch('https://opentdb.com/api_category.php');
    if (!catRes.ok) throw new Error('Failed to fetch categories');
    const catData = await catRes.json();
    
    const categories = catData.trivia_categories || [];
    if (categories.length > 0) {
      const { error } = await supabase
        .from('categories')
        .upsert(categories.map(c => ({ id: c.id, name: c.name })));
      if (error) console.error('Error inserting categories:', error);
      else console.log(`Successfully inserted ${categories.length} categories.`);
    }

    const categoryMap = {};
    categories.forEach(c => categoryMap[c.name] = c.id);

    // Fetch multiple times to build up a decent fallback library
    let totalInserted = 0;
    console.log('2/2 Fetching questions from OpenTDB...');
    
    for (let i = 0; i < 3; i++) {
        const qRes = await fetch('https://opentdb.com/api.php?amount=50&type=multiple');
        if (!qRes.ok) {
            console.error('Failed to fetch questions chunk');
            continue;
        }
        const qData = await qRes.json();

        if (qData.results && qData.results.length > 0) {
            const questionsToInsert = qData.results.map(q => ({
                category: categoryMap[q.category] ? categoryMap[q.category].toString() : 'any',
                type: q.type,
                difficulty: q.difficulty,
                question: q.question,
                correct_answer: q.correct_answer,
                incorrect_answers: q.incorrect_answers
            }));

            const { error } = await supabase
                .from('questions')
                .insert(questionsToInsert);
                
            if (error) {
                console.error('Error inserting questions:', error);
            } else {
                totalInserted += questionsToInsert.length;
            }
        }
        // sleep to respect API limits
        await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log(`Successfully inserted ${totalInserted} questions into Supabase fallback table.`);

  } catch (err) {
    console.error('Seed error:', err);
  }
}

seed();
