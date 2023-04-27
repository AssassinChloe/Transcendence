import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Console } from "console";
import { UserEntity } from "src/user/Entities/user.entity";
import { Repository } from "typeorm";
import { FriendsEntity } from "./friends.entity";
import { ProfileType } from "./types/profile.type";
import { ProfileResponseInterface } from "./types/profileResponse.interface";

@Injectable()
export class ProfileService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
        @InjectRepository(FriendsEntity)
        private readonly followRepository: Repository<FriendsEntity>
    ) { }

    async getProfile(currentUserId: number, username: string): Promise<ProfileType> {
        const user = await this.userRepository.findOne({
            where: { username: username }
        })
        if (!user) {
            throw new HttpException('profile does not exist', HttpStatus.NOT_FOUND);
        }

        const follow = await this.followRepository.findOne({
            where: {
                followerId: currentUserId,
                followingId: user.id,
            }
        });

        return { ...user, following: Boolean(follow) }; 
    }

    async followProfile(currentUserId: number, profileUsername: string): Promise<ProfileType> {
        const user = await this.userRepository.findOne({
            where: { username: profileUsername }
        })
        if (!user) {
            throw new HttpException('You can\'t follow ghosts, find some real friends !', HttpStatus.NOT_FOUND);
        }
        if (currentUserId === user.id) {
            throw new HttpException('Enough with selflove. Please find some friends that aren\'t you ', HttpStatus.BAD_REQUEST);
        }
        const follow = await this.followRepository.findOne({
            where: {
                followerId: currentUserId,
                followingId: user.id,
            }
        });

        if (!follow) {
            const followToCreate = new FriendsEntity()
            followToCreate.followerId = currentUserId
            followToCreate.followingId = user.id
            await this.followRepository.save(followToCreate)
        }
        return { ...user, following: true };
    }

    async unfollowProfile(currentUserId: number, profileUsername: string): Promise<ProfileType> {
        const user = await this.userRepository.findOne({
            where: { username: profileUsername }
        })
        if (!user) {
            throw new HttpException('profile does nor exist', HttpStatus.NOT_FOUND);
        }
        if (currentUserId === user.id) {
            throw new HttpException('Follower and Following cant be equal', HttpStatus.BAD_REQUEST);
        }
        const follow = await this.followRepository.findOne({
            where: {
                followerId: currentUserId,
                followingId: user.id,
            }
        });

        if (follow) {
            const followToCreate = new FriendsEntity()
            followToCreate.followerId = currentUserId
            followToCreate.followingId = user.id
            await this.followRepository.delete(followToCreate)
        }
        return { ...user, following: false };
    }


    buildProfileResponse(profile: ProfileType): ProfileResponseInterface {
        delete profile.password; 
        delete profile.Valid2FA;
        delete profile.jwt;
        return { profile };
    }

    async getFriendsList(id: number) {
        const friends = await this.followRepository.find({ where: { followerId: +id } });
        let friends_data = new Array<{}>;
        for (let i = 0; i < friends.length; i++) {
            let user = await this.userRepository.findOne({ where: { id: friends[i].followingId } })
            friends_data.push({ id: user.id, username: user.username, avatar: user.avatar, connected: user.Connected, ingame: user.InGame, Score: user.Score, game_id:user.game_id});
        };
        return (friends_data);
    }

}