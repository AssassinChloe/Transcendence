import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "src/user/Entities/user.entity";
import { FriendsEntity } from "./friends.entity";
import { ProfileController } from "./profile.controller";
import { ProfileService } from "./profile.service";

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity, FriendsEntity])],
    controllers: [ProfileController],
    providers: [ProfileService]
})

export class ProfileModule {}