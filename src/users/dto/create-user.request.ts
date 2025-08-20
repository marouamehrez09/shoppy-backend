import { IsEmail, IsStrongPassword } from 'class-validator';

export class CreateUserRequest {
  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;
}

export class UserResponseDto {
  id: number;
  email: string;
}
