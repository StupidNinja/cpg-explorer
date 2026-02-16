const Database = require('better-sqlite3');
const db = new Database('/app/cpg.db');

const samples = db.prepare(`SELECT name FROM nodes WHERE kind = 'function' LIMIT 30`).all();
console.log('Sample function names:');
samples.forEach((row, i) => {
  console.log(`${i + 1}. ${row.name}`);
});

db.close();
