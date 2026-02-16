import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SchemaController } from './schema.controller';
import { SchemaService } from './schema.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SchemaController],
  providers: [SchemaService],
})
export class SchemaModule {}
