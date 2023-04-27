
import { IsNotEmpty } from 'class-validator';
import { UserEntity } from './user.entity';

export class createUserDto {
    @IsNotEmpty()
    'username': string;

    @IsNotEmpty()
    'email': string;

    @IsNotEmpty()
    'password': string;

    'avatar': string;

    'Enable2FA': boolean;

    'jwt': string;
}