import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Database from 'better-sqlite3';
import * as path from 'path';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db: Database.Database;

  onModuleInit() {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../../../cpg.db');
    
    console.log(`📊 Connecting to database: ${dbPath}`);
    
    this.db = new Database(dbPath, {
      readonly: true,
      fileMustExist: true,
    });

    // Performance optimizations
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000'); // 64MB cache
    this.db.pragma('temp_store = MEMORY');

    console.log('✅ Database connected successfully');
  }

  onModuleDestroy() {
    if (this.db) {
      this.db.close();
      console.log('🔌 Database connection closed');
    }
  }

  getDatabase(): Database.Database {
    return this.db;
  }

  // Execute a query and return all results
  query<T = any>(sql: string, params: any[] = []): T[] {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as T[];
  }

  // Execute a query and return the first result
  queryOne<T = any>(sql: string, params: any[] = []): T | undefined {
    const stmt = this.db.prepare(sql);
    return stmt.get(...params) as T | undefined;
  }

  // Execute a query that doesn't return data
  execute(sql: string, params: any[] = []): Database.RunResult {
    const stmt = this.db.prepare(sql);
    return stmt.run(...params);
  }
}
