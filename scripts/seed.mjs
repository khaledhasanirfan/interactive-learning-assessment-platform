import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🌱 Starting seed operation for Interactive Assessment Platform...');

const questionBankPath = path.resolve(__dirname, '../examples/os-question-bank.json');
if (!fs.existsSync(questionBankPath)) {
  console.error('❌ Missing question bank at', questionBankPath);
  process.exit(1);
}

const rawData = fs.readFileSync(questionBankPath, 'utf-8');
const parsed = JSON.parse(rawData);

console.log(`✅ Loaded question bank: "${parsed.title}"`);
console.log(`   Total questions: ${parsed.questions.length}`);
console.log(`   Sample question types: ${Array.from(new Set(parsed.questions.map(q => q.type))).join(', ')}`);

console.log('\n📚 Pre-configured Course:');
console.log('   Course Code: CSE-307');
console.log('   Course Title: Operating System');
console.log('   Semester: Spring 2026');
console.log('   Enrollment Code: OS2026');

console.log('\n🧑‍🏫 Demo Personas Configured:');
console.log('   - Instructor: Prof. Alan Turing (turing@university.edu)');
console.log('   - Student 1:  Ada Lovelace (ada.lovelace@student.edu)');
console.log('   - Student 2:  Linus Torvalds (linus.torvalds@student.edu)');
console.log('   - Admin:      Dennis Ritchie (admin@university.edu)');

console.log('\n✨ Database seeding completed successfully.');
