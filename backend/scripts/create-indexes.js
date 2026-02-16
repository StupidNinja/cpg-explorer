const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../../cpg.db');

console.log('📊 Opening database:', dbPath);
const db = new Database(dbPath);

console.log('🔧 Creating indexes...');

try {
  // Index for function name searches
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_nodes_kind_name 
    ON nodes(kind, name);
  `);
  console.log('✅ Created index: idx_nodes_kind_name');

  // Index for edge queries (call graph traversal)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_edges_source 
    ON edges(source);
  `);
  console.log('✅ Created index: idx_edges_source');

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_edges_target 
    ON edges(target);
  `);
  console.log('✅ Created index: idx_edges_target');

  // Index for edge kind filtering
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_edges_kind 
    ON edges(kind);
  `);
  console.log('✅ Created index: idx_edges_kind');

  // Index for file-based queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_nodes_file 
    ON nodes(file);
  `);
  console.log('✅ Created index: idx_nodes_file');

  console.log('✅ All indexes created successfully!');
  
  // Analyze tables to update statistics
  db.exec('ANALYZE;');
  console.log('✅ Database statistics updated');

} catch (error) {
  console.error('❌ Error creating indexes:', error);
  process.exit(1);
} finally {
  db.close();
  console.log('🔌 Database closed');
}
