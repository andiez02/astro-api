import { Controller, Get, Query, Param } from '@nestjs/common';
import { NftsService } from './nfts.service';
import { GetNftsQueryDto } from './dto/get-nfts-query.dto';
import { NftResponseDto } from './dto/nft-response.dto';
import { CollectionPreviewResponseDto } from './dto/collection-preview-response.dto';

@Controller('nfts')
export class NftsController {
  constructor(private readonly nftsService: NftsService) {}

  /**
   * Get NFTs
   *
   * Query parameters:
   * - collectionAddress (optional): Filter by collection contract address
   * - ownerAddress (optional): Filter by owner wallet address
   *
   * @param query - Query parameters DTO
   * @returns Array of NFTs
   */
  @Get()
  async getNfts(@Query() query: GetNftsQueryDto): Promise<NftResponseDto[]> {
    if (query.collectionAddress) {
      return this.nftsService.findByCollection(query.collectionAddress);
    }

    if (query.ownerAddress) {
      return this.nftsService.findByOwner(query.ownerAddress);
    }

    return this.nftsService.findAll();
  }

  /**
   * Get collection preview with 3 NFT images and total count
   * @param address - Collection contract address
   * @returns Collection preview with images and count
   */
  @Get(':address/preview')
  async getCollectionPreview(
    @Param('address') address: string,
  ): Promise<CollectionPreviewResponseDto> {
    return this.nftsService.getCollectionPreview(address);
  }

  /**
   * Get NFT by contract address and token ID
   * @param address - Contract address
   * @param tokenId - Token ID
   * @returns NFT details
   */
  @Get(':address/:tokenId')
  async getNftByAddressAndTokenId(
    @Param('address') address: string,
    @Param('tokenId') tokenId: string,
  ): Promise<NftResponseDto> {
    return this.nftsService.findOne(address, tokenId);
  }
}
