import { Controller, Get, Post, Patch, Param, Delete, Body, UseGuards } from '@nestjs/common';
import { DUser } from 'src/user/Decorator/user.decorator';
import { ChatService } from './chat.service';
import { AuthGuard } from "../user/guards/auth.guards"
import { Message } from './Entities/message.entity';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('/messages/:roomName')
    @UseGuards(AuthGuard)
    async getMessagesByRoomName(@DUser('id') currentUserId: number, @Param("roomName") roomName: string): Promise<Message[]> {
        return await this.chatService.getMessagesByRoomName(currentUserId, roomName);
    }

    @Get('/rooms')
    @UseGuards(AuthGuard)
    async getRooms(@DUser('id') currentUserId: number) {
        return await this.chatService.getRoomsToMenu(currentUserId);
    }

    @Post('/roomCreation')
    @UseGuards(AuthGuard)
    async roomCreation(@Body() dataChannel: any, @DUser("id") currentUserId: number) {
        const ret = await this.chatService.createChannel(currentUserId, dataChannel, dataChannel.members);
        return { channel: ret };
    }

    @Get('/readMsg/:roomName')
    @UseGuards(AuthGuard)
    async getMessageUnread(@Param("roomName") roomName: string, @DUser("id") currentUserId: number) {
        return await this.chatService.countMessageUnread(currentUserId, roomName);
    }

    @Get('/getRoomInvitations')
    @UseGuards(AuthGuard)
    async getRoomInvitations(@DUser("id") currentUserId: number) {
        return await this.chatService.getInvitationsByUserId(currentUserId);
    }

    @Get('/getOwnerByRoomName/:roomName')
    @UseGuards(AuthGuard)
    async getOwnerByRoomName(@DUser("id") currentUserId: number, @Param("roomName") roomName: string) {
        return await this.chatService.getOwnerByRoomName(currentUserId, roomName);
    }

    @Get('/getMembers/:roomName')
    @UseGuards(AuthGuard)
    async getMembersByRoomName(@DUser("id") currentUserId: number, @Param("roomName") roomName: string) {
        return await this.chatService.getMembersByRoomName(currentUserId, roomName);
    }

    @Get('/getRoomNonMembers/:roomName')
    @UseGuards(AuthGuard)
    async getRoomNonMembers(@DUser("id") currentUserId: number, @Param("roomName") roomName: string) {
        return await this.chatService.getRoomNonMembers(currentUserId, roomName);
    }

    @Patch('/setRoomOwner/:roomName/:newOwnerName')
    @UseGuards(AuthGuard)
    async setRoomOwner(@DUser("id") currentUserId: number, @Param("roomName") roomName: string, @Param("newOwnerName") newOwnerName: string) {
        return await this.chatService.setRoomOwner(currentUserId, roomName, newOwnerName);
    }

    @Patch('/quitRoomMember/:roomName/:username')
    @UseGuards(AuthGuard)
    async deleteRoomMember(@DUser("id") currentUserId: number, @Param("roomName") roomName: string, @Param("username") username: string) {
        return await this.chatService.QuitRoom(currentUserId, username, roomName);
    }

    @Get('countRoomMember/:roomName')
    @UseGuards(AuthGuard)
    async countRoomMember(@DUser("id") currentUserId: number, @Param("roomName") roomName: string) {
        return await this.chatService.countRoomMember(currentUserId, roomName);
    }

    @Delete('/deleteRoom/:roomName')
    @UseGuards(AuthGuard)
    async deleteRoom(@DUser("id") currentUserId: number, @Param("roomName") roomName: string) {
        return await this.chatService.deleteRoom(currentUserId, roomName);
    }

    @Patch('/addRoomAdmin/:roomName/:username')
    @UseGuards(AuthGuard)
    async addRoomAdmin(@DUser("id") currentUserId: number, @Param("roomName") roomName: string, @Param("username") username: string) {
        return await this.chatService.addRoomAdmin(currentUserId, roomName, username);
    }

    @Get('/getRoomAdmins/:roomName')
    @UseGuards(AuthGuard)
    async getRoomAdmins(@DUser("id") currentUserId: number, @Param("roomName") roomName: string) {
        return await this.chatService.getRoomAdmins(currentUserId, roomName);
    }

    @Delete('/deletePassword/:roomName')
    @UseGuards(AuthGuard)
    async deletePassword(@DUser("id") currentUserId: number, @Param("roomName") roomName: string) {
        return await this.chatService.deletePassword(currentUserId, roomName);
    }

    @Patch('/changePassword/:roomName/:password')
    @UseGuards(AuthGuard)
    async changePassword(@DUser("id") currentUserId: number, @Param("roomName") roomName: string, @Param("password") password: string) {
        return await this.chatService.changePassword(currentUserId, roomName, password);
    }

    @Patch('/banUser/:roomName/:username')
    @UseGuards(AuthGuard)
    async banUser(@DUser("id") currentUserId: number, @Param("roomName") roomName: string, @Param("username") username: string) {
        return await this.chatService.banUser(currentUserId, roomName, username);
    }

    @Get('/getUsersBanned/:roomName')
    @UseGuards(AuthGuard)
    async getUsersBanned(@DUser("id") currentUserId: number, @Param("roomName") roomName: string) {
        return await this.chatService.getUsersBanned(currentUserId, roomName);
    }

    @Patch('/unBanRoomUser/:roomName/:username')
    @UseGuards(AuthGuard)
    async unBanRoomUser(@DUser("id") currentUserId: number, @Param("roomName") roomName: string, @Param("username") username: string) {
        return await this.chatService.unBanRoomUser(currentUserId, roomName, username);
    }

    @Patch('/invitationDeclined/:roomName')
    @UseGuards(AuthGuard)
    async invitationDeclined(@Param("roomName") roomName: string, @DUser("id") currentUserId: number) {
        return await this.chatService.setDeniedInvitation(currentUserId, roomName);
    }

    @Patch('/invitationAccepted/:roomName')
    @UseGuards(AuthGuard)
    async invitationAccepted(@Param("roomName") roomName: string, @DUser("id") currentUserId: number) {
        return await this.chatService.setAcceptedInvitation(currentUserId, roomName);
    }

    @Patch('/addNewMembers/:roomName')
    @UseGuards(AuthGuard)
    async addNewMembers(@DUser("id") currentUserId: number, @Param("roomName") roomName: string, @Body() newMembers: any) {
        return await this.chatService.addNewMembers(currentUserId, roomName, newMembers);
    }

    @Get('/privmsgMenu')
    @UseGuards(AuthGuard)
    async getPrivMsg(@DUser('id') currentUserId: number) {
        return await this.chatService.getPrivMsgMenu(currentUserId);
    }

    @Post('/privmsg')
    @UseGuards(AuthGuard)
    async createPrivateMsg(@DUser('id') currentUserId: number, @Body() data: any) {
        return await this.chatService.createPrivateMsg(currentUserId, data);
    }

    @Get('/checkRoomPassword/:roomName/:password')
    @UseGuards(AuthGuard)
    async checkRoomPassword(@DUser('id') currentUserId: number, @Param("roomName") roomName: string, @Param("password") password: string) {
        return await this.chatService.checkRoomPassword(currentUserId, roomName, password);
    }

    @Get('/LastConnexion/:roomName')
    @UseGuards(AuthGuard)
    async getLastConnexion(@DUser('id') currentUserId: number, @Param("roomName") roomName: string) {
        return await this.chatService.getLastConnexion(currentUserId, roomName);
    }

    @Get('/getNbOfUnreadMsg/:roomName')
    @UseGuards(AuthGuard)
    async getNbOfUnreadMsg(@DUser('id') currentUserId: number, @Param("roomName") roomName: string) {
        return await this.chatService.countMessageUnread(currentUserId, roomName);
    }

    @Get('/getProbablyPrivMsg')
    @UseGuards(AuthGuard)
    async getUsersWithoutPrivMsg(@DUser('id') currentUserId: number) {
        return await this.chatService.getUsersWithoutPrivMsg(currentUserId);
    }

    @Post('/roomDeconnexions')
    @UseGuards(AuthGuard)
    async roomDeconnexions(@DUser('id') currentUserId: number) {
        return await this.chatService.leaveRooms(currentUserId);
    }

    @Post('/unmuteUser')
    @UseGuards(AuthGuard)
    async unmuteUser(@Body() data: any) {
        return await this.chatService.unmuteUser(data.roomId, data.userId);
    }

    @Post('/memberJoined')
    @UseGuards(AuthGuard)
    async memberJoined(@Body() data: any, @DUser('id') currentUserId: number) {
        return await this.chatService.addMemberJoined(currentUserId, data.roomName);
    }

}
