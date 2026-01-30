import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { UploadsService } from './upload.service'

@Controller('upload')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
      },
      fileFilter: (_, file, cb) => {
        if (!file.mimetype.startsWith('image/') &&
            !file.mimetype.startsWith('video/')) {
          return cb(
            new BadRequestException('Invalid file type'),
            false,
          )
        }
        cb(null, true)
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required')
    }

    return this.uploadsService.uploadToIPFS(file)
  }
}
