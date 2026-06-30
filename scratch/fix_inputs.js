const fs = require('fs');
const path = 'src/app/admin/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// For expectedPatients in newCamp
content = content.replace(
  /type="number"\s+value=\{newCamp\.expectedPatients\}\s+onChange=\{\(e\) => setNewCamp\(\{ \.\.\.newCamp, expectedPatients: Number\(e\.target\.value\) \}\)\}/g,
  'type="number"\n                        min={1}\n                        value={newCamp.expectedPatients}\n                        onChange={(e) => setNewCamp({ ...newCamp, expectedPatients: Math.max(1, Number(e.target.value)) })}'
);

// For expectedPatients in editCampForm
content = content.replace(
  /type="number"\s+value=\{editCampForm\.expectedPatients\}\s+onChange=\{\(e\) => setEditCampForm\(\{ \.\.\.editCampForm, expectedPatients: Number\(e\.target\.value\) \}\)\}/g,
  'type="number"\n                        min={1}\n                        value={editCampForm.expectedPatients}\n                        onChange={(e) => setEditCampForm({ ...editCampForm, expectedPatients: Math.max(1, Number(e.target.value)) })}'
);

// For all other newCamp and editCampForm number inputs updating the onChange
content = content.replace(
  /onChange=\{\(e\) => (setNewCamp|setEditCampForm)\(\{ \.\.\.(newCamp|editCampForm), ([a-zA-Z]+): Number\(e\.target\.value\) \}\)\}/g,
  (match, setter, obj, field) => {
      if (field === 'expectedPatients' || field === 'durationDays') return match; 
      return `onChange={(e) => ${setter}({ ...${obj}, ${field}: Math.max(0, Number(e.target.value)) })}`;
  }
);

// Add min={0} for other number fields in newCamp and editCampForm
content = content.replace(/type="number"\s+placeholder="0"/g, 'type="number" min={0} placeholder="0"');
content = content.replace(/type="number"\s+value=\{(newCamp|editCampForm)\.(physicianCount|nurseCount|nutritionistCount)\}/g, 'type="number" min={0}\n                        value={$1.$2}');

fs.writeFileSync(path, content);
console.log('Successfully updated input constraints');
