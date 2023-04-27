import{ IsNotEmpty } from 'class-validator';

export class UserChannelDto
{
    @IsNotEmpty()
    'id': number;

    @IsNotEmpty()
    'username': string;

    @IsNotEmpty()
    'connectionTimestamp': Date;
}