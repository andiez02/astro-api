/**
 * DTO for collection preview response
 * Contains 3 NFT images and total count for preview purposes
 */
export class CollectionPreviewResponseDto {
  /** Collection contract address */
  collectionAddress: string;

  /** Total number of NFTs in the collection */
  totalCount: number;

  /** Array of image URLs (up to 3) for preview */
  previewImages: string[];

  constructor(partial: Partial<CollectionPreviewResponseDto>) {
    Object.assign(this, partial);
  }
}
