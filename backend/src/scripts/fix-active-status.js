import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixData() {
  console.log('--- Fixing Data Status ---');
  
  // Update programs
  const { data: progData, error: progError } = await supabase
    .from('programs')
    .update({ is_active: true })
    .neq('is_active', true);
  
  if (progError) console.error('Error updating programs:', progError.message);
  else console.log('Programs updated to active');

  // Update tutors
  const { data: tutorData, error: tutorError } = await supabase
    .from('tutors')
    .update({ is_active: true })
    .neq('is_active', true);
  
  if (tutorError) console.error('Error updating tutors:', tutorError.message);
  else console.log('Tutors updated to active');
  
  // Check if they are now visible
  const { count: progCount } = await supabase.from('programs').select('*', { count: 'exact', head: true }).eq('is_active', true);
  const { count: tutorCount } = await supabase.from('tutors').select('*', { count: 'exact', head: true }).eq('is_active', true);
  
  console.log(`Active Programs: ${progCount}`);
  console.log(`Active Tutors: ${tutorCount}`);
}

fixData();
