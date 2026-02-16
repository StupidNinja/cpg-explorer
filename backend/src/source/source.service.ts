import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface SourceCode {
  file: string;
  content: string;
  line?: number;
  end_line?: number;
}

@Injectable()
export class SourceService {
  constructor(private readonly dbService: DatabaseService) {}

  // Get source code for a specific file
  getFileSource(filePath: string): SourceCode | null {
    const result = this.dbService.queryOne<{ file: string; content: string }>(
      'SELECT file, content FROM sources WHERE file = ?',
      [filePath]
    );

    if (!result) {
      return null;
    }

    return {
      file: result.file,
      content: result.content,
    };
  }

  // Get source code for a specific node
  getNodeSource(nodeId: string): SourceCode | null {
    const node = this.dbService.queryOne<{
      file: string;
      line: number;
      end_line: number;
    }>(
      'SELECT file, line, end_line FROM nodes WHERE id = ?',
      [nodeId]
    );

    if (!node || !node.file) {
      return null;
    }

    const source = this.getFileSource(node.file);
    if (!source) {
      return null;
    }

    // Extract relevant lines
    const lines = source.content.split('\n');
    const startLine = Math.max(0, (node.line || 1) - 1);
    const endLine = Math.min(lines.length, node.end_line || lines.length);
    
    const relevantContent = lines.slice(startLine, endLine).join('\n');

    return {
      file: node.file,
      content: relevantContent,
      line: node.line,
      end_line: node.end_line,
    };
  }

  // Get full source with context for a node
  getNodeSourceWithContext(nodeId: string, contextLines: number = 10): SourceCode | null {
    const node = this.dbService.queryOne<{
      file: string;
      line: number;
      end_line: number;
    }>(
      'SELECT file, line, end_line FROM nodes WHERE id = ?',
      [nodeId]
    );

    if (!node || !node.file) {
      return null;
    }

    const source = this.getFileSource(node.file);
    if (!source) {
      return null;
    }

    // Extract with context
    const lines = source.content.split('\n');
    const startLine = Math.max(0, (node.line || 1) - 1 - contextLines);
    const endLine = Math.min(lines.length, (node.end_line || lines.length) + contextLines);
    
    const contentWithContext = lines.slice(startLine, endLine).join('\n');

    return {
      file: node.file,
      content: contentWithContext,
      line: startLine + 1,
      end_line: endLine,
    };
  }

  // Search source files
  searchFiles(query: string, limit: number = 50): Array<{ file: string }> {
    return this.dbService.query<{ file: string }>(
      `SELECT DISTINCT file
       FROM sources
       WHERE file LIKE ?
       ORDER BY file
       LIMIT ?`,
      [`%${query}%`, limit]
    );
  }
}
