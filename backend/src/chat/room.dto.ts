import { IsNotEmpty } from 'class-validator';
import { Channel } from './Entities/channel.entity';
import { MessageDto } from './messageDto';

export class RoomDto {
    @IsNotEmpty()
    'channel': Channel;

    'lastMessage': MessageDto;

    'numberUnreadMessage': number;
}