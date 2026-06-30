const fs = require('fs');
const content = fs.readFileSync('schema.sql', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('policy')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
