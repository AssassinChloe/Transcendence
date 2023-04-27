import { SubscribeMessage, WebSocketGateway, OnGatewayInit, WebSocketServer, OnGatewayConnection, } from '@nestjs/websockets';
import { Server, Socket } from "socket.io";
import { Logger, Injectable, Inject, forwardRef, HttpException, HttpStatus } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Message } from './Entities/message.entity';
import { UserEntity } from 'src/user/Entities/user.entity';
import { Channel } from './Entities/channel.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { GameGateway } from 'src/game/game.gateway';
import { UserService } from 'src/user/user.service';
import { UserType } from 'src/user/user.type';
import { ConnectionTime } from './Entities/connexionTime.entity';

@WebSocketGateway(5001,
    {
        cors: { origin: '*', },
    }
)

export class ChatGateway implements OnGatewayInit, OnGatewayConnection {

    constructor(private chatService: ChatService,
        @Inject(forwardRef(() => GameGateway)) private gameGateway: GameGateway,
        @InjectRepository(Channel) private channelRepository: Repository<Channel>,
        @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
        @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
        @InjectRepository(ConnectionTime) private connectionRepository: Repository<ConnectionTime>,

    ) { };
    private users = new Map<number, Socket[]>();
    private logger = new Logger('ChatGateway');
    private bool: boolean = true;
    @WebSocketServer() server: Server;

    afterInit(server: Server) {
    }

    async wait(time: number) {
        await new Promise(f => setTimeout(f, time));
    }

    async handleConnection(client: Socket) {
        let user = this.users.get(client.handshake.auth.token);
        if (user === undefined) {
            let tab = new Array<Socket>();
            tab.push(client);
            this.users.set(client.handshake.auth.token, tab);

            let new_co = await this.userRepository.findOne({ where: { id: +client.handshake.auth.token } });
            if (new_co)
                await this.userRepository.update(new_co.id, { Connected: true, InGame: false });
        }
        else {
            user.push(client);
        }
    }

    @SubscribeMessage('logout')
    async disconnect_user(client) {
        let id = client.handshake.auth.token
        if (id) {
            let new_deco = await this.userRepository.findOne({ where: { id: +id } });
            if (new_deco) {
                if (new_deco.InGame === true) {
                    await this.gameGateway.handle_deconnexion_end(new_deco)
                }
                await this.gameGateway.clean_games_list(new_deco.id);
                await this.userRepository.update(new_deco.id, { Connected: false, InGame: false });
            }
            this.users.delete(id);
        }
    }

    async handleDisconnect(client: Socket) {

        let new_deco = await this.userRepository.findOne({ where: { id: +client.handshake.auth.token } });
        let user = this.users.get(+client.handshake.auth.token);
        if (new_deco && new_deco.InGame === true) {
            await this.gameGateway.handle_deconnexion_end(new_deco);
            if (user !== undefined && user !== null) {
                user.forEach(element => { element.leave(new_deco.game_id.toString()) });
            }
        }
        if (user) {
            let index = user.findIndex((element) => element === client);
            user.splice(index, 1);
            if (user.length === 0)
                await this.wait(10000);
            if (new_deco && user.length === 0) {
                if (new_deco.InGame === true) {
                    await this.gameGateway.handle_deconnexion_end(new_deco)
                }
                await this.gameGateway.clean_games_list(new_deco.id);
                this.users.delete(client.handshake.auth.token);
                await this.userRepository.update(new_deco.id, { Connected: false, InGame: false });
            }
        }
    }

