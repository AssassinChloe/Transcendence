import { Injectable, HttpException, HttpStatus, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Not } from 'typeorm'
import { UserEntity } from './Entities/user.entity'
import { UserType } from './user.type';
import { UserResponseInterface } from './Interfaces/userResponse.interface'
import { sign } from 'jsonwebtoken';
import { jwtConstants } from '../user/constants';
import { LoginUserDto } from './Dto/loginUser.dto';
import * as bcrypt from 'bcrypt';
import { createUserDto } from './Entities/createUser.dto';
import { UpdateUserDto } from './Dto/updateUser.dto';
import { Channel } from '../chat/Entities/channel.entity';
import { ChatService } from '../chat/chat.service';
import { UserDto } from './Dto/User.dto';
import { authenticator } from 'otplib';
import { toDataURL } from "qrcode";
import { JwtService } from "@nestjs/jwt";
import axios from 'axios'
import { CreateUserDto } from './Dto/createUser.dto';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
        @InjectRepository(Channel) private channelRepository: Repository<Channel>,
        @Inject(forwardRef(() => ChatService)) private chatService: ChatService,
        private jwtService: JwtService
    ) { }


    async getUsers(currentUserId: number): Promise<UserType[]> {
        const users = await this.userRepository.find({
            where: { id: Not(currentUserId) },
            select: ['id', 'username', 'email', 'InGame', 'Connected', 'avatar', 'NbGamesWon', 'NbGamesLost', 'NbGamesPlayed', 'Score', 'Enable2FA', 'game_id'],
        });
        return users

    }

    async getUsersUnblocked(currentUserId: number): Promise<UserType[]> {
        const users = await this.userRepository.find();
        const currentUser = await this.findUserByid(currentUserId);

        if (!users || !currentUser)
            throw new HttpException('Elememt does not exist', HttpStatus.NOT_FOUND);

        if (currentUser.usersBlocked == null)
            currentUser.usersBlocked = [];
        else {
            for (const elem of currentUser.usersBlocked) {
                const pos = users.map((e) => e.id).indexOf(elem.id);
                if (pos !== -1)
                    users.splice(pos, 1);
            }
        }

        for (const user of users) {
            if (!user.usersBlocked || user.usersBlocked === undefined)
                user.usersBlocked = [];
            else {
                const elem = await this.getUserByUsername(user.username);
                if (elem.usersBlocked.map((e) => e.id).indexOf(currentUserId) !== -1) {
                    const pos = users.map((e) => e.id).indexOf(user.id);
                    if (pos !== -1)
                        users.splice(pos, 1);
                }
            }
        }
        return users;
    }

    async getUsersBlocked(currentUserId: number): Promise<UserDto[]> {
        const users = await this.getUsers(currentUserId);
        const currentUser = await this.findUserByid(currentUserId);
        const usersBlocked: UserDto[] = [];

        if (!users || !currentUser)
            throw new HttpException('Elememt does not exist', HttpStatus.NOT_FOUND);

        for (const elem of currentUser.usersBlocked) {
            const pos = users.map((e) => e.id).indexOf(elem.id);
            if (pos !== -1)
                usersBlocked.push({ id: elem.id, username: elem.username });
        }

        for (const user of users) {
            const pos = user.usersBlocked.map((e) => e.id).indexOf(currentUserId);
            if (pos !== -1)
                usersBlocked.push({ id: user.id, username: user.username });
        }
        return usersBlocked;
    }

    async blockUser(currentUserId: number, userToBlocked: string) {
        const user = await this.findUserByid(currentUserId);
        const userBlocked = await this.findUserByUsername(userToBlocked);

        if (!user || !userBlocked)
            throw new HttpException('Elememt does not exist', HttpStatus.NOT_FOUND);
        if (user.usersBlocked == null)
            user.usersBlocked = [];
        if (user.usersBlocked.map((e) => e.id).indexOf(userBlocked.id) === -1) {
            user.usersBlocked.push(userBlocked);
            await this.userRepository.save(user);
        }
    }

    async unblockUser(currentUserId: number, userToBlocked: string) {
        const user = await this.findUserByid(currentUserId);
        const userBlocked = await this.findUserByUsername(userToBlocked);
        if (!user || !userBlocked)
            throw new HttpException('Elememt does not exist', HttpStatus.NOT_FOUND);

        if (user.usersBlocked !== null) {
            const pos = user.usersBlocked.map((e) => e.id).indexOf(userBlocked.id);
            if (pos !== -1) {
                user.usersBlocked.splice(pos, 1);
                await this.userRepository.save(user);
            }
        }
    }

    async getUserByUsername(username: string): Promise<UserType> {
        return await this.userRepository.findOne({
            where: { username: username },
            select: ['id', 'username', 'loginname', 'email', 'bio', 'avatar', 'NbGamesWon', 'NbGamesLost', 'NbGamesPlayed', 'Score', 'Enable2FA', 'Valid2FA', 'usersBlocked', 'firstConnect', 'game_id'],
        });
    }

    async getUserByLoginname(loginname: string): Promise<UserType> {
        return await this.userRepository.findOne({
            where: { loginname: loginname },
            select: ['id', 'username', 'loginname', 'email', 'bio', 'avatar', 'NbGamesWon', 'NbGamesLost', 'NbGamesPlayed', 'Score', 'Enable2FA', 'Valid2FA', 'usersBlocked', 'firstConnect', 'game_id'],
        });
    }

    async getUserByJwt(jwt: string): Promise<UserType> {
        return await this.userRepository.findOne({
            where: { jwt: jwt },
            select: ['id', 'username', 'email', 'loginname', 'bio', 'avatar', 'NbGamesWon', 'NbGamesLost', 'NbGamesPlayed', 'Score', 'Enable2FA', 'Valid2FA', 'usersBlocked', 'firstConnect'],
        });
    }


    generateJwt(user: UserType): string {
        return sign({ id: user.id, username: user.username }, jwtConstants.secret);
    }

    generateJwt42(user: UserType): string {
        const payload = { email: user.email, sub: user.id };
        return this.jwtService.sign(payload, { secret: process.env.JWT_SECRET, });
    }

    async createUser(createUserDto: createUserDto): Promise<UserEntity> {

        createUserDto.username = createUserDto.username.toLocaleLowerCase();
        const userByName = await this.userRepository.findOne({ where: { username: createUserDto.username } })
        const userByLogin = await this.userRepository.findOne({ where: { loginname: createUserDto.username } })
        const userByEmail = await this.userRepository.findOne({ where: { email: createUserDto.email } })

        if (userByName || userByLogin || userByEmail) {
            throw new HttpException("Login or email is already used", HttpStatus.UNPROCESSABLE_ENTITY);
        }
        const salt = await bcrypt.genSalt(10);
        createUserDto.password = await bcrypt.hash(createUserDto.password, salt);

        const newUser = await this.userRepository.save(createUserDto);
        newUser.usersBlocked = [];
        newUser.loginname = newUser.username;
        await this.userRepository.save(newUser);
        const publicsRooms: Channel[] = await this.chatService.getPublicsRooms();
        const privateRooms: Channel[] = await this.channelRepository.find({ where: { status: "Protected" }, relations: ['members'] });

        createUserDto.jwt = await this.generateJwt42(newUser);
        await this.userRepository.save(newUser);


        for (const room of publicsRooms) {
            await room.members.push(newUser);
            await this.channelRepository.save(room);
        }

        for (const room of privateRooms) {
            if (room.members !== undefined && room.members !== null) {
                await room.members.push(newUser);
                await this.channelRepository.save(room);
            }
        }

        return newUser;
    }

    async login(LoginUserDto: LoginUserDto): Promise<UserEntity> {
        LoginUserDto.username = LoginUserDto.username.toLocaleLowerCase();
        const user2 = await this.userRepository.findOne({
            where: { username: LoginUserDto.username },
            select: ['id', 'username', 'loginname', 'password', 'email', 'bio', 'avatar', 'NbGamesWon', 'NbGamesLost', 'NbGamesPlayed', 'Score', 'Enable2FA', 'Valid2FA', 'firstConnect', 'usersBlocked', 'game_id', 'secret2FA'],
        })

        const user = await this.userRepository.findOne({
            where: { loginname: LoginUserDto.username },
            select: ['id', 'username', 'loginname', 'password', 'email', 'bio', 'avatar', 'NbGamesWon', 'NbGamesLost', 'NbGamesPlayed', 'Score', 'Enable2FA', 'Valid2FA', 'firstConnect', 'usersBlocked', 'game_id', 'secret2FA'],
        })

        if (!user)
            throw new HttpException("LOGIN errone", HttpStatus.UNPROCESSABLE_ENTITY);

        const passwordIsCorrect = await bcrypt.compare(LoginUserDto.password, user.password);

        if (!passwordIsCorrect)
            throw new HttpException("PASSWORD errone", HttpStatus.UNPROCESSABLE_ENTITY);

        delete user.password;
        return user;
    }

    async getUserInfoFrom42API(accessToken: string): Promise<any> {
        const response = await axios.get(process.env.FORTY_TWO_API_URL + "/v2/me", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return response.data;
    }

    async findOrCreateUser(data): Promise<UserEntity> {
        const existingUser = await this.userRepository.findOne({ where: { email: data.email, loginname: data.username, isFortyTwo: true } });
        if (existingUser) {
            return existingUser;
        }

        const checkByMail = await this.userRepository.findOne({ where: { email: data.email } });
        const checkByUsername = await this.userRepository.findOne({ where: { username: data.username } });
        const checkByLoginname = await this.userRepository.findOne({ where: { loginname: data.username } });
        if (checkByMail || checkByUsername || checkByLoginname) {
            throw new HttpException("Username or email is already used.", HttpStatus.UNPROCESSABLE_ENTITY);
        }
        else {
            let user: CreateUserDto;
            user = { username: data.username, password: data.password, email: data.email, avatar: data.avatar, Enable2FA: data.Enable2FA, jwt: null, isFortyTwo: true }

            const newUser = await this.userRepository.create(user);
            newUser.usersBlocked = [];
            newUser.loginname = newUser.username;
            await this.userRepository.save(newUser);

            const publicsRooms: Channel[] = await this.chatService.getPublicsRooms();
            const privateRooms: Channel[] = await this.channelRepository.find({ where: { status: "Protected" }, relations: ['members'] });
            for (const room of publicsRooms) {
                await room.members.push(newUser);
                await this.channelRepository.save(room);
            }

            for (const room of privateRooms) {
                if (room.members !== undefined && room.members !== null) {
                    await room.members.push(newUser);
                    await this.channelRepository.save(room);
                }
            }
            return newUser;
        }
    }


    async findUserByid(id: number): Promise<UserType> {
        return await this.userRepository.findOne({ where: { id: id } });
    }

    async findUserByUsername(username: string): Promise<UserType> {
        return await this.userRepository.findOne({ where: { username: username } });
    }

    async findUserByLoginname(loginname: string): Promise<UserType> {
        return await this.userRepository.findOne({ where: { loginname: loginname } });
    }


    async updateUser(userId: number, UpdateUserDto: UpdateUserDto): Promise<UserEntity> {
        const user = await this.findUserByid(userId);

        UpdateUserDto.username = UpdateUserDto.username.toLocaleLowerCase();
        const existingUser = await this.userRepository.findOne({
            where: { username: UpdateUserDto.username },
            select: ['id', 'username', 'email', 'bio', 'avatar', 'NbGamesWon', 'NbGamesLost', 'NbGamesPlayed', 'Score', 'Enable2FA', 'Valid2FA', 'firstConnect'],
        })

        const allmostExistingUser = await this.userRepository.findOne({
            where: { loginname: UpdateUserDto.username },
            select: ['id', 'username', 'email', 'bio', 'avatar', 'NbGamesWon', 'NbGamesLost', 'NbGamesPlayed', 'Score', 'Enable2FA', 'Valid2FA', 'firstConnect'],
        })

        if (existingUser && (existingUser.id != user.id))
            throw new HttpException("USERNAME already in use", HttpStatus.UNPROCESSABLE_ENTITY);

        if (allmostExistingUser && (allmostExistingUser.id != user.id))
            throw new HttpException("USERNAME already in use", HttpStatus.UNPROCESSABLE_ENTITY);

        Object.assign(user, UpdateUserDto);
        return await this.userRepository.save(user);
    }

    async updateFisrtConnect(userId: number): Promise<UserEntity> {
        const user = await this.findUserByid(userId);
        user.firstConnect = false;
        return await this.userRepository.save(user);
    }

    buildUserResponse(user: UserType): UserResponseInterface {
        return { user: { ...user, token: this.generateJwt(user), }, }
    }

    async generateQRCode(currentUsername: string) {
        const user = await this.userRepository.findOne({ where: { username: currentUsername } });
        const secret = await authenticator.generateSecret();
        user.secret2FA = secret;
        await this.userRepository.save(user);
        const totpUrl = `otpauth://totp/Transcendence:${currentUsername}?secret=${secret}&issuer=NorminetTeam`
        const qrcode = await toDataURL(totpUrl);
        return { qrcode };

    }

    async check2FA(currentUsername: string): Promise<boolean> {
        const user = await this.findUserByUsername(currentUsername);
        return true;
    }

    async verifyCode(username: string, code: string) {
        const user = await this.userRepository.findOne({ where: { username: username } });
        const isValid = await authenticator.verify({ secret: user.secret2FA, token: code });
        return isValid;
    }

}
