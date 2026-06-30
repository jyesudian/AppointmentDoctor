const fs = require('fs');
const path = 'src/app/admin/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the target content using a flexible regex that allows both \r\n and \n
const targetRegex = /([ ]*)\);\s*\n\s*\}\)\s*\n\s*\}\)\s*\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*\}\)/g;
// Wait, let's write a very safe replacement by finding:
//                     })
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}
// and replacing with:
//                     });
//                   })()}
//                 </div>
//               </div>
//             </div>
//           )}

const targetStr = `                    })
                  )}
                </div>
              </div>
            </div>
          )}`;

const targetStrCRLF = targetStr.replace(/\n/g, '\r\n');

const replacementStr = `                    });
                  })()}
                </div>
              </div>
            </div>
          )}`;

const replacementStrCRLF = replacementStr.replace(/\n/g, '\r\n');

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  console.log('Replaced LF style');
} else if (content.includes(targetStrCRLF)) {
  content = content.replace(targetStrCRLF, replacementStrCRLF);
  console.log('Replaced CRLF style');
} else {
  console.log('Target string not found in either style');
}

fs.writeFileSync(path, content);
