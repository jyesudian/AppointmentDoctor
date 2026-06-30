const fs = require('fs');
const path = 'src/app/admin/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
`  const handleEditCampSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCampForm.name) {
      triggerToast('Please designate a Name for the Camp!');
      return;
    }`,
`  const handleEditCampSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCampForm.name) {
      triggerToast('Please designate a Name for the Camp!');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (editCampForm.date < todayStr) {
      triggerToast('Launch Date cannot be in the past!');
      return;
    }`
);

content = content.replace(
`  const handleCreateCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamp.name) {
      triggerToast('Please designate a Name for the Camp!');
      return;
    }`,
`  const handleCreateCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamp.name) {
      triggerToast('Please designate a Name for the Camp!');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (newCamp.date < todayStr) {
      triggerToast('Launch Date cannot be in the past!');
      return;
    }
    if (newCamp.physicianCount === 0 && newCamp.nurseCount === 0 && newCamp.nutritionistCount === 0) {
      triggerToast('At least one Volunteer Staff Configuration Need must be 1 or above.');
      return;
    }`
);

content = content.replace(
`                      <input
                        type="date"
                        value={newCamp.date}`,
`                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={newCamp.date}`
);

content = content.replace(
`                      <input
                        type="date"
                        value={editCampForm.date}`,
`                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={editCampForm.date}`
);

fs.writeFileSync(path, content);
console.log('Successfully updated validations');
