import { IsNotEmpty } from 'class-validator';
import { UserType } from 'src/user/user.type';

export class MessageDto {
    @IsNotEmpty()
    'message': string;

    @IsNotEmpty()
    timestamp: Date;

    @IsNotEmpty()
    destination: string;

    @IsNotEmpty()
    author: UserType;
}