import { MORPHY_COURSES, ACADEMY_FACULTY, ACADEMY_FACILITIES } from './src/data/coursesData.js';

console.log('=== TEST 1: Course Data Integrity ===');
console.log(`Total Courses: ${MORPHY_COURSES.length}`);
MORPHY_COURSES.forEach((c, idx) => {
  if (!c.id || !c.title || !c.category || !c.price || !c.emi || !c.modules || c.modules.length === 0) {
    throw new Error(`Course #${idx} (${c.title}) missing required fields!`);
  }
  console.log(`✓ Course ${idx + 1}: [${c.category}] ${c.title} (${c.duration}, ${c.price}) - ${c.modules.length} modules`);
});

console.log('\n=== TEST 2: Faculty & Facilities Integrity ===');
console.log(`Total Faculty: ${ACADEMY_FACULTY.length}`);
ACADEMY_FACULTY.forEach((f) => console.log(`✓ Faculty: ${f.name} (${f.role})`));
console.log(`Total Facilities: ${ACADEMY_FACILITIES.length}`);
ACADEMY_FACILITIES.forEach((fa) => console.log(`✓ Facility: ${fa.title}`));

console.log('\n=== TEST 3: Search & Filter Logic Verification ===');
const testQuery = 'Maya';
const searchResults = MORPHY_COURSES.filter(c => 
  c.title.toLowerCase().includes(testQuery.toLowerCase()) ||
  c.tools.some(t => t.toLowerCase().includes(testQuery.toLowerCase()))
);
console.log(`Search for "${testQuery}" found ${searchResults.length} course(s):`, searchResults.map(r => r.title));
if (searchResults.length === 0) throw new Error('Search logic failed for Maya!');

const vfxCategory = MORPHY_COURSES.filter(c => c.category === 'VFX');
console.log(`Filter by "VFX" found ${vfxCategory.length} course(s):`, vfxCategory.map(r => r.title));
if (vfxCategory.length === 0) throw new Error('Category filter failed for VFX!');

console.log('\n=== ALL JAVASCRIPT & DATA CONTRACT TESTS PASSED (100% OK) ===');

