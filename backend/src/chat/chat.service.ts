import { Injectable, Inject, forwardRef, HttpException, HttpStatus } from '@nestjs/common';
import { Message } from './Entities/message.entity';
import { Repository, DataSource, MoreThan, LessThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/Entities/user.entity';
import { Channel } from './Entities/channel.entity';
import { RoomDto } from './room.dto';
import { MessageDto } from './messageDto';
import { ConnectionTime } from './Entities/connexionTime.entity';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { PrivMsgDto } from './privMsg.dto';
import { UserType } from 'src/user/user.type';
import { Mute } from './Entities/mute.entity';


@Injectable()
export class ChatService {
    constructor(@InjectRepository(Message) private messageRepository: Repository<Message>,
        @InjectRepository(Channel) private channelRepository: Repository<Channel>,
        @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
        @InjectRepository(ConnectionTime) private connectionRepository: Repository<ConnectionTime>,
        @InjectRepository(Mute) private muteRepository: Repository<Mute>,
        @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    ) { };

    async getRooms(): Promise<Channel[]> {
        return await this.channelRepository.find({ where: { type: "Channel" } });
    }

    async createMessage(message: Message): Promise<Message> {
        const userId = message.author.id;
        const user = await this.userRepository.findOne({ where: { id: userId } });
        const pattern = /[a-zA-Z0-9]/;
        if (!user)
            throw new HttpException('profile does not exist', HttpStatus.NOT_FOUND);

        message.author = user;
        if (message.message.match(pattern)) {
            if (message.message.length > 80)
                message.message = message.message.substring(0, 80) + "...";
            const msg = await this.messageRepository.save(message);
            return msg;
        }
        return null;
    }

    async getMessagesByRoomName(currentUserId: number, roomName: string): Promise<Message[]> {
        const user = this.userService.findUserByid(currentUserId);
        if (!user)
            throw new HttpException('profile does not exist', HttpStatus.NOT_FOUND);

        const room = await this.getRoombyRoomName(roomName);
        if (room) {
            const posMember = room.members.map((e) => e.id).indexOf(currentUserId);
            if (posMember === -1)
                throw new HttpException("You're not authorize to get this information", HttpStatus.NOT_FOUND);

            return await this.messageRepository.find({ where: { destination: roomName }, order: { timestamp: "ASC" } });
        }
    }


    async getRoomsByUserId(currentUserId: number): Promise<Channel[]> {
        const rooms = await this.channelRepository.find({ where: { type: "Channel" }, relations: ['members', 'usersInvited', 'admins', 'banned', 'membersJoined'] });
        if (!rooms)
            throw new HttpException('room does not exist', HttpStatus.NOT_FOUND);

        let ret = [];
        for (let elem of rooms) {
            elem.members.map(member => {
                if (member.id === currentUserId)
                    ret.push(elem);
            })
        }
        return ret;
    }

    async getPrivateRoomsByUserId(currentUserId: number): Promise<Channel[]> {
        const rooms = await this.channelRepository.find({ where: { status: "Private" }, relations: ['usersInvited'] });

        let ret: Channel[] = [];

        for (let elem of rooms) {
            elem.usersInvited.map(member => {

                if (member.id === currentUserId)
                    ret.push(elem);
            })
        }
        return ret;
    }

    async getRoombyRoomName(roomName: string): Promise<Channel> {
        return await this.channelRepository.findOne({ where: { roomName: roomName }, relations: ['members', 'usersInvited', 'admins', 'banned', 'membersJoined'] });
    }

    async getRoomWithMembersbyRoomName(roomName: string): Promise<Channel> {
        return await this.channelRepository.findOne({ where: { roomName: roomName }, relations: ['members'] });
    }

    async getRoomNameByRoomId(roomId: number): Promise<Channel> {
        return await this.channelRepository.findOne({ where: { id: roomId } });
    }

    async getRoomsToMenu(currentUserId: number): Promise<RoomDto[]> {
        const rooms = await this.getRoomsByUserId(currentUserId);
        const memberUnblocked = await this.userService.getUsersUnblocked(currentUserId);
        const user = await this.userService.findUserByid(currentUserId);
        if (!rooms)
            throw new HttpException('Room or user does not exist', HttpStatus.NOT_FOUND);

        const arrayDto: RoomDto[] = new Array();

        for (let elem of rooms) {
            let new_data = new RoomDto();
            new_data.channel = elem;

            const msg = await this.getLastMessages(elem.roomName);
            if (msg !== null) {
                let isBlocked = memberUnblocked.map((e) => e.id).indexOf(msg.author.id);
                if (isBlocked !== -1 || msg.author.id === currentUserId)
                    new_data.lastMessage = msg;
                else {
                    msg.message = "*******";
                    new_data.lastMessage = msg;
                }
            }
            new_data.numberUnreadMessage = await this.countMessageUnread(currentUserId, elem.roomName);

            arrayDto.push(new_data);
        }
        return arrayDto;
    }

    async createChannel(currentUserId: number, dataCreation: any, members: any): Promise<Channel> {
        const connexion = new Date();
        const passwordCrypted = await this.hashPassword(dataCreation.password);
        const currentUser = await this.userService.findUserByid(currentUserId);
        const users = await this.userRepository.find();
        const dataChannel = { roomName: dataCreation.roomName, type: "Channel", status: dataCreation.status, password: passwordCrypted, owner: dataCreation.status !== "Public" ? currentUser : null, color: dataCreation.color };
        const roomNameLen = dataCreation.roomName.length;
        const pattern = /[a-zA-Z0-9]/;

        if (await this.channelRepository.findOne({ where: { roomName: dataChannel.roomName } }))
            return null;

        if (passwordCrypted !== null)
            if (!dataCreation.password.match(pattern) || !dataChannel.roomName.match(pattern))
                return null;

        if (roomNameLen > 28)
            dataChannel.roomName = dataChannel.roomName.substring(0, 28);
        const chanSave = await this.channelRepository.save(dataChannel);

        let channel = await this.channelRepository.findOne({ where: { id: chanSave.id }, relations: ['members', 'usersInvited', 'admins', 'banned', 'membersJoined'], });

        if (!channel || !users)
            throw new HttpException('Element does not exist', HttpStatus.NOT_FOUND);

        if (dataChannel.status === "Public" || dataChannel.status === "Protected") {
            channel.members.push(...users);
        }

        for (let member of channel.members) {
            await this.connectionRepository.save({ connectionTime: connexion, userId: member.id, roomId: channel.id, connected: false });
        }

        if (channel.status === "Protected")
            channel.membersJoined.push(currentUser);

        channel.admins.push(currentUser);
        await this.channelRepository.save(channel);

        if (dataChannel.status === "Private") {
            channel.members.push(currentUser);
            await this.channelRepository.save(channel);
            channel = await this.sendInvitations(members, channel.id, dataChannel.owner);
        }

        return await this.channelRepository.save(channel);
    }

    async getLastMessages(roomName: string): Promise<MessageDto> {
        let lastMsg = await this.messageRepository.findOne({ where: { destination: roomName }, order: { id: "DESC" } });
        if (lastMsg) {
            if (lastMsg.message.length > 50)
                lastMsg.message = lastMsg.message.substring(0, 50) + "...";
            return { message: lastMsg.message, timestamp: lastMsg.timestamp, destination: lastMsg.destination, author: lastMsg.author };
        }
        return null;
    }

    async countMessageUnread(currentUserId: number, roomName: string): Promise<number> {
        const room = await this.getRoombyRoomName(roomName);
        const userConnexionTime = await this.connectionRepository.findOne({ where: { userId: currentUserId, roomId: room.id, connected: false }, order: { id: "DESC" } });
        const currentUser = await this.userService.findUserByid(currentUserId);

        if (!room || !currentUser)
            throw new HttpException('Element does not exist', HttpStatus.NOT_FOUND);

        if (room.members.map((e) => e.id).indexOf(currentUser.id) === -1)
            throw new HttpException("Not authorized", HttpStatus.UNAUTHORIZED);

        if (userConnexionTime && userConnexionTime.connectionTime !== null) {
            const messages = await this.messageRepository.find({ where: { destination: roomName, timestamp: MoreThan(userConnexionTime.connectionTime) } });
            let i = 0;
            for (let msg of messages) {
                if (msg.author.id === currentUserId)
                    messages.splice(i, 1);
                ++i;
            }
            return messages.length;
        }
        return 0;
    }

    async updateConnectionTime(roomName: string, username: string) {
        const room = await this.getRoombyRoomName(roomName);
        const user = await this.userService.findUserByUsername(username);

        let userConnexionTime;

        if (room !== null)
            userConnexionTime = await this.connectionRepository.findOne({ where: { userId: user.id, roomId: room.id } });
        else
            userConnexionTime = await this.connectionRepository.findOne({ where: { userId: user.id } });

        if (userConnexionTime === null) {
            const connexionTime = { userId: user.id, roomId: room.id, connectionTime: new Date() };
            await this.connectionRepository.save(connexionTime);
        }
        else {
            userConnexionTime.connectionTime = new Date();
            await this.connectionRepository.save(userConnexionTime);
        }

    }

    async checkRoomPassword(currentUserId: number, roomName: string, password: string): Promise<boolean> {
        const room = await this.getRoombyRoomName(roomName);
        const pattern = /[a-zA-Z0-9]/;

        if (password.match(pattern)) {
            if (!room)
                throw new HttpException('Room does not exist', HttpStatus.NOT_FOUND);

            if (room.members.map((e) => e.id).indexOf(currentUserId) === -1)
                throw new HttpException("Not authorized", HttpStatus.UNAUTHORIZED);

            if (room.password) {
                const passwordIsCorrect = await bcrypt.compare(password, room.password);
                const user = await this.userService.findUserByid(currentUserId);

                if (!user)
                    throw new HttpException('Room does not exist', HttpStatus.NOT_FOUND);

                if (passwordIsCorrect) {
                    const pos = room.membersJoined.map((e) => e.id).indexOf(user.id);
                    if (pos === -1) {
                        room.membersJoined.push(user);
                        await this.channelRepository.save(room);
                    }
                }
                return passwordIsCorrect;
            }
        }
        return false;
    }

    async addMemberJoined(currentUserId: number, roomName: string) {
        const room = await this.getRoombyRoomName(roomName);
        const user = await this.userService.findUserByid(currentUserId);

        if (room && user) {
            const pos = room.membersJoined.map((e) => e.id).indexOf(user.id);
            if (pos === -1) {
                room.membersJoined.push(user);
                await this.channelRepository.save(room);
            }
        }
    }

    async sendInvitations(roomMembers: any[], roomId: number, roomOwner: UserType): Promise<Channel> {
        const connexion = new Date();
        const room = await this.channelRepository.findOne({ where: { id: roomId, status: "Private" }, relations: ['members', 'usersInvited', 'admins', 'banned'] });

        if (!room)
            throw new HttpException('Room does not exist', HttpStatus.NOT_FOUND);

        for (let member of roomMembers) {
            const user = await this.userRepository.findOne({ where: { username: member.value } });
            if (!user)
                throw new HttpException('User does not exist', HttpStatus.NOT_FOUND);

            if (user.id !== roomOwner.id) {
                room.usersInvited.push(user);
                await this.channelRepository.save(room);
                await this.userRepository.save(user);
            }
            await this.setConnexion(room.roomName, member.username, false)
            // await this.connectionRepository.save({ connectionTime: connexion, userId: user.id, roomId: room.id, connected: false });
        }

        return room;
    }

    async getInvitationsByUserId(currentUserId: number): Promise<Channel[]> {
        return await this.getPrivateRoomsByUserId(currentUserId);
    }

    async setAcceptedInvitation(currentUserId: number, roomName: string) {
        const room = await this.getRoombyRoomName(roomName);
        const user = await this.userRepository.findOne({ where: { id: currentUserId } });

        if (!room || !user)
            throw new HttpException('Element does not exist', HttpStatus.NOT_FOUND);

        if (room.usersInvited.map((e) => e.id).indexOf(currentUserId) === -1)
            throw new HttpException("Not authorized", HttpStatus.UNAUTHORIZED);

        room.members.push(user);

        const pos = room.usersInvited.map(e => e.id).indexOf(currentUserId);
        if (pos !== -1)
            room.usersInvited.splice(pos, 1);

        await this.connectionRepository.save({ connectionTime: new Date(), userId: user.id, roomId: room.id, connected: false });
        await this.channelRepository.save(room);
    }

    async setDeniedInvitation(currentUserId: number, roomName: string) {
        const room = await this.getRoombyRoomName(roomName);
        if (!room)
            throw new HttpException('Element does not exist', HttpStatus.NOT_FOUND);

        if (room.usersInvited.map((e) => e.id).indexOf(currentUserId) === -1)
            throw new HttpException("Not authorized", HttpStatus.UNAUTHORIZED);

        const pos = room.usersInvited.map(e => e.id).indexOf(currentUserId);
        if (pos !== -1)
            room.usersInvited.splice(pos, 1);

        await this.channelRepository.save(room);
    }

    async getOwnerByRoomName(currentUserId: number, roomName: string): Promise<UserType> {
        const room = await this.getRoombyRoomName(roomName);

        if (!room)
            throw new HttpException("Room doesn't exist", HttpStatus.NOT_FOUND);

        if (room.members.map((e) => e.id).indexOf(currentUserId) === -1)
            throw new HttpException("Not authorized", HttpStatus.UNAUTHORIZED);

        return room.owner;
    }

    async getOwner(username: string): Promise<UserType> {
        const user = await this.userRepository.findOne({ where: { username: username } });
        return await this.userService.findUserByid(user.id);
    }

    async getMembersByRoomName(currentUserId: number, roomName: string): Promise<UserType[]> {
        const room = await this.getRoombyRoomName(roomName);
        if (!room)
            throw new HttpException("Room doesn't exist", HttpStatus.NOT_FOUND);

        if (room.members.map((e) => e.id).indexOf(currentUserId) === -1)
            throw new HttpException("Not authorized", HttpStatus.UNAUTHORIZED);

        return room.members;
    }

    async getRoomNonMembers(currentUserId: number, roomName: string): Promise<UserType[]> {
        const room = await this.getRoombyRoomName(roomName);
        const users = await this.userService.getUsers(currentUserId);

        if (!room || !users)
            throw new HttpException("Element doesn't exist", HttpStatus.NOT_FOUND);

        if (room.members.map((e) => e.id).indexOf(currentUserId) === -1)
            throw new HttpException("Not authorized", HttpStatus.UNAUTHORIZED);

        for (let member of room.members) {
            const pos = users.map((e) => e.id).indexOf(member.id);
            if (pos !== -1)
                users.splice(pos, 1);
        }

        for (let member of room.usersInvited) {
            const pos = users.map((e) => e.id).indexOf(member.id);
            if (pos !== -1)
                users.splice(pos, 1);
        }

        for (let member of room.banned) {
            const pos = users.map((e) => e.id).indexOf(member.id);
            if (pos !== -1)
                users.splice(pos, 1);
        }

        return users;
    }

    async addNewMembers(currentUserId: number, roomName: string, newMembers: any) {
        let room = await this.getRoombyRoomName(roomName);
        if (!room)
            throw new HttpException("Room doesn't exist", HttpStatus.NOT_FOUND);

        if (room.admins.map((e) => e.id).indexOf(currentUserId) === -1)
            throw new HttpException("Not authorized", HttpStatus.UNAUTHORIZED);

        if (room.status === "Private") {
            room = await this.sendInvitations(newMembers, room.id, room.owner);
        }
        else {
            for (let newMember of newMembers) {
                const user = await this.userRepository.findOne({ where: { username: newMember.value } });
                if (!user)
                    throw new HttpException("User doesn't exist", HttpStatus.NOT_FOUND);

                room.members.push(user);
            }
        }
        await this.channelRepository.save(room);
        return true;
    }

    async roomAddedIntoMenu(roomName: string, newMembers: any) {

        const connexion = new Date();
        let room = await this.getRoombyRoomName(roomName);

        const user = await this.userRepository.findOne({ where: { id: newMembers.id } });
        room.members.push(user);
        await this.connectionRepository.save({ connectionTime: connexion, userId: user.id, roomId: room.id, connected: false });
        await this.channelRepository.save(room);
        return true;

    }

    async QuitRoom(currentUserId: number, username: string, roomName: string) {
        const user = await this.userService.getUserByUsername(username);
        const room = await this.getRoombyRoomName(roomName);
        if (!user || !room)
            throw new HttpException("Element doesn't exist", HttpStatus.NOT_FOUND);

        if (room.members.map((e) => e.id).indexOf(currentUserId) === -1)
            throw new HttpException("Not authorized", HttpStatus.UNAUTHORIZED);

        const pos = await room.members.map((e) => e.id).indexOf(user.id);
        if (pos !== -1)
            await room.members.splice(pos, 1);

        const adminPos = await room.admins.map((e) => e.id).indexOf(user.id);
        if (adminPos !== -1)
            await room.admins.splice(adminPos, 1);

        if (room.members.length === 0)
            await this.channelRepository.delete(room.id);
        else
            await this.channelRepository.save(room);
    }

    async setRoomOwner(currentUserId: number, roomName: string, ownerName: string) {
        const newOwner = await this.userService.getUserByUsername(ownerName);
        const room = await this.getRoombyRoomName(roomName);
        if (!newOwner || !room)
            throw new HttpException("Element doesn't exist", HttpStatus.NOT_FOUND);

        if (room.members.map((e) => e.id).indexOf(currentUserId) === -1)
            throw new HttpException("Not authorized", HttpStatus.UNAUTHORIZED);

        room.owner = newOwner;
        if (room.admins.map((e) => e.id).indexOf(newOwner.id) === -1) {
            room.admins.push(newOwner);
        }
        await this.channelRepository.save(room);
    }

    async countRoomMember(currentUserId: number, roomName: string) {
        const room = await this.getRoombyRoomName(roomName);
        if (!room)
            throw new HttpException("Element doesn't exist", HttpStatus.NOT_FOUND);

        if (room.members.map((e) => e.id).indexOf(currentUserId) === -1)
            throw new HttpException("Not authorized", HttpStatus.UNAUTHORIZED);

        const owner = room.owner;
        const ownerPos = room.members.map((e) => e.id).indexOf(owner.id);

        if (ownerPos !== -1)
            room.members.splice(ownerPos, 1);
        return room.members.length;
    }

    async deleteRoom(currentUserId: number, roomName: string) {
        const room = await this.getRoombyRoomName(roomName);
        if (!room)
            throw new HttpException("Element doesn't exist", HttpStatus.NOT_FOUND);

        if (room.admins.map((e) => e.id).indexOf(currentUserId) === -1)
            throw new HttpException("Not authorized", HttpStatus.UNAUTHORIZED);

        await this.channelRepository.delete(room.id);
    }

    async addRoomAdmin(currentUserId: number, roomName: string, username: string) {
        const room = await this.getRoombyRoomName(roomName);
        const user = await this.userService.getUserByUsername(username);
        if (!room || !user)
            throw new HttpException("Element doesn't exist", HttpStatus.NOT_FOUND);

        if (room.admins.map((e) => e.id).indexOf(currentUserId) === -1)
            throw new HttpException("Not authorized", HttpStatus.UNAUTHORIZED);

        room.admins.push(user);

        await this.channelRepository.save(room);
    }

    async getRoomAdmins(currentUserId: number, roomName: string): Promise<UserType[]> {
        const room = await this.getRoombyRoomName(roomName);
        if (!room)
            throw new HttpException("Element doesn't exist", HttpStatus.NOT_FOUND);

        if (room.members.map((e) => e.id).indexOf(currentUserId) === -1)
            throw new HttpException("Not authorized", HttpStatus.UNAUTHORIZED);

        return room.admins;
    }

    async deletePassword(currentUserId: number, roomName: string): Promise<Channel> {

        const room = await this.getRoombyRoomName(roomName);
        if (!room)
            throw new HttpException("Element doesn't exist", HttpStatus.NOT_FOUND);

        if (room.owner.id !== currentUserId)
            throw new HttpException("Not authorized", HttpStatus.UNAUTHORIZED);

        room.password = null;

        await this.channelRepository.save(room);
        return room;
    }

    async changePassword(currentUserId: number, roomName: string, password: string): Promise<Channel> {
        const room = await this.getRoombyRoomName(roomName);
        if (!room)
            throw new HttpException("Element doesn't exist", HttpStatus.NOT_FOUND);

        if (room.owner.id !== currentUserId)
            throw new HttpException("Not authorized", HttpStatus.UNAUTHORIZED);

        const salt = await bcrypt.genSalt(10);
        const passwordCrypted = await bcrypt.hash(password, salt);
        room.password = passwordCrypted;
        await this.channelRepository.save(room);

        return room;
    }

    async banUser(currentUserId: number, roomName: string, username: string) {
        const room = await this.getRoombyRoomName(roomName);
        const user = await this.userService.getUserByUsername(username);
        if (!room || !user)
            throw new HttpException("Element doesn't exist", HttpStatus.NOT_FOUND);

        if (room.admins.map((e) => e.id).indexOf(currentUserId) === -1)
            throw new HttpException("Not authorized", HttpStatus.UNAUTHORIZED);

        const pos = room.members.map((e) => e.id).indexOf(user.id);
        if (pos !== -1)
            await room.members.splice(pos, 1);

        const posAdmin = room.admins.map((e) => e.id).indexOf(user.id);
        if (posAdmin !== -1)
            await room.admins.splice(posAdmin, 1);

        room.banned.push(user);
        await this.channelRepository.save(room);
    }

    async getUsersBanned(currentUserId: number, roomName: string): Promise<UserType[]> {
        const room = await this.getRoombyRoomName(roomName);
        if (!room)
            throw new HttpException("Element doesn't exist", HttpStatus.NOT_FOUND);

        if (room.members.map((e) => e.id).indexOf(currentUserId) === -1)
            throw new HttpException("Not authorized", HttpStatus.UNAUTHORIZED);

        return room.banned;
    }

    async unBanRoomUser(currentUserId: number, roomName: string, username: string): Promise<UserType[]> {
        const room = await this.getRoombyRoomName(roomName);
        const user = await this.userService.getUserByUsername(username);
        if (!room || !user)
            throw new HttpException("Element doesn't exist", HttpStatus.NOT_FOUND);

        if (room.admins.map((e) => e.id).indexOf(currentUserId) === -1)
            throw new HttpException("Not authorized", HttpStatus.UNAUTHORIZED);

        const pos = room.banned.map((e) => e.id).indexOf(user.id);
        if (pos !== -1)
            room.banned.splice(pos, 1);

        await this.channelRepository.save(room);
        return room.banned;
    }

    async hashPassword(password: string): Promise<string> {
        if (password.length > 0) {
            const salt = await bcrypt.genSalt(10);
            return await bcrypt.hash(password, salt);
        }
        return null;
    }

    async getPrivMsgMenu(currentUserId: number): Promise<PrivMsgDto[]> {
        const allPrivMsgs = await this.channelRepository.find({ where: { type: "PrivMsg" }, relations: ['members'] });
        const memberUnblocked = await this.userService.getUsersUnblocked(currentUserId);

        if (!allPrivMsgs)
            throw new HttpException("Element doesn't exist", HttpStatus.NOT_FOUND);

        let privMsgsDto: PrivMsgDto[] = [];

        for (let elem of allPrivMsgs) {
            let elemDto: PrivMsgDto = new PrivMsgDto();
            const pos = elem.members.map((e) => e.id).indexOf(currentUserId);

            if (pos !== -1) {
                const posMember = pos === 0 ? 1 : 0;
                if (memberUnblocked.map((e) => e.id).indexOf(elem.members[posMember].id) !== -1) {
                    elemDto.lastMessage = await this.getLastMessages(elem.roomName);
                    elemDto.numberUnreadMessage = await this.countMessageUnread(currentUserId, elem.roomName);
                    elemDto.channel = elem;
                    const receiver = await this.userService.findUserByUsername(pos === 0 ? elem.members[1].username : elem.members[0].username);
                    elemDto.receiver = receiver;
                    privMsgsDto.push(elemDto);
                }
            }
        }
        return privMsgsDto;
    }

    async getPrivMsg(currentUserId: number, userId: number): Promise<PrivMsgDto> {
        const privateRooms = await this.channelRepository.find({ where: { type: "PrivMsg" }, relations: ['members'] });

        for (const room of privateRooms) {
            const pos1 = room.members.map((e) => e.id).indexOf(currentUserId);
            const pos2 = room.members.map((e) => e.id).indexOf(userId)
            if (pos1 !== -1 && pos2 !== -1) {
                let elemDto: PrivMsgDto = new PrivMsgDto();
                elemDto.lastMessage = await this.getLastMessages(room.roomName);
                elemDto.numberUnreadMessage = await this.countMessageUnread(currentUserId, room.roomName);
                elemDto.channel = room;
                const receiver = await this.userService.findUserByUsername(pos1 === 0 ? room.members[1].username : room.members[0].username);
                elemDto.receiver = receiver;

                return elemDto;
            }
        }
        return null;
    }

    async createPrivMsgDto(currentUserId: number, room: Channel): Promise<PrivMsgDto> {
        let elemDto: PrivMsgDto = new PrivMsgDto();
        const pos = room.members.map((e) => e.id).indexOf(currentUserId);

        elemDto.channel = room;
        elemDto.receiver = await this.userService.findUserByUsername(pos === 0 ? room.members[1].username : room.members[0].username);

        return elemDto;
    }

    async createPrivateMsg(currentUserId: number, room: any): Promise<PrivMsgDto> {
        const user = await this.userService.findUserByid(currentUserId);
        const member = await this.userService.findUserByUsername(room.member);
        const pattern = /[a-zA-Z0-9]/;

        if (!user || !member)
            throw new HttpException("Element doesn't exist", HttpStatus.NOT_FOUND);

        if (!room.data.message.match(pattern))
            throw new HttpException("Message is not valid", HttpStatus.NOT_FOUND);

        const dataChan = { roomName: room.data.destination, type: "PrivMsg", color: room.data.color };
        const chanSave = await this.channelRepository.save(dataChan);

        if (!chanSave)
            throw new HttpException("Element doesn't exist", HttpStatus.NOT_FOUND);

        const privMsgRoom = await this.getRoombyRoomName(chanSave.roomName);
        if (!privMsgRoom)
            throw new HttpException("Element doesn't exist", HttpStatus.NOT_FOUND);

        privMsgRoom.members.push(user);
        privMsgRoom.members.push(member);

        const MpRoom = await this.channelRepository.save(privMsgRoom);
        const connexion = new Date();

        for (let member of MpRoom.members) {
            const user = await this.userRepository.findOne({ where: { id: member.id } });
            if (!user)
                throw new HttpException("Element doesn't exist", HttpStatus.NOT_FOUND);

            await this.connectionRepository.save({ connectionTime: connexion, userId: user.id, roomId: MpRoom.id, connected: false });
        }
        return await this.createPrivMsgDto(currentUserId, privMsgRoom);
    }

    async getPublicsRooms(): Promise<Channel[]> {
        return await this.channelRepository.find({ where: { status: "Public" }, relations: ['members'] });
    }

    async getLastConnexion(currentUserId: number, roomName: string): Promise<Date> {
        const room = await this.getRoombyRoomName(roomName);
        if (!room)
            throw new HttpException("Element doesn't exist", HttpStatus.NOT_FOUND);

        if (room.members.map((e) => e.id).indexOf(currentUserId) === -1)
            throw new HttpException("Not authorized", HttpStatus.UNAUTHORIZED);

        const ret = await this.connectionRepository.findOne({ where: { roomId: room.id, userId: currentUserId } });
        if (!ret)
            throw new HttpException("Element doesn't exist", HttpStatus.NOT_FOUND);

        return ret.connectionTime;
    }

    async setConnexion(roomName: string, username: string, isConnected: boolean) {
        const room = await this.getRoombyRoomName(roomName);
        const user = await this.userService.findUserByUsername(username);
        const connexion = new Date();
        if (room) {
            if (isConnected === false) {
                let userConnexionTime = await this.connectionRepository.find({ where: { userId: user.id, roomId: room.id, connected: isConnected } });
                if (userConnexionTime !== null && userConnexionTime.length > 0) {
                    if (userConnexionTime.length > 1) {
                        for (const elem of userConnexionTime)
                            await this.connectionRepository.delete(elem);
                        const newConnextion = { userId: user.id, roomId: room.id, connected: isConnected, connectionTime: connexion };
                        await this.connectionRepository.save(newConnextion);
                    }

                }
                else {
                    const connexionTime = { userId: user.id, roomId: room.id, connectionTime: connexion, connected: isConnected };
                    await this.connectionRepository.save(connexionTime);
                }
            }
            else if (isConnected === true) {
                const userConnexionTime = await this.connectionRepository.find({ where: { userId: user.id, roomId: room.id, connected: isConnected } });
                if (userConnexionTime === null || userConnexionTime.length === 0) {
                    const connexionTime = { userId: user.id, roomId: room.id, connectionTime: connexion, connected: isConnected };
                    await this.connectionRepository.save(connexionTime);
                }
                else {
                    if (userConnexionTime.length > 1) {
                        for (const elem of userConnexionTime)
                            await this.connectionRepository.delete(elem);
                        const newConnextion = { userId: user.id, roomId: room.id, connected: isConnected, connectionTime: connexion };
                        await this.connectionRepository.save(newConnextion);
                    }
                }
                const lastDeco = await this.connectionRepository.findOne({ where: { userId: user.id, roomId: room.id, connected: false } });
                if (lastDeco !== null)
                    await this.connectionRepository.delete(lastDeco);
            }
        }
    }

    async isConnected(username: string, roomName: string): Promise<boolean> {
        const user: UserType = await this.userService.findUserByUsername(username);
        const room: Channel = await this.getRoombyRoomName(roomName);

        const isConnected = await this.connectionRepository.findOne({ where: { roomId: room.id, userId: user.id, connected: false } });
        return isConnected !== null ? false : true;
    }

    async getUsersWithoutPrivMsg(currentUserId: number): Promise<UserType[]> {
        const privMsgs: Channel[] = await this.channelRepository.find({ where: { type: "PrivMsg" }, relations: ['members'] });
        const users = await this.userService.getUsersUnblocked(currentUserId);

        if (!privMsgs || !users)
            throw new HttpException("Element doesn't exist", HttpStatus.NOT_FOUND);

        for (const room of privMsgs) {
            const posCurrentUser = room.members.map((e) => e.id).indexOf(currentUserId);
            if (posCurrentUser !== -1) {
                const posMember2 = posCurrentUser === 0 ? 1 : 0;
                const posUser = users.map((e) => e.id).indexOf(room.members[posMember2].id);
                if (posUser !== -1)
                    users.splice(posUser, 1);
            }
        }
        return users;
    }

    async setDisconnexion(currentUserId: number, roomName: string) {
        const room = await this.getRoombyRoomName(roomName);
        if (room !== null) {
            const connexion = await this.connectionRepository.find({ where: { userId: currentUserId, roomId: room.id, connected: false } })
            if (connexion.length === 0 || connexion === null) {
                const time = new Date();
                const disconnection = { userId: currentUserId, roomId: room.id, connectionTime: time, connected: false };
                await this.connectionRepository.save(disconnection);
            }
        }
    }

    async leaveRooms(currentUserId: number) {
        const rooms = await this.getRoomsByUserId(currentUserId);
        if (rooms !== null) {
            for (const room of rooms) {
                await this.setDisconnexion(currentUserId, room.roomName);
            }
        }
    }

    async muteUser(roomId: number, currentUserId: number) {
        const elem = await this.muteRepository.findOne({ where: { userId: currentUserId, roomId: roomId } });
        const room = await this.channelRepository.findOne({ where: { id: roomId } });

        if (room !== null && elem === null && this.isAdmin(currentUserId, room.roomName))
            await this.muteRepository.save({ userId: currentUserId, roomId: roomId });
    }

    async unmuteUser(roomId: number, currentUserId: number) {
        const elems = await this.muteRepository.find({ where: { userId: currentUserId } });
        const room = await this.channelRepository.findOne({ where: { id: roomId } });

        if (elems !== null && room !== null && this.isAdmin(currentUserId, room.roomName)) {
            for (const elem of elems) {
                await this.muteRepository.delete(elem);
            }
        }
    }

    async isMember(currentUserId: number, roomName: string): Promise<boolean> {
        const room = await this.getRoombyRoomName(roomName);
        if (room) {
            const pos = room.members.map((e) => e.id).indexOf(currentUserId);
            if (pos !== -1)
                return true;
        }
        return false;
    }

    async isAdmin(currentUserId: number, roomName: string): Promise<boolean> {
        const room = await this.getRoombyRoomName(roomName);
        if (room) {
            const pos = room.admins.map((e) => e.id).indexOf(currentUserId);
            if (pos !== -1)
                return true;
        }
        return false;
    }

    async isInvited(currentUserId: number, roomName: string): Promise<boolean> {
        const room = await this.getRoombyRoomName(roomName);
        if (room) {
            const pos = room.usersInvited.map((e) => e.id).indexOf(currentUserId);
            if (pos !== -1)
                return true;
        }
        return false;
    }

    async isOwner(currentUserId: number, roomName: string): Promise<boolean> {
        const room = await this.getRoombyRoomName(roomName);
        if (room) {
            if (room.owner.id === currentUserId)
                return true;
        }
        return false;
    }

    async hasBlocked(currentUserId: number, userBlockedId: number): Promise<boolean> {
        const user = await this.userService.findUserByid(currentUserId);
        if (user) {
            const pos = user.usersBlocked.map((e) => e.id).indexOf(userBlockedId);
            if (pos !== -1)
                return true;
        }
        return false;
    }

}

