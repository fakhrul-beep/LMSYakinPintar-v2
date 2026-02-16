import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkColumns() {
  console.log('Checking "tutors" table...');
  const { data: tData, error: tError } = await supabase
    .from('tutors')
    .select('*')
    .limit(1);

  if (tError) {
    console.error('Error fetching tutors:', tError.message);
  } else {
    console.log('Tutors columns:', Object.keys(tData[0] || {}));
  }

  console.log('\nChecking "teachers" table...');
  const { data: teData, error: teError } = await supabase
    .from('teachers')
    .select('*')
    .limit(1);

  if (teError) {
    console.error('Error fetching teachers:', teError.message);
  } else {
    console.log('Teachers columns:', Object.keys(teData[0] || {}));
  }
}

checkColumns();
