import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CollectionResponseDto } from './dto/collection-response.dto';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get collections by creator address
   * @param creatorAddress - Ethereum wallet address of the creator
   * @returns Array of collections
   */
  async findByCreator(creatorAddress: string): Promise<CollectionResponseDto[]> {
    const normalizedAddress = creatorAddress.toLowerCase();

    const collections = await this.prisma.collection.findMany({
      where: {
        creatorAddress: normalizedAddress,
      },
      select: {
        contractAddress: true,
        standard: true,
        createdAt: true,
        name: true,
        symbol: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return collections.map(
      (collection) =>
        new CollectionResponseDto({
          ...collection,
          name: collection.name || undefined,
          symbol: collection.symbol || undefined,
        }),
    );
  }

  /**
   * Get all collections
   * @returns Array of all collections
   */
  async findAll(): Promise<CollectionResponseDto[]> {
    const collections = await this.prisma.collection.findMany({
      select: {
        contractAddress: true,
        standard: true,
        createdAt: true,
        name: true,
        symbol: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return collections.map(
      (collection) =>
        new CollectionResponseDto({
          ...collection,
          name: collection.name || undefined,
          symbol: collection.symbol || undefined,
        }),
    );
  }

  /**
   * Get collection by address
   * @param address - Contract address
   * @returns Collection details
   */
  async findByAddress(address: string): Promise<CollectionResponseDto> {
    const collection = await this.prisma.collection.findUnique({
      where: {
        contractAddress: address.toLowerCase(),
      },
      select: {
        contractAddress: true,
        standard: true,
        createdAt: true,
        name: true,
        symbol: true,
      },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with address ${address} not found`);
    }

    return new CollectionResponseDto({
      ...collection,
      name: collection.name || undefined,
      symbol: collection.symbol || undefined,
    });
  }
}
