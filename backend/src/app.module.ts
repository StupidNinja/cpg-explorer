import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { GraphModule } from './graph/graph.module';
import { SourceModule } from './source/source.module';
import { SchemaModule } from './schema/schema.module';

@Module({
  imports: [
    DatabaseModule,
    SchemaModule,
    GraphModule,
    SourceModule,
  ],
})
export class AppModule {}
