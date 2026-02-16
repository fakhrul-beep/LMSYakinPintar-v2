
import supabase from "../config/supabase.js";

async function checkStatus() {
  console.log("--- Checking Active Status ---");
  
  const { data: tutors, error: tutorError } = await supabase
    .from("tutors")
    .select("id, is_active");
    
  if (tutorError) {
    console.error("Error fetching tutors:", tutorError);
  } else {
    const activeTutors = tutors.filter(t => t.is_active).length;
    console.log(`Tutors: ${tutors.length} total, ${activeTutors} active`);
  }
  
  const { data: programs, error: programError } = await supabase
    .from("programs")
    .select("id, is_active");
    
  if (programError) {
    console.error("Error fetching programs:", programError);
  } else {
    const activePrograms = programs.filter(p => p.is_active).length;
    console.log(`Programs: ${programs.length} total, ${activePrograms} active`);
  }
}

checkStatus();
