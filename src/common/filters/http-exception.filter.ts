import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { ErrorResponse } from '../interfaces/error.interface';
import { httpErrors } from '../exceptions';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly configService: ConfigService) {}
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    const errorResponse: ErrorResponse =
      exception instanceof HttpException
        ? (exception.getResponse() as ErrorResponse)
        : (httpErrors.INTERNAL_SERVER_ERROR as ErrorResponse);

    response.status(status).json({
      statusCode: status,
      messageCode: errorResponse?.messageCode,
      message: errorResponse?.message,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      error:
        this.configService.get('NODE_ENV') !== 'production' ? exception : null,
    });
  }
}
