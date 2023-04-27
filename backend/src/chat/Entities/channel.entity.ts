import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinTable, ManyToMany, JoinColumn, Index } from "typeorm";
import { UserEntity } from "src/user/Entities/user.entity";
import { UserType } from "src/user/user.type";

@Entity()
export class Channel {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	roomName: string;

	@Column()
	type: string;

	@Column({ nullable: true })
	status: string;

	@Column({ nullable: true })
	password: string;

	@Column({ default: "#8380e1" })
	color: string;

	@ManyToOne(() => UserEntity, (user) => user.channels, { eager: true })
	owner: UserType;

	@ManyToMany(() => UserEntity)
	@JoinTable()
	members: UserType[];

	@ManyToMany(() => UserEntity)
	@JoinTable()
	usersInvited: UserType[];

	@ManyToMany(() => UserEntity)
	@JoinTable()
	admins: UserType[];

	@ManyToMany(() => UserEntity)
	@JoinTable()
	banned: UserType[];

	@ManyToMany(() => UserEntity)
	@JoinTable()
	membersJoined: UserType[];
}