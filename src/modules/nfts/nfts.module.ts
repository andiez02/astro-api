import { Module } from '@nestjs/common';
import { NftsController } from './nfts.controller';
import { NftsService } from './nfts.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [NftsController],
  providers: [NftsService],
  exports: [NftsService],
})
export class NftsModule {}
