import { Exclude } from 'class-transformer';
import { User } from '@prisma/client';

export class UserResponseDto {
  id: string;
  walletAddress: string;
  
  @Exclude()
  nonce: string | null;

  username: string | null;
  bio: string | null;
  avatar: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}

