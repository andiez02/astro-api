/**
 * =============================================================================
 * Health Controller - Astro NFT Marketplace
 * =============================================================================
 * Controller xử lý các request kiểm tra health của hệ thống
 * Endpoint: GET /health
 * =============================================================================
 */

import { Controller, Get } from '@nestjs/common';
import { HealthService, HealthCheckResponse } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Kiểm tra trạng thái hoạt động của ứng dụng
   * @returns HealthCheckResponse
   */
  @Get()
  async check(): Promise<HealthCheckResponse> {
    return this.healthService.check();
  }

  /**
   * Endpoint đơn giản để kiểm tra server có đang chạy không
   * Thường dùng cho load balancer hoặc container orchestration
   */
  @Get('ping')
  ping(): { message: string } {
    return { message: 'pong' };
  }
}
