import { IsString, IsOptional, Length, Matches, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(3, 20, { message: 'Username must be between 3 and 20 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username must contain only letters, numbers and underscores' })
  username?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  bio?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Avatar must be a valid URL' })
  avatar?: string;
}