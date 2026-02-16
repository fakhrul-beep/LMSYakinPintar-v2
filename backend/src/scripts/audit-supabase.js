import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function audit() {
  console.log('--- Supabase Audit ---');
  console.log('URL:', supabaseUrl);
  
  const tables = ['users', 'admins', 'tutors', 'programs', 'leads', 'bookings'];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`Table [${table}]: ERROR - ${error.message}`);
      } else {
        console.log(`Table [${table}]: OK - ${count} rows`);
      }
    } catch (err) {
      console.error(`Table [${table}]: CRITICAL ERROR - ${err.message}`);
    }
  }

  // Check connection
  const { data: health, error: healthError } = await supabase.from('users').select('id').limit(1);
  if (healthError) {
    console.error('Connection health: FAILED -', healthError.message);
  } else {
    console.log('Connection health: OK');
  }
}

audit();
