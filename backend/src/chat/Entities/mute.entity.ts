import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Mute {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column()
    roomId: number;

}