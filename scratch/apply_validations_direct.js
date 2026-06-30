const fs = require('fs');
const path = 'src/app/admin/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. handleCreateCamp validations
// Match 'const handleCreateCamp = async (e: React.FormEvent) => {' followed by 'e.preventDefault();' and 'if (!newCamp.name) { ... }'
const createCampRegex = /(const\s+handleCreateCamp\s*=\s*async\s*\(\s*e:\s*React\.FormEvent\s*\)\s*=>\s*\{\s*e\.preventDefault\(\);\s*if\s*\(!newCamp\.name\)\s*\{\s*triggerToast\('Please designate a Name for the Camp!'\);\s*return;\s*\})/g;

if (content.match(createCampRegex)) {
  content = content.replace(createCampRegex, (match) => {
    return `${match}
    const todayStr = new Date().toISOString().split('T')[0];
    if (newCamp.date < todayStr) {
      triggerToast('Launch Date cannot be in the past!');
      return;
    }
    if (newCamp.physicianCount === 0 && newCamp.nurseCount === 0 && newCamp.nutritionistCount === 0) {
      triggerToast('At least one Volunteer Staff Configuration Need must be 1 or above.');
      return;
    }`;
  });
  console.log('Applied handleCreateCamp validations');
} else {
  console.log('handleCreateCamp pattern not found');
}

// 2. newCamp date min attribute
// Replace type="date" value={newCamp.date}
const newCampDateRegex = /type="date"\s*value=\{newCamp\.date\}/g;
if (content.match(newCampDateRegex)) {
  content = content.replace(newCampDateRegex, 'type="date"\n                        min={new Date().toISOString().split(\'T\')[0]}\n                        value={newCamp.date}');
  console.log('Applied newCamp date min');
} else {
  console.log('newCamp date pattern not found');
}

// 3. editCampForm date min attribute
// Replace type="date" value={editCampForm.date}
const editCampDateRegex = /type="date"\s*value=\{editCampForm\.date\}/g;
if (content.match(editCampDateRegex)) {
  content = content.replace(editCampDateRegex, 'type="date"\n                        min={new Date().toISOString().split(\'T\')[0]}\n                        value={editCampForm.date}');
  console.log('Applied editCampForm date min');
} else {
  console.log('editCampForm date pattern not found');
}

fs.writeFileSync(path, content);
console.log('Finished applying validations script');
