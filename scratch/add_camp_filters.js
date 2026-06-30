const fs = require('fs');
const path = 'src/app/admin/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add state variables if not already added
if (!content.includes('campFilterStatus')) {
  const stateTarget = `  // Camp Details Modal States
  const [selectedCampDetails, setSelectedCampDetails] = useState<any>(null);`;

  const stateReplacement = `  // Camp Filter States (Overview Tab)
  const [campFilterStatus, setCampFilterStatus] = useState<string>('All');
  const [campSearchQuery, setCampSearchQuery] = useState<string>('');

  // Camp Details Modal States
  const [selectedCampDetails, setSelectedCampDetails] = useState<any>(null);`;

  content = content.replace(stateTarget, stateReplacement);
  console.log('Added state variables');
}

// 2. Add search and filter controls in the UI if not already added
if (!content.includes('campSearchQuery')) {
  const uiTarget = `                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Active Camp Campaigns & Deployment Roster</h4>
                  <span className="bg-indigo-100 text-indigo-800 font-bold text-[10px] px-2.5 py-1 rounded-full">
                    {camps.length} Active Campaigns
                  </span>
                </div>`;

  const uiReplacement = `                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
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

  content = content.replace(uiTarget, uiReplacement);
  console.log('Added UI controls');
}

// 3. Modify mapping logic start
// Clean find & replace to be whitespace independent
content = content.replace(
  /\{\s*camps\.length\s*===\s*0\s*\?\s*\([\s\S]*?No\s+camp\s+campaigns\s+currently\s+defined\.[\s\S]*?<\/div>[\s\S]*?\)\s*:\s*\([\s\S]*?camps\.map\(\(camp:\s*any\)\s*=>\s*\{/g,
  `{(() => {
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

                    if (filtered.length === 0) {
                      return (
                        <div className="md:col-span-2 p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400">
                          {camps.length === 0 
                            ? 'No camp campaigns currently defined. Use "Configure Camp" tab to register new fields.'
                            : 'No camp campaigns match the current filter criteria.'}
                        </div>
                      );
                    }

                    return filtered.map((camp: any) => {`
);
console.log('Modified mapping logic start');

// 4. Modify mapping logic end
// Find:
//                     })
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}
//
//           {/* TAB 2: VERIFICATION Roster */}
//           {activeTab === 'verification' && (
content = content.replace(
  /\}\)\s*\)\s*\}\s*<\/div>\s*<\/div>\s*<\/div>\s*\}\s*\{\/\*\s*TAB\s*2:\s*VERIFICATION\s*Roster/g,
  `});
                  })()}
                </div>
              </div>
            </div>
          }
          {/* TAB 2: VERIFICATION Roster`
);
console.log('Modified mapping logic end');

fs.writeFileSync(path, content);
console.log('Finished updating filters');
