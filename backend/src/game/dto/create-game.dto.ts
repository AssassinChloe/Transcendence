import { UserEntity } from 'src/user/Entities/user.entity';

export class CreateGameDto
{
    type: string;
    status : string;
    player1 : UserEntity;
    player1_score : number;
    player2 : UserEntity;
    player2_score : number;
}