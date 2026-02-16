const Database = require('better-sqlite3');
const db = new Database('/app/cpg.db');

console.log('=== Query Performance Analysis ===\n');

// Check indexes
console.log('Indexes on nodes table:');
const indexes = db.prepare(`SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='nodes'`).all();
indexes.forEach(idx => {
  console.log(`  ${idx.name}: ${idx.sql || '(auto)'}`);
});

console.log('\n=== Query Plan for Search ===');
const plan = db.prepare(`EXPLAIN QUERY PLAN
  SELECT id, kind, name, type_info, file, line, end_line
  FROM nodes
  WHERE kind = 'function' AND name LIKE '%Register%'
  LIMIT 50`).all();

plan.forEach(row => {
  console.log(`${row.detail}`);
});

console.log('\n=== Testing Query Speed ===');
const start = Date.now();
const results = db.prepare(`
  SELECT id, kind, name, type_info, file, line, end_line
  FROM nodes
  WHERE kind = 'function' AND name LIKE ?
  LIMIT 50
`).all('%Register%');
const duration = Date.now() - start;

console.log(`Found ${results.length} results in ${duration}ms`);
console.log('First 5 results:');
results.slice(0, 5).forEach(r => console.log(`  - ${r.name}`));

db.close();
