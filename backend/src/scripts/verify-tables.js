import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkTables() {
  const tables = ['mata_pelajaran', 'spesialisasi', 'mata_pelajaran_spesialisasi', 'correlation_errors'];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    console.log(`${table}: ${error ? 'missing (' + error.message + ')' : 'exists'}`);
  }
}

checkTables();
