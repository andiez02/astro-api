import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ethers } from 'ethers';
import { CollectionFactoryABI } from './abi/CollectionFactory';
import { ERC721ABI } from './abi/ERC721';
import { ERC1155ABI } from './abi/ERC1155';

@Injectable()
export class IndexerService implements OnModuleInit {
  private readonly logger = new Logger(IndexerService.name);
  private provider: ethers.JsonRpcProvider;
  private lastProcessedBlock = 0;

  private factoryInterface = new ethers.Interface(CollectionFactoryABI);
  private erc721Interface = new ethers.Interface(ERC721ABI);
  private erc1155Interface = new ethers.Interface(ERC1155ABI);

  constructor(private readonly prisma: PrismaService) {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  }

  async onModuleInit() {
    this.logger.log('Indexer started');
    this.provider.on('block', (b) => this.handleBlock(b));
  }

  // ===============================
  // BLOCK LOOP
  // ===============================
  private async handleBlock(blockNumber: number) {
    try {
      if (this.lastProcessedBlock === 0) {
        this.lastProcessedBlock = blockNumber - 1;
        return;
      }

      const from = this.lastProcessedBlock + 1;
      const to = blockNumber;

      await this.indexCollectionCreated(from, to);
      await this.indexERC721Transfers(from, to);
      await this.indexERC1155Transfers(from, to);

      this.lastProcessedBlock = blockNumber;
    } catch (e) {
      this.logger.error(`Indexer error at block ${blockNumber}`, e);
    }
  }

  // ===============================
  // HELPERS
  // ===============================
  private readonly IPFS_GATEWAYS = [
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
    'https://ipfs.io/ipfs/',
  ];

  private ipfsToHttp(uri: string, gateway: string = this.IPFS_GATEWAYS[0]) {
    if (uri.startsWith('ipfs://')) {
      return uri.replace('ipfs://', gateway);
    }
    return uri;
  }

