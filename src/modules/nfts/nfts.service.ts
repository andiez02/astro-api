import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NftResponseDto } from './dto/nft-response.dto';
import { CollectionPreviewResponseDto } from './dto/collection-preview-response.dto';

@Injectable()
export class NftsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get NFTs by collection address
   * @param collectionAddress - Contract address of the collection
   * @returns Array of NFTs
   */
  async findByCollection(collectionAddress: string): Promise<NftResponseDto[]> {
    const normalizedAddress = collectionAddress.toLowerCase();

    const nfts = await this.prisma.nft.findMany({
      where: {
        contractAddress: normalizedAddress,
      },
      select: {
        contractAddress: true,
        tokenId: true,
        ownerAddress: true,
        name: true,
        description: true,
        imageUrl: true,
        metadataUri: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return nfts.map(
      (nft) =>
        new NftResponseDto({
          ...nft,
          name: nft.name || undefined,
          description: nft.description || undefined,
          image: nft.imageUrl || undefined,
          metadataUri: nft.metadataUri || undefined,
        }),
    );
  }

  /**
   * Get NFTs by owner address
   * @param ownerAddress - Wallet address of the owner
   * @returns Array of NFTs
   */
  async findByOwner(ownerAddress: string): Promise<NftResponseDto[]> {
    const normalizedAddress = ownerAddress.toLowerCase();

    const nfts = await this.prisma.nft.findMany({
      where: {
        ownerAddress: normalizedAddress,
      },
      select: {
        contractAddress: true,
        tokenId: true,
        ownerAddress: true,
        name: true,
        description: true,
        imageUrl: true,
        metadataUri: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return nfts.map(
      (nft) =>
        new NftResponseDto({
          ...nft,
          name: nft.name || undefined,
          description: nft.description || undefined,
          image: nft.imageUrl || undefined,
          metadataUri: nft.metadataUri || undefined,
        }),
    );
  }

  /**
   * Get all NFTs
   * @returns Array of all NFTs
   */
  async findAll(): Promise<NftResponseDto[]> {
    const nfts = await this.prisma.nft.findMany({
      select: {
        contractAddress: true,
        tokenId: true,
        ownerAddress: true,
        name: true,
        description: true,
        imageUrl: true,
        metadataUri: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return nfts.map(
      (nft) =>
        new NftResponseDto({
          ...nft,
          name: nft.name || undefined,
          description: nft.description || undefined,
          image: nft.imageUrl || undefined,
          metadataUri: nft.metadataUri || undefined,
        }),
    );
  }

  /**
   * Get NFT by contract address and token ID
   * @param contractAddress - Contract address
   * @param tokenId - Token ID
   * @returns NFT details
   */
  async findOne(contractAddress: string, tokenId: string): Promise<NftResponseDto> {
    const nft = await this.prisma.nft.findUnique({
      where: {
        contractAddress_tokenId: {
          contractAddress: contractAddress.toLowerCase(),
          tokenId: tokenId,
        },
      },
      select: {
        contractAddress: true,
        tokenId: true,
        ownerAddress: true,
        name: true,
        description: true,
        imageUrl: true,
        metadataUri: true,
        createdAt: true,
      },
    });

    if (!nft) {
      throw new NotFoundException(
        `NFT with address ${contractAddress} and tokenId ${tokenId} not found`,
      );
    }

    return new NftResponseDto({
      ...nft,
      name: nft.name || undefined,
      description: nft.description || undefined,
      image: nft.imageUrl || undefined,
      metadataUri: nft.metadataUri || undefined,
    });
  }

  /**
   * Get collection preview with 3 NFT images and total count
   * @param collectionAddress - Contract address of the collection
   * @returns Collection preview with images and count
   */
  async getCollectionPreview(
    collectionAddress: string,
  ): Promise<CollectionPreviewResponseDto> {
    const normalizedAddress = collectionAddress.toLowerCase();

    // Get total count
    const totalCount = await this.prisma.nft.count({
      where: {
        contractAddress: normalizedAddress,
      },
    });

    // Get up to 3 NFTs with images for preview
    const nfts = await this.prisma.nft.findMany({
      where: {
        contractAddress: normalizedAddress,
        imageUrl: {
          not: null,
        },
      },
      select: {
        imageUrl: true,
      },
      take: 3,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const previewImages = nfts
      .map((nft) => nft.imageUrl)
      .filter((url): url is string => url !== null);

    return new CollectionPreviewResponseDto({
      collectionAddress: normalizedAddress,
      totalCount,
      previewImages,
    });
  }
}
