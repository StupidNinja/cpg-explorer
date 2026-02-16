import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SourceController } from './source.controller';
import { SourceService } from './source.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SourceController],
  providers: [SourceService],
})
export class SourceModule {}