  private async fetchMetadata(uri: string): Promise<Record<string, unknown> | null> {
    for (const gateway of this.IPFS_GATEWAYS) {
      try {
        const url = this.ipfsToHttp(uri, gateway);
        this.logger.debug(`Fetching metadata from: ${url}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) {
          this.logger.warn(`Gateway ${gateway} returned status ${res.status}`);
          continue;
        }

        const json = await res.json();
        this.logger.debug(`Successfully fetched metadata: ${JSON.stringify(json)}`);
        return json;
      } catch (err) {
        this.logger.warn(`Failed to fetch from gateway ${gateway}: ${err}`);
        continue;
      }
    }

    this.logger.error(`Failed to fetch metadata from all gateways for URI: ${uri}`);
    return null;
  }

  // ===============================
  // COLLECTION CREATED
  // ===============================
  private async indexCollectionCreated(from: number, to: number) {
    const factoryAddress = process.env.COLLECTION_FACTORY_ADDRESS!;

    const logs = await this.provider.getLogs({
      address: factoryAddress,
      fromBlock: from,
      toBlock: to,
      topics: [this.factoryInterface.getEvent('CollectionCreated')!.topicHash],
    });

    for (const log of logs) {
      const parsed = this.factoryInterface.parseLog(log);
      if (!parsed) continue;

      const creator = parsed.args.creator.toLowerCase();
      const address = parsed.args.collection.toLowerCase();
      const standard = parsed.args.collectionType;

      let name = 'Unknown';
      let symbol = 'UNK';

      try {
        const contract = new ethers.Contract(
          address,
          ['function name() view returns (string)', 'function symbol() view returns (string)'],
          this.provider,
        );
        name = await contract.name();
        symbol = await contract.symbol();
      } catch {}

      await this.prisma.collection.upsert({
        where: { contractAddress: address },
        update: {},
        create: {
          contractAddress: address,
          creatorAddress: creator,
          standard,
          chainId: 31337,
          royaltyFee: 0,
          name,
          symbol,
        },
      });
    }
  }

  // ===============================
  // ERC721
  // ===============================
  private async indexERC721Transfers(from: number, to: number) {
    const collections = await this.prisma.collection.findMany({
      where: { standard: 'ERC721' },
    });

    for (const col of collections) {
      const logs = await this.provider.getLogs({
        address: col.contractAddress,
        fromBlock: from,
        toBlock: to,
        topics: [this.erc721Interface.getEvent('Transfer')!.topicHash],
      });

      const contract = new ethers.Contract(
        col.contractAddress,
        ['function tokenURI(uint256) view returns (string)'],
        this.provider,
      );

      for (const log of logs) {
        const parsed = this.erc721Interface.parseLog(log);
        if (!parsed) continue;

        const fromAddr = parsed.args.from.toLowerCase();
        const toAddr = parsed.args.to.toLowerCase();
        const tokenId = parsed.args.tokenId.toString();

        // MINT
        if (fromAddr === ethers.ZeroAddress) {
          let metadataUri = '';
          let name = null;
          let description = null;
          let imageUrl = null;

          try {
            metadataUri = await contract.tokenURI(tokenId);
            this.logger.debug(`Token ${tokenId} metadataUri: ${metadataUri}`);
            const meta = await this.fetchMetadata(metadataUri);
            if (meta) {
              name = typeof meta.name === 'string' ? meta.name : null;
              description = typeof meta.description === 'string' ? meta.description : null;
              imageUrl = typeof meta.image === 'string' ? meta.image : null;
              this.logger.debug(
                `Token ${tokenId} metadata parsed - name: ${name}, image: ${imageUrl}`,
              );
            }
          } catch (err) {
            this.logger.error(`Failed to fetch metadata for token ${tokenId}: ${err}`);
          }

          await this.prisma.nft.upsert({
            where: {
              contractAddress_tokenId: {
                contractAddress: col.contractAddress,
                tokenId,
              },
            },
            update: { ownerAddress: toAddr },
            create: {
              contractAddress: col.contractAddress,
              tokenId,
              chainId: 31337,
              ownerAddress: toAddr,
              creatorAddress: toAddr,
              metadataUri,
              name,
              description,
              imageUrl,
              collection: {
                connect: { contractAddress: col.contractAddress },
              },
            },
          });
        }

        // TRANSFER
        else {
          await this.prisma.nft.update({
            where: {
              contractAddress_tokenId: {
                contractAddress: col.contractAddress,
                tokenId,
              },
            },
            data: { ownerAddress: toAddr },
          });
        }
      }
    }
  }

  // ===============================
  // ERC1155
  // ===============================
  private async indexERC1155Transfers(from: number, to: number) {
    const collections = await this.prisma.collection.findMany({
      where: { standard: 'ERC1155' },
    });

    for (const col of collections) {
      const logs = await this.provider.getLogs({
        address: col.contractAddress,
        fromBlock: from,
        toBlock: to,
        topics: [this.erc1155Interface.getEvent('TransferSingle')!.topicHash],
      });

      const contract = new ethers.Contract(
        col.contractAddress,
        ['function uri(uint256) view returns (string)'],
        this.provider,
      );

      for (const log of logs) {
        const parsed = this.erc1155Interface.parseLog(log);
        if (!parsed) continue;

        const fromAddr = parsed.args.from.toLowerCase();
        const toAddr = parsed.args.to.toLowerCase();
        const tokenId = parsed.args.id.toString();
        const amount = Number(parsed.args.value);

        let metadataUri = '';
        try {
          metadataUri = await contract.uri(tokenId);
        } catch {}

        const edition = await this.prisma.edition.upsert({
          where: {
            contractAddress_tokenId: {
              contractAddress: col.contractAddress,
              tokenId,
            },
          },
          update: {},
          create: {
            contractAddress: col.contractAddress,
            tokenId,
            chainId: 31337,
            creatorAddress: fromAddr === ethers.ZeroAddress ? toAddr : fromAddr,
            totalSupply: 0,
            metadataUri,
            collection: {
              connect: { contractAddress: col.contractAddress },
            },
          },
        });

        if (fromAddr !== ethers.ZeroAddress) {
          await this.prisma.editionBalance.updateMany({
            where: { editionId: edition.id, owner: fromAddr },
            data: { balance: { decrement: amount } },
          });
        }

        await this.prisma.editionBalance.upsert({
          where: {
            editionId_owner: {
              editionId: edition.id,
              owner: toAddr,
            },
          },
          update: { balance: { increment: amount } },
          create: {
            editionId: edition.id,
            owner: toAddr,
            balance: amount,
          },
        });
      }
    }
  }
}
