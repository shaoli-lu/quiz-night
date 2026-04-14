import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // Delete all saved games. Because of ON DELETE CASCADE, this deletes the players too.
    const { error } = await supabase
      .from('saved_games')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Note: To delete all rows, need some filter in Supabase client usually. `.neq` string is a hack to match everything.

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to reset stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
