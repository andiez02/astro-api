/**
 * DTO for Collection response
 */
export class CollectionResponseDto {
  contractAddress: string;
  standard: string;
  createdAt: Date;
  name?: string;
  symbol?: string;

  constructor(partial: Partial<CollectionResponseDto>) {
    Object.assign(this, partial);
  }
}
