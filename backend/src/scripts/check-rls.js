import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  console.log('--- Checking RLS Policies ---');
  
  // We can't directly check RLS status via supabase-js easily without raw SQL
  // But we can test access from an unauthenticated client
  
  const tables = ['programs', 'tutors', 'users'];
  
  for (const table of tables) {
    console.log(`Testing unauthenticated access to [${table}]...`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    
    if (error) {
      console.log(`  [${table}]: Access Denied/Error - ${error.message}`);
    } else {
      console.log(`  [${table}]: Access Granted - ${data.length} rows returned`);
    }
  }
}

checkRLS();
