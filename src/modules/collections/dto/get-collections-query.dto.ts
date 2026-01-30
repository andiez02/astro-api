import { IsOptional, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for GET /collections query parameters
 */
export class GetCollectionsQueryDto {
  @IsOptional()
  @IsString({ message: 'creatorAddress must be a string' })
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'creatorAddress must be a valid Ethereum address (0x followed by 40 hex characters)',
  })
  @Transform(({ value }) => value?.toLowerCase())
  creatorAddress?: string;
}
