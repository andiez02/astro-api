import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { ethers } from 'ethers'
import { CollectionFactoryABI } from './abi/CollectionFactory'
import { ERC721ABI } from './abi/ERC721'
import { ERC1155ABI } from './abi/ERC1155'

@Injectable()
export class IndexerService implements OnModuleInit {
  private readonly logger = new Logger(IndexerService.name)
  private provider: ethers.JsonRpcProvider

  private lastProcessedBlock = 0

  private factoryInterface = new ethers.Interface(CollectionFactoryABI)
  private erc721Interface = new ethers.Interface(ERC721ABI)
  private erc1155Interface = new ethers.Interface(ERC1155ABI)

  private readonly collectionCreatedTopic = (() => {
    const event = this.factoryInterface.getEvent('CollectionCreated')
    if (!event) throw new Error('CollectionCreated event not found in ABI')
    return event.topicHash
  })()

  private readonly erc721TransferTopic = (() => {
    const event = this.erc721Interface.getEvent('Transfer')
    if (!event) throw new Error('Transfer event not found in ERC721 ABI')
    return event.topicHash
  })()

  private readonly erc1155TransferSingleTopic = (() => {
    const event = this.erc1155Interface.getEvent('TransferSingle')
    if (!event) throw new Error('TransferSingle event not found in ERC1155 ABI')
    return event.topicHash
  })()

  constructor(private readonly prisma: PrismaService) {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
  }

  async onModuleInit() {
    this.logger.log('Indexer starting...')
    this.startBlockPolling()
  }

  // ===============================
  // BLOCK POLLING (CORE)
  // ===============================
  private startBlockPolling() {
    this.provider.on('block', async (blockNumber) => {
      try {
        if (this.lastProcessedBlock === 0) {
          this.lastProcessedBlock = blockNumber - 1
          return
        }

        await this.indexCollectionCreated(
          this.lastProcessedBlock + 1,
          blockNumber
        )

        await this.indexERC721Transfers(
          this.lastProcessedBlock + 1,
          blockNumber
        )

        await this.indexERC1155Transfers(
          this.lastProcessedBlock + 1,
          blockNumber
        )

        this.lastProcessedBlock = blockNumber
      } catch (err) {
        this.logger.error(
          `Indexer error at block ${blockNumber}`,
          err
        )
      }
    })
  }

  // ===============================
  // COLLECTION CREATED
  // ===============================
  private async indexCollectionCreated(fromBlock: number, toBlock: number) {
    const factoryAddress = process.env.COLLECTION_FACTORY_ADDRESS!
    const logs = await this.provider.getLogs({
      address: factoryAddress,
      fromBlock,
      toBlock,
      topics: [this.collectionCreatedTopic],
    })

    for (const log of logs) {
      const parsed = this.factoryInterface.parseLog(log)
      if (!parsed) continue

      const creator = parsed.args.creator.toLowerCase()
      const collection = parsed.args.collection.toLowerCase()
      const type = parsed.args.collectionType

      this.logger.log(`New Collection: ${collection} (${type})`)

      let name = 'Unknown Collection'
      let symbol = 'UNK'

      try {
        const contract = new ethers.Contract(
          collection,
          ['function name() view returns (string)', 'function symbol() view returns (string)'],
          this.provider,
        )
        name = await contract.name()
        symbol = await contract.symbol()
      } catch (e) {
        this.logger.warn(`Failed to fetch metadata for ${collection}: ${e.message}`)
      }

      await this.prisma.collection.upsert({
        where: { contractAddress: collection },
        update: {},
        create: {
          contractAddress: collection,
          chainId: 31337,
          standard: type,
          creatorAddress: creator,
          royaltyFee: 0,
          name,
          symbol,
        },
      })
    }
  }

  // ===============================
  // ERC721 TRANSFERS
  // ===============================
  private async indexERC721Transfers(fromBlock: number, toBlock: number) {
    const collections = await this.prisma.collection.findMany({
      where: { standard: 'ERC721' },
    })

    for (const col of collections) {
      const logs = await this.provider.getLogs({
        address: col.contractAddress,
        fromBlock,
        toBlock,
        topics: [this.erc721TransferTopic],
      })

      for (const log of logs) {
        const parsed = this.erc721Interface.parseLog(log)
        if (!parsed) continue

        const from = parsed.args.from.toLowerCase()
        const to = parsed.args.to.toLowerCase()
        const tokenId = parsed.args.tokenId.toString()

        if (from === ethers.ZeroAddress) {
          await this.prisma.nft.upsert({
            where: {
              contractAddress_tokenId: {
                contractAddress: col.contractAddress,
                tokenId,
              },
            },
            update: {
              ownerAddress: to,
            },
            create: {
              contractAddress: col.contractAddress,
              tokenId,
              chainId: 31337,
              ownerAddress: to,
              creatorAddress: to,
              metadataUri: '',
              collection: {
                connect: { contractAddress: col.contractAddress },
              },
            },
          })
        } else {
          await this.prisma.nft.update({
            where: {
              contractAddress_tokenId: {
                contractAddress: col.contractAddress,
                tokenId,
              },
            },
            data: {
              ownerAddress: to,
            },
          })
        }
      }
    }
  }

  // ===============================
  // ERC1155 TRANSFERS
  // ===============================
  private async indexERC1155Transfers(fromBlock: number, toBlock: number) {
    const collections = await this.prisma.collection.findMany({
      where: { standard: 'ERC1155' },
    })

    for (const col of collections) {
      const logs = await this.provider.getLogs({
        address: col.contractAddress,
        fromBlock,
        toBlock,
        topics: [this.erc1155TransferSingleTopic],
      })

      for (const log of logs) {
        const parsed = this.erc1155Interface.parseLog(log)
        if (!parsed) continue

        const from = parsed.args.from.toLowerCase()
        const to = parsed.args.to.toLowerCase()
        const tokenId = parsed.args.id.toString()
        const amount = Number(parsed.args.value)

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
            creatorAddress:
              from === ethers.ZeroAddress ? to : from,
            totalSupply: 0,
            metadataUri: '',
            collection: {
              connect: { contractAddress: col.contractAddress },
            },
          },
        })

        if (from !== ethers.ZeroAddress) {
          await this.prisma.editionBalance.updateMany({
            where: {
              editionId: edition.id,
              owner: from,
            },
            data: {
              balance: { decrement: amount },
            },
          })
        }

        await this.prisma.editionBalance.upsert({
          where: {
            editionId_owner: {
              editionId: edition.id,
              owner: to,
            },
          },
          update: {
            balance: { increment: amount },
          },
          create: {
            editionId: edition.id,
            owner: to,
            balance: amount,
          },
        })
      }
    }
  }
}
