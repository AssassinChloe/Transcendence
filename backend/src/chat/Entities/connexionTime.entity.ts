import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class ConnectionTime {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    connectionTime: Date;

    @Column({ default: false })
    connected: boolean;

    @Column()
    userId: number;

    @Column()
    roomId: number;

}