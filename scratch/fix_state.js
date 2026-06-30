const fs = require('fs');
const path = 'src/app/admin/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add state variables with a regex that handles both CRLF and LF
const stateRegex = /\/\/ Camp Details Modal States\s*\r?\n\s*const\s*\[selectedCampDetails,\s*setSelectedCampDetails\]\s*=\s*useState<any>\(null\);/;

if (content.match(stateRegex)) {
  content = content.replace(stateRegex, `// Camp Filter States (Overview Tab)
  const [campFilterStatus, setCampFilterStatus] = useState<string>('All');
  const [campSearchQuery, setCampSearchQuery] = useState<string>('');

  // Camp Details Modal States
  const [selectedCampDetails, setSelectedCampDetails] = useState<any>(null);`);
  console.log('Successfully added state variables');
} else {
  console.log('Could not find selectedCampDetails state target');
}

// 2. Add search and filter controls in the UI if not already added
// Let's check if they are already present. We search for "Search camp or location..."
if (!content.includes('Search camp or location...')) {
  const uiRegex = /<div className="flex justify-between items-center">\s*\r?\n\s*<h4 className="font-bold text-slate-805? text-sm uppercase tracking-wider">Active Camp Campaigns & Deployment Roster<\/h4>[\s\S]*?\{camps\.length\}\s+Active Campaigns\s*\r?\n\s*<\/span>\s*\r?\n\s*<\/div>/;

  // Let's use a simpler match:
  const uiSimpleRegex = /Active Camp Campaigns & Deployment Roster<\/h4>\s*\r?\n\s*<span className="bg-indigo-100 text-indigo-800 font-bold text-\[10px\] px-2.5 py-1 rounded-full">\s*\r?\n\s*\{camps\.length\}\s*Active Campaigns\s*\r?\n\s*<\/span>/;

  // Let's replace the whole header block around "Active Camp Campaigns & Deployment Roster"
  // Let's find:
  // <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Active Camp Campaigns & Deployment Roster</h4>
  // followed by the span and closing div
  const targetHeaderStr = `<div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Active Camp Campaigns & Deployment Roster</h4>
                  <span className="bg-indigo-100 text-indigo-800 font-bold text-[10px] px-2.5 py-1 rounded-full">
                    {camps.length} Active Campaigns
                  </span>
                </div>`;
  
  const targetHeaderStrCRLF = targetHeaderStr.replace(/\n/g, '\r\n');

  const uiReplacement = `<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                  <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Active Camp Campaigns & Deployment Roster</h4>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search camp or location..."
                      value={campSearchQuery}
                      onChange={(e) => setCampSearchQuery(e.target.value)}
                      className="p-1.5 px-3 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-slate-700 min-w-[180px]"
                    />
                    <select
                      value={campFilterStatus}
                      onChange={(e) => setCampFilterStatus(e.target.value)}
                      className="p-1.5 px-3 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-semibold text-slate-700"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Drafting">Drafting</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <span className="bg-indigo-100 text-indigo-800 font-bold text-[10px] px-2.5 py-1 rounded-full">
                      {(() => {
                        const todayStr = new Date().toLocaleDateString('en-CA');
                        const filtered = camps.filter((camp) => {
                          const isPast = camp.date < todayStr;
                          const computedStatus = isPast ? 'Completed' : camp.status;
                          if (campFilterStatus !== 'All' && computedStatus !== campFilterStatus) return false;
                          if (campSearchQuery.trim()) {
                            const q = campSearchQuery.toLowerCase();
                            const matchesName = (camp.name || '').toLowerCase().includes(q);
                            const matchesLocation = (camp.location || '').toLowerCase().includes(q);
                            if (!matchesName && !matchesLocation) return false;
                          }
                          return true;
                        });
                        return filtered.length;
                      })()} Campaigns
                    </span>
                  </div>
                </div>`;

  const uiReplacementCRLF = uiReplacement.replace(/\n/g, '\r\n');

  if (content.includes(targetHeaderStr)) {
    content = content.replace(targetHeaderStr, uiReplacement);
    console.log('Successfully replaced UI controls (LF)');
  } else if (content.includes(targetHeaderStrCRLF)) {
    content = content.replace(targetHeaderStrCRLF, uiReplacementCRLF);
    console.log('Successfully replaced UI controls (CRLF)');
  } else {
    console.log('Could not find UI controls target header block');
  }
}

fs.writeFileSync(path, content);
console.log('Finished fix_state script');