    async getUsers(): Promise<Map<number, Socket[]>> {
        return (this.users);
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(client: Socket, message: Message) {
        if (this.chatService.isMember(client.handshake.auth.token, message.destination)) {
            const usersUnblocked = await this.userService.getUsersUnblocked(client.handshake.auth.token);
            const currentUser = await this.userService.findUserByid(client.handshake.auth.token);
            message.timestamp = new Date();
            const msg = await this.chatService.createMessage(message);//Save the msg on the DB
            const tmp = msg.message;
            if (msg !== null) {
                const room = await this.chatService.getRoombyRoomName(msg.destination);
                client.to(msg.destination).emit("recMessage", msg);
                for (const member of room.members) {
                    if (member.username === currentUser.username) {
                        msg.message = tmp;
                        const userSocket = await this.users.get(member.id);
                        if (userSocket !== undefined)
                            userSocket.forEach(element => this.server.to(element.id).emit("updateLastMsg", msg));
                    }
                    else {
                        if (usersUnblocked.map((e) => e.id).indexOf(member.id) === -1) {
                            msg.message = "*******";
                            const userSocket = await this.users.get(member.id);
                            if (userSocket !== undefined)
                                userSocket.forEach(element => this.server.to(element.id).emit("updateLastMsg", msg));
                        }
                        else {
                            const userSocket = await this.users.get(member.id);
                            if (userSocket !== undefined)
                                userSocket.forEach(element => this.server.to(element.id).emit("updateLastMsg", msg));
                        }
                    }
                }
            }
            else
                throw new HttpException('Message is not valid', HttpStatus.NOT_FOUND);
        }
    }

    @SubscribeMessage('JoinRoom')
    async handleEvent(client: Socket, roomName: string) {
        if (this.chatService.isMember(client.handshake.auth.token, roomName)) {
            const user = await this.userService.findUserByid(client.handshake.auth.token);
            await this.chatService.setConnexion(roomName, user.username, true);
            client.join(roomName);
        }
    }

    @SubscribeMessage('leaveRoom')
    async leaveRoom(client: Socket, roomName: string) {
        const user = await this.userService.findUserByid(client.handshake.auth.token);
        await this.chatService.setConnexion(roomName, user.username, false);

        client.leave(roomName);
    }

    @SubscribeMessage('newRoom')
    async createNewRoom(client: Socket, room: any) {
        for (const member of room.channel.members) {
            const userSocket = await this.users.get(member.id);

            if (room.channel.type === "PrivMsg") {
                const member1 = room.channel.members[0];
                const member2 = room.channel.members[1];

                if (member.id == member1.id)
                    room.receiver = member2;
                else
                    room.receiver = member1;
            }
            if (userSocket !== undefined)
                userSocket.forEach(element => this.server.to(element.id).emit("hasNewRoom", { room: room }));
        }
    }

    @SubscribeMessage('kickMember')
    async kickMember(client: Socket, room: any) {
        if (this.chatService.isAdmin(client.handshake.auth.token, room.roomName)) {

            const currentUser = await this.userService.findUserByUsername(room.username)
            const isConnected: boolean = await this.chatService.isConnected(room.username, room.roomName);
            const userSocket = await this.users.get(currentUser.id);

            if (userSocket !== undefined)
                userSocket.forEach(element => this.server.to(element.id).emit("kicked", { username: room.username, roomName: room.roomName, isConnected: isConnected }));
            this.server.to(client.id).emit("reduceNbOfMembers", { username: room.username, roomName: room.roomName });
            await this.chatService.setConnexion(room.roomName, room.username, false);
        }
    }

    @SubscribeMessage('banMember')
    async banMember(client: Socket, room: any) {
        if (this.chatService.isAdmin(client.handshake.auth.token, room.roomName)) {

            let userBanned = await this.userService.findUserByUsername(room.username);
            const isConnected: boolean = await this.chatService.isConnected(room.username, room.roomName);
            const userSocket = await this.users.get(userBanned.id);
            if (userSocket !== undefined)
                userSocket.forEach(element => this.server.to(element.id).emit("kicked", { username: room.username, roomName: room.roomName, isConnected: isConnected }));
            this.server.to(client.id).emit("reduceNbOfMembers", { username: room.username, roomName: room.roomName });
            await this.chatService.setConnexion(room.roomName, room.username, false);
        }
    }

    @SubscribeMessage('addNewMember')
    async addNewMembers(client: Socket, data: any) {
        if (this.chatService.isAdmin(client.handshake.auth.token, data.roomName)) {
            const room = await this.chatService.getRoombyRoomName(data.roomName);
            if (room !== undefined && room !== null) {
                for (const elem of data.members) {
                    const member = await this.userRepository.findOne({ where: { username: elem.value } });
                    const user = await this.users.get(member.id);
                    for (const i of room.members) {
                        const officialMember = await this.users.get(i.id);
                        if (officialMember !== undefined)
                            officialMember.forEach(element => this.server.to(element.id).emit("newMemberAdded", { room: { channel: room }, member: member }));
                    }
                    if (user !== undefined)
                        user.forEach(element => this.server.to(element.id).emit("hasNewRoom", { room: { channel: room }, member: member }));
                }
            }
        }
    }

    @SubscribeMessage('invitationAccepted')
    async memberAcceptInvitation(client: Socket, data: any) {
        const room = await this.chatService.getRoombyRoomName(data.roomName);
        if (room !== undefined && room !== null) {
            const member = await this.userRepository.findOne({ where: { username: data.username } });
            const user = await this.users.get(member.id);
            for (const i of room.members) {
                const officialMember = await this.users.get(i.id);
                if (officialMember !== undefined)
                    officialMember.forEach(element => this.server.to(element.id).emit("newMemberAdded", { room: { channel: room }, member: member }));
            }
            if (user !== undefined)
                user.forEach(element => this.server.to(element.id).emit("hasNewRoom", { room: { channel: room }, member: member }));
        }
    }

    @SubscribeMessage('changePassword')
    async changePassword(client: Socket, data: any) {
        if (this.chatService.isOwner(client.handshake.auth.token, data.roomName)) {
            const room = await this.chatService.getRoombyRoomName(data.roomName);
            const roomWithNewPassword = await this.chatService.changePassword(client.handshake.auth.token, room.roomName, data.password);
            if (room !== null) {
                for (const elem of room.members) {
                    const user = await this.userRepository.findOne({ where: { username: elem.username } });
                    const userSocket = this.users.get(user.id);
                    const isConnected: boolean = await this.chatService.isConnected(elem.username, room.roomName);

                    if (userSocket !== undefined) {
                        userSocket.forEach(element => this.server.to(element.id).emit("passwordChanged", { room: { channel: room }, password: roomWithNewPassword.password, connected: isConnected }));
                        if (isConnected === true) {
                            userSocket.forEach(element => this.server.to(element.id).emit("setActiveRoom"));
                        }
                    }
                }
            }
        }
    }

    @SubscribeMessage('deletePassword')
    async deletePassword(client: Socket, data: any) {
        if (this.chatService.isOwner(client.handshake.auth.token, data.roomName)) {
            const room = await this.chatService.getRoombyRoomName(data.roomName);
            if (room !== undefined && room !== null) {
                for (const elem of room.members) {
                    const member: UserType = await this.userRepository.findOne({ where: { username: elem.username } });
                    const userSocket = await this.users.get(member.id);
                    const isConnected: boolean = await this.chatService.isConnected(elem.username, room.roomName);

                    if (isConnected && userSocket !== undefined) {
                        await userSocket.forEach(element => this.server.to(element.id).emit("setActiveRoom"));
                    }
                    if (userSocket !== undefined) {
                        await userSocket.forEach(element => this.server.to(element.id).emit("passwordDeleted", { room: { channel: room } }));
                        if (room.membersJoined.map((e) => e.id).indexOf(member.id) === -1)
                            await userSocket.forEach(element => this.server.to(element.id).emit("joinedAfterPasswordDeleted", { room: { channel: room }, member: member }));
                    }
                    room.membersJoined.push(member);
                    await this.channelRepository.save(room);
                }
            }
        }
    }

    @SubscribeMessage('addAdmin')
    async addAdmin(client: Socket, data: any) {
        if (this.chatService.isAdmin(client.handshake.auth.token, data.roomName)) {
            const room = await this.chatService.getRoombyRoomName(data.roomName);
            if (room !== undefined && room !== null) {
                for (const elem of room.members) {
                    const member = await this.userRepository.findOne({ where: { username: elem.username } });
                    const user = await this.users.get(member.id);
                    const isConnected: boolean = await this.chatService.isConnected(elem.username, room.roomName);
                    if (isConnected && user !== undefined)
                        await user.forEach(element => this.server.to(element.id).emit("setActiveRoom"));
                    if (user !== undefined)
                        user.forEach(element => this.server.to(element.id).emit("adminAdded", { room: { channel: room }, member: member }));
                }
            }
        }
    }

    @SubscribeMessage('quitRoom')
    async quitRoom(client: Socket, data: any) {
        if (this.chatService.isMember(client.handshake.auth.token, data.roomName)) {
            const room = await this.chatService.getRoombyRoomName(data.roomName);
            const member = await this.userRepository.findOne({ where: { username: data.username } });
            const userSocket = await this.users.get(member.id);

            if (room !== undefined && room !== null) {
                let index = userSocket.findIndex((element) => element === client);
                for (const elem of room.members) {
                    const elemUser = await this.users.get(elem.id);

                    if (index !== -1 && elemUser !== undefined)
                        elemUser.forEach(element => this.server.to(element.id).emit("reduceNbOfMembers", { username: data.username, roomName: data.roomName }));
                }
                if (userSocket !== undefined)
                    userSocket.forEach(element => this.server.to(element.id).emit("RoomQuitted", { username: data.username, roomName: data.roomName }));
                const isConnected: boolean = await this.chatService.isConnected(data.username, data.roomName);
                if (isConnected && userSocket !== undefined)
                    await userSocket.forEach(element => this.server.to(element.id).emit("setActiveRoom"));

                await this.chatService.setConnexion(data.roomName, data.username, false);

            }
        }
    }

    @SubscribeMessage('ownerChanged')
    async ownerChanged(client: Socket, data: any) {
        if (this.chatService.isOwner(client.handshake.auth.token, data.roomName)) {
            const room = await this.chatService.getRoombyRoomName(data.roomName);

            if (room !== undefined && room !== null) {
                for (const member of room.members) {
                    const user: Socket[] = await this.users.get(member.id);
                    const isConnected: boolean = await this.chatService.isConnected(member.username, room.roomName);
                    if (isConnected && user !== undefined)
                        await user.forEach(element => this.server.to(element.id).emit("setActiveRoom"));
                    if (user !== undefined)
                        user.forEach(element => this.server.to(element.id).emit("ownerHasChanged", { newOwner: data.ownerUsername, roomName: data.roomName }));
                }
            }
        }
    }

    @SubscribeMessage('newInvitations')
    async newInvitations(client: Socket, data: any) {
        if (this.chatService.isAdmin(client.handshake.auth.token, data.roomName)) {
            const room = await this.chatService.getRoombyRoomName(data.roomName);
            if (room !== undefined && room !== null) {
                for (const elem of data.members) {
                    const member = await this.userRepository.findOne({ where: { username: elem.value } });
                    const user: Socket[] = await this.users.get(member.id);
                    if (user !== undefined)
                        user.forEach(element => this.server.to(element.id).emit("haveNewInvitation", { room: room }));
                }
            }
        }
    }

    @SubscribeMessage('cancelInvitations')
    async cancelInvitations(client: Socket, data: any) {
        if (this.chatService.isInvited(client.handshake.auth.token, data.roomName)) {
            const room = await this.chatService.getRoombyRoomName(data.roomName);
            if (room !== undefined && room !== null) {
                if (room.status === "Private") {
                    for (const invited of room.usersInvited) {
                        const member = await this.userRepository.findOne({ where: { username: invited.username } });
                        const socketInvited: Socket[] = await this.users.get(member.id);
                        if (socketInvited !== undefined)
                            await socketInvited.forEach(element => this.server.to(element.id).emit("cancelInvitation", data.roomName));
                    }
                }
            }
        }
    }

    @SubscribeMessage('muteSomeone')
    async muteSomeone(client: Socket, data: any) {
        if (this.chatService.isAdmin(client.handshake.auth.token, data.roomName)) {
            const room = await this.chatService.getRoombyRoomName(data.roomName);
            if (room !== undefined && room !== null) {
                const member = await this.userRepository.findOne({ where: { username: data.username } });
                const userSocket: Socket[] = await this.users.get(member.id);
                await this.chatService.muteUser(room.id, member.id);
                if (userSocket !== undefined)
                    userSocket.forEach(element => this.server.to(room.roomName).emit("youAreMute", member.id));
            }
        }
    }

    @SubscribeMessage('handleUserBlock')
    async blockSomeone(client: Socket, data: any) {
        const currentUser = await this.userService.findUserByid(client.handshake.auth.token);
        const member = await this.userRepository.findOne({ where: { id: data.userId } });

        if (member !== null && currentUser !== null) {
            const userSocket: Socket[] = await this.users.get(member.id);
            if (userSocket !== undefined)
                userSocket.forEach(element => this.server.to(element.id).emit("userBlocked", { user: currentUser }));
        }
    }


    @SubscribeMessage('handlePrivMsgUserBlocked')
    async handlePrivMsgUserBlocked(client: Socket, data: any) {
        const currentUser = await this.userService.findUserByid(client.handshake.auth.token);
        const member = await this.userRepository.findOne({ where: { id: data.userId } });

        if (member !== null && currentUser !== null) {
            const userSocket: Socket[] = await this.users.get(member.id);
            const privMsg = await this.chatService.getPrivMsg(currentUser.id, member.id);
            if (privMsg !== null) {
                if (userSocket !== undefined) {
                    userSocket.forEach(element => this.server.to(element.id).emit("handlePrivMsg", { room: privMsg }));
                    const isConnected: boolean = await this.chatService.isConnected(member.username, privMsg.channel.roomName);
                    if (isConnected)
                        userSocket.forEach(element => this.server.to(element.id).emit("setActiveRoom"));
                }
            }
        }
    }

    @SubscribeMessage('handleUserUnblocked')
    async unblockSomeone(client: Socket, data: any) {
        if (this.chatService.hasBlocked(client.handshake.auth.token, data.userId)) {
            const currentUser = await this.userService.findUserByid(client.handshake.auth.token);
            const member = await this.userRepository.findOne({ where: { id: data.userId } });
            const userSocket: Socket[] = await this.users.get(member.id);
            if (userSocket !== undefined)
                userSocket.forEach(element => this.server.to(element.id).emit("userUnblocked", { user: currentUser }));
        }
    }

    @SubscribeMessage('handlePrivMsgUserUnblocked')
    async handlePrivMsgUserUnblocked(client: Socket, data: any) {
        const currentUser = await this.userService.findUserByid(client.handshake.auth.token);
        const member = await this.userRepository.findOne({ where: { id: data.userId } });

        if (member !== null && currentUser !== null) {
            const userSocket: Socket[] = await this.users.get(member.id);
            const privMsg = await this.chatService.getPrivMsg(currentUser.id, member.id);
            if (privMsg !== null) {
                const member1 = privMsg.channel.members[0];
                const member2 = privMsg.channel.members[1];

                if (member.id == member1.id)
                    privMsg.receiver = member2;
                else
                    privMsg.receiver = member1;
                if (userSocket !== undefined)
                    userSocket.forEach(element => this.server.to(element.id).emit("handlePrivMsgUnblocked", { room: privMsg }));
            }
        }
    }

}
