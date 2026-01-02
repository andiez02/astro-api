/**
 * =============================================================================
 * Exception Utility - Astro NFT Marketplace
 * =============================================================================
 * Helper functions to throw exceptions with ErrorResponse format
 * =============================================================================
 */

import {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ErrorResponse } from '../interfaces/error.interface';

/**
 * Create HttpException with ErrorResponse format
 */
export function createException(
  statusCode: HttpStatus,
  message: string | string[],
  messageCode?: string,
): HttpException {
  const response: Partial<ErrorResponse> = {
    message,
    messageCode,
  };

  return new HttpException(response, statusCode);
}

/**
 * Helper functions for common exceptions
 */
export const Exceptions = {
  badRequest: (message: string, messageCode?: string) =>
    new BadRequestException({ message, messageCode } as ErrorResponse),

  unauthorized: (message: string, messageCode?: string) =>
    new UnauthorizedException({ message, messageCode } as ErrorResponse),

  forbidden: (message: string, messageCode?: string) =>
    new ForbiddenException({ message, messageCode } as ErrorResponse),

  notFound: (message: string, messageCode?: string) =>
    new NotFoundException({ message, messageCode } as ErrorResponse),

  conflict: (message: string, messageCode?: string) =>
    new ConflictException({ message, messageCode } as ErrorResponse),

  unprocessable: (message: string, messageCode?: string) =>
    new UnprocessableEntityException({ message, messageCode } as ErrorResponse),
};

