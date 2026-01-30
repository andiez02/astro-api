import { Controller, Get, Query, Param } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { GetCollectionsQueryDto } from './dto/get-collections-query.dto';
import { CollectionResponseDto } from './dto/collection-response.dto';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  /**
   * Get collections
   * 
   * Query parameters:
   * - creatorAddress (optional): Filter by creator wallet address
   * 
   * @param query - Query parameters DTO
   * @returns Array of collections
   */
  @Get()
  async getCollections(
    @Query() query: GetCollectionsQueryDto,
  ): Promise<CollectionResponseDto[]> {
    if (query.creatorAddress) {
      return this.collectionsService.findByCreator(query.creatorAddress);
    }

    return this.collectionsService.findAll();
  }

  /**
   * Get collection by address
   * @param address - Contract address
   * @returns Collection details
   */
  @Get(':address')
  async getCollectionByAddress(
    @Param('address') address: string,
  ): Promise<CollectionResponseDto> {
    return this.collectionsService.findByAddress(address);
  }
}
