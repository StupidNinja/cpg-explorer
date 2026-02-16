import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { SchemaService } from './schema.service';

@Controller('api/schema')
export class SchemaController {
  constructor(private readonly schemaService: SchemaService) {}

  @Get('docs')
  getSchemaDocumentation() {
    return this.schemaService.getSchemaDocumentation();
  }

  @Get('queries')
  getAvailableQueries() {
    return this.schemaService.getAvailableQueries();
  }

  @Get('tables')
  getTableList() {
    return this.schemaService.getTableList();
  }

  @Get('stats')
  getStats() {
    return this.schemaService.getStats();
  }

  @Get('dashboard')
  getDashboard() {
    return this.schemaService.getDashboard();
  }

  @Get('findings')
  getFindings(
    @Query('category') category?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    if (isNaN(limitNum)) {
      throw new BadRequestException('Invalid limit parameter');
    }
    return this.schemaService.getFindings(category, limitNum);
  }
}
