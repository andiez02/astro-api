/**
 * =============================================================================
 * Error Response Interface - Astro NFT Marketplace
 * =============================================================================
 * Standard error response format for the entire application
 * Used by GlobalExceptionFilter and all error handlers
 * =============================================================================
 */
export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error?: string;
    messageCode?: string;
  [key: string]: unknown;
  }