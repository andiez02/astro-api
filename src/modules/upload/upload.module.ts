
import { Module } from '@nestjs/common';
import { UploadsService } from './upload.service';
import { UploadsController } from './upload.controller';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadModule {}
