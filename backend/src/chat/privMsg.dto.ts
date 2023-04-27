import { IsNotEmpty } from 'class-validator';
import { UserType } from 'src/user/user.type';
import { Channel } from './Entities/channel.entity';
import { MessageDto } from './messageDto';

export class PrivMsgDto {
    @IsNotEmpty()
    'channel': Channel;

    'lastMessage': MessageDto;

    'numberUnreadMessage': number;

    'receiver': UserType;
}