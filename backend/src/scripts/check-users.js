import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkUsers() {
  const { data, error } = await supabase.from('users').select('email, role');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Users:', data);
  }
}

checkUsers();
