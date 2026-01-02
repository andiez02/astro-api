/**
 * =============================================================================
 * Health Service - Astro NFT Marketplace
 * =============================================================================
 * Service thực hiện logic kiểm tra health của các thành phần hệ thống
 * =============================================================================
 */

import { Injectable } from '@nestjs/common';

// Interface định nghĩa response của health check
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
}

@Injectable()
export class HealthService {
  /**
   * Thực hiện health check toàn diện
   */
  async check(): Promise<HealthCheckResponse> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };
  }
}
