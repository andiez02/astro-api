import { IsOptional, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for GET /nfts query parameters
 */
export class GetNftsQueryDto {
  @IsOptional()
  @IsString({ message: 'collectionAddress must be a string' })
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message:
      'collectionAddress must be a valid Ethereum address (0x followed by 40 hex characters)',
  })
  @Transform(({ value }) => value?.toLowerCase())
  collectionAddress?: string;

  @IsOptional()
  @IsString({ message: 'ownerAddress must be a string' })
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'ownerAddress must be a valid Ethereum address (0x followed by 40 hex characters)',
  })
  @Transform(({ value }) => value?.toLowerCase())
  ownerAddress?: string;
}
