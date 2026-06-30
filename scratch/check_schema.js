const fs = require('fs');
const content = fs.readFileSync('schema.sql', 'utf8');
const lines = content.split('\n');
console.log('Total lines:', lines.length);

console.log('--- Search for "invitations" ---');
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('invitation')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});

console.log('--- Search for "CREATE TABLE" ---');
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('create table')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
