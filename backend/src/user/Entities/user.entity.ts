import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, OneToMany, ManyToMany, JoinTable, JoinColumn } from "typeorm";
import { hash } from "bcrypt"
import { Channel } from "src/chat/Entities/channel.entity";
import { Message } from "src/chat/Entities/message.entity";
import { MessageDto } from "src/chat/messageDto";
import { IsNumber } from 'class-validator';
import { UserDto } from "../Dto/User.dto";
import { Game } from "../../game/Entities/game.entity"
import { UserType } from "../user.type";

@Entity()
export class UserEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ nullable: true })
	loginname: string; 

	@Column()
	username: string; 

	@Column() 
	password: string;

	@Column({ nullable: false })
	email: string;

	@Column({ nullable: true })
	bio: string;

	@Column({ default: "avatar10.jpg" })
	avatar: string;

	@Column({ default: false })
	Enable2FA: boolean;

	@Column({ default: false })
	Valid2FA: boolean;
	
	@Column({default:false})
	isFortyTwo: boolean;

	@BeforeInsert()
	async hashPassword() {
		this.password = await hash(this.password, 10) 
	}

	@OneToMany(() => Channel, (channel) => channel.owner)
	channels: Channel[];

	@OneToMany(() => Message, (message) => message.author)
	messages: Message[];

	@Column({ default: 0 })
	@IsNumber()
	NbGamesPlayed: number;

	@Column({ default: 0 })
	@IsNumber()
	NbGamesWon: number;

	@Column({ default: 0 })
	@IsNumber()
	NbGamesLost: number;

	@Column({ default: 0 })
	@IsNumber()
	Score: number;

	@Column({ default: false })
	Connected: boolean;

	@Column({ default: false })
	InGame: boolean;

	@Column({ default: 0 })
	@IsNumber()
	game_id: number;

	@Column('jsonb', { nullable: true })
	usersBlocked: UserType[];

	@Column({ nullable: true })
	secret2FA: string;

	@Column({ default: true })
	firstConnect: boolean;

	@OneToMany(() => Game, (game) => game.player1)
	game1: Game[];

	@OneToMany(() => Game, (game) => game.player2)
	game2: Game[];

	@Column({ nullable: true })
	jwt: string;

}
