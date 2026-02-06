/**
 * DTO for NFT response
 */
export class NftResponseDto {
  contractAddress: string;
  tokenId: string;
  ownerAddress: string;
  name?: string;
  description?: string;
  image?: string;
  metadataUri?: string;
  createdAt: Date;

  constructor(partial: Partial<NftResponseDto>) {
    Object.assign(this, partial);
  }
}
