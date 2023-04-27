import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'friends'})
export class FriendsEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    followerId: number;

    @Column()
    followingId: number;
}