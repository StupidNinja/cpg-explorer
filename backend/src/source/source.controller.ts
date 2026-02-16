import { Controller, Get, Query, Param, NotFoundException } from '@nestjs/common';
import { SourceService } from './source.service';

@Controller('api/source')
export class SourceController {
  constructor(private readonly sourceService: SourceService) {}

  @Get('file')
  getFileSource(@Query('path') filePath: string) {
    if (!filePath) {
      throw new NotFoundException('File path is required');
    }

    const source = this.sourceService.getFileSource(filePath);
    if (!source) {
      throw new NotFoundException(`Source file not found: ${filePath}`);
    }

    return source;
  }

  @Get('node/:id')
  getNodeSource(@Param('id') nodeId: string) {
    const source = this.sourceService.getNodeSource(nodeId);
    if (!source) {
      throw new NotFoundException(`Source not found for node: ${nodeId}`);
    }

    return source;
  }

  @Get('node/:id/context')
  getNodeSourceWithContext(
    @Param('id') nodeId: string,
    @Query('lines') contextLines?: string,
  ) {
    const lines = contextLines ? parseInt(contextLines, 10) : 10;
    const source = this.sourceService.getNodeSourceWithContext(nodeId, lines);
    
    if (!source) {
      throw new NotFoundException(`Source not found for node: ${nodeId}`);
    }

    return source;
  }

  @Get('search')
  searchFiles(@Query('q') query: string, @Query('limit') limit?: string) {
    if (!query) {
      return [];
    }

    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.sourceService.searchFiles(query, limitNum);
  }
}
