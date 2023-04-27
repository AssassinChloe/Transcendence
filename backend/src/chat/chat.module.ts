import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/Entities/user.entity';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Channel } from './Entities/channel.entity';
import { ConnectionTime } from './Entities/connexionTime.entity';
import { Message } from './Entities/message.entity';
import { Mute } from './Entities/mute.entity';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity, Channel, Message, ConnectionTime, Mute])],
    providers: [ChatService],
    controllers: [ChatController]
})

export class ChatModule { }
