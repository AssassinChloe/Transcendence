import { UserEntity } from "src/user/Entities/user.entity";
import { UserType } from "src/user/user.type";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";

@Entity()
export class Message {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	message: string;

	@Column()
	destination: string;

	@Column()
	timestamp: Date;

	@ManyToOne(() => UserEntity, (user) => user.messages, { eager: true })
	author: UserType;
}
