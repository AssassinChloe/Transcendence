import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { Game } from './Entities/game.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/Entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Game, UserEntity])],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}
