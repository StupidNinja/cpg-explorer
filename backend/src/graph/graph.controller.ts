import { Controller, Get, Query, Param, BadRequestException } from '@nestjs/common';
import { GraphService } from './graph.service';

@Controller('api/graph')
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  @Get('functions/search')
  searchFunctions(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Search query is required');
    }

    if (query.length > 100) {
      throw new BadRequestException('Search query too long (max 100 characters)');
    }

    const start = Date.now();
    const limitNum = limit ? parseInt(limit, 10) : 50;
    
    if (isNaN(limitNum)) {
      throw new BadRequestException('Invalid limit parameter');
    }
    
    const results = this.graphService.searchFunctions(query, limitNum);
    const duration = Date.now() - start;
    
    console.log(`[Search] Query="${query}" Results=${results.length} Time=${duration}ms`);
    
    return results;
  }

  @Get('functions/top')
  getTopFunctions(
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    
    if (isNaN(limitNum)) {
      throw new BadRequestException('Invalid limit parameter');
    }
    
    return this.graphService.getTopFunctions(limitNum);
  }

  @Get('functions/:id')
  getFunction(@Param('id') id: string) {
    return this.graphService.getFunction(id);
  }

  @Get('functions/:id/details')
  getFunctionDetails(@Param('id') id: string) {
    const details = this.graphService.getFunctionDetails(id);
    if (!details) {
      throw new BadRequestException(`Node with ID ${id} not found`);
    }
    return details;
  }

  @Get('functions/:id/call-graph')
  getCallGraph(
    @Param('id') id: string,
    @Query('depth') depth?: string,
    @Query('maxNodes') maxNodes?: string,
    @Query('edgeKinds') edgeKinds?: string,
  ) {
    const depthNum = depth ? parseInt(depth, 10) : 3;
    const maxNodesNum = maxNodes ? parseInt(maxNodes, 10) : 60;
    
    if (isNaN(depthNum) || isNaN(maxNodesNum)) {
      throw new BadRequestException('Invalid depth or maxNodes parameter');
    }
    
    const kinds = edgeKinds ? edgeKinds.split(',').map(k => k.trim()) : ['call'];
    
    return this.graphService.getCallGraph(id, depthNum, maxNodesNum, kinds);
  }

  @Get('functions/:id/callers')
  getCallers(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 30;
    
    if (isNaN(limitNum)) {
      throw new BadRequestException('Invalid limit parameter');
    }
    
    return this.graphService.getCallers(id, limitNum);
  }

  @Get('functions/:id/neighborhood')
  getFunctionNeighborhood(
    @Param('id') id: string,
    @Query('depth') depth?: string,
  ) {
    const depthNum = depth ? parseInt(depth, 10) : 1;
    
    if (isNaN(depthNum)) {
      throw new BadRequestException('Invalid depth parameter');
    }
    
    return this.graphService.getFunctionNeighborhood(id, depthNum);
  }

  @Get('packages')
  getPackageGraph() {
    return this.graphService.getPackageGraph();
  }
}
