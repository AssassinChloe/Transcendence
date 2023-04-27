import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './Entities/user.entity'
import { AuthGuard } from './guards/auth.guards';
import { ChatService } from '../chat/chat.service';
import { Channel } from "../chat/Entities/channel.entity"
import { ChatController } from 'src/chat/chat.controller';
import { Message } from 'src/chat/Entities/message.entity';
import { ConnectionTime } from 'src/chat/Entities/connexionTime.entity';
import { JwtService } from "@nestjs/jwt";
import { FortyTwoAuthGuard } from './42auth.guard';
import { FortyTwoStrategy } from './42.strategy';
import { Mute } from 'src/chat/Entities/mute.entity';

@Module({
	imports: [TypeOrmModule.forFeature([UserEntity, Channel, Message, ConnectionTime, Mute])],
	controllers: [UserController],
	providers: [UserService, AuthGuard, ChatService, JwtService, FortyTwoAuthGuard, FortyTwoStrategy],
	exports: [UserService],
})
export class UserModule { }
