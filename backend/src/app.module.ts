import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { GameController } from './game/game.controller';
import { GameService } from './game/game.service'
import { GameGateway } from './game/game.gateway';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { GameModule } from './game/game.module';
import { UserEntity } from './user/Entities/user.entity';
import { MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AuthMiddleware } from './user/Middleware/auth.middleware';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { Message } from './chat/Entities/message.entity';
import { ChatGateway } from './chat/socketEvents';
import { Channel } from './chat/Entities/channel.entity';
import { ConnectionTime } from './chat/Entities/connexionTime.entity';
import { Game } from './game/Entities/game.entity'
import { ProfileController } from './profile/profile.controller';
import { ProfileService } from './profile/profile.service';
import { ProfileModule } from './profile/profile.module';
import { FriendsEntity } from './profile/friends.entity';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { JwtService } from "@nestjs/jwt";
import { Mute } from './chat/Entities/mute.entity';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),
  TypeOrmModule.forRootAsync
    ({
      useFactory: async (configService: ConfigService) => (
        {
          type: 'postgres',
          url: process.env.DATABASE_URL,
          synchronize: true,
          entities: [UserEntity, Message, Channel, Game, ConnectionTime, FriendsEntity, Mute],
        }),
      inject: [ConfigService]
    }),
    UserModule,
    GameModule,
    ProfileModule,
  TypeOrmModule.forFeature([Message, Channel, UserEntity, Game, ConnectionTime, FriendsEntity, Mute]),
  ],
  controllers: [AppController, ChatController, GameController, ProfileController, UserController],
  providers: [AppService, ChatService, ChatGateway, GameGateway, GameService, ProfileService, UserService, JwtService],
})

export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL })
  }
}



