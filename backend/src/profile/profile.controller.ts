import { Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { DUser } from "src/user/Decorator/user.decorator";
import { AuthGuard } from "src/user/guards/auth.guards";
import { ProfileService } from "./profile.service";
import { ProfileResponseInterface } from "./types/profileResponse.interface";

@Controller('profile')
export class ProfileController {
    constructor (private readonly profileService: ProfileService) {}
    
    @Get('/friends')
   @UseGuards(AuthGuard)
    async getFriends(@DUser('id') currentUserId: number){
        const friends = await this.profileService.getFriendsList(currentUserId)
        return (friends);
    }

    @Get('/:username')
    @UseGuards(AuthGuard)
    async getProfile(
        @DUser('id') currentUserId: number, 
        @Param('username') username: string,
    ): Promise<ProfileResponseInterface> {
        const profile = await this.profileService.getProfile(currentUserId, username)
        return this.profileService.buildProfileResponse(profile)
    }

    @Post(':username/follow')
    @UseGuards(AuthGuard)
    async followProfile(@DUser('id') currentUserId: number, @Param('username') profileUsername: string): Promise<ProfileResponseInterface> {
        const profile = await this.profileService.followProfile(currentUserId, profileUsername)
        return this.profileService.buildProfileResponse(profile)
    }

    @Delete(':username/follow')
    @UseGuards(AuthGuard)
    async unfollowProfile(@DUser('id') currentUserId: number, @Param('username') profileUsername: string): Promise<ProfileResponseInterface> {
        const profile = await this.profileService.unfollowProfile(currentUserId, profileUsername)
        return this.profileService.buildProfileResponse(profile)
    }


}