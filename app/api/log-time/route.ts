import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    // 1. Kontrollera att det är du (via den hemliga nyckeln)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.API_SECRET_KEY}`) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    // 2. Läs av om det är 'in' eller 'out'
    const body = await request.json();
    const action = body.action;

    if (action !== 'in' && action !== 'out') {
      return NextResponse.json({ error: 'Ogiltig åtgärd' }, { status: 400 });
    }

    // 3. Spara i databasen
    const { error } = await supabase
      .from('time_logs')
      .insert([{ action }]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Något gick fel' }, { status: 500 });
  }
}