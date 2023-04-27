import { Controller } from '@nestjs/common'
import { UserService } from './user.service'
import { Post, Body, Get, Put, UseGuards, UsePipes, UseFilters, ValidationPipe, Patch, Request, Res, Req, Param } from '@nestjs/common'
import { UserEntity } from './Entities/user.entity'
import { UserType } from './user.type'
import { LoginUserDto } from './Dto/loginUser.dto'
import { UserResponseInterface } from './Interfaces/userResponse.interface'
import { CreateUserDto } from './Dto/createUser.dto'
import { DUser } from "./Decorator/user.decorator"
import { AuthGuard } from "./guards/auth.guards"
import { UpdateUserDto } from "./Dto/updateUser.dto"
import { UserDto } from './Dto/User.dto'
import { FortyTwoAuthGuard } from './42auth.guard'
import { v4 as uuidv4 } from 'uuid';

@Controller('user')
export class UserController {
	constructor(private userService: UserService) { }

	@Get("/42")
	@UseGuards(FortyTwoAuthGuard)
	fortyTwoLogin() {

	}

	@Get("/cookieToToken/:username/:jwt")
	async currentUserfromcookie(@Param('username') username: string, @Param('jwt') jwt: string): Promise<any> {
		const user = await this.userService.getUserByUsername(username)
			return this.userService.buildUserResponse(user);
	}

	@Get("42/callback")
	@UseGuards(FortyTwoAuthGuard)
	async fortyTwoLoginCallback(@Request() req: any, @Res() res: any) {
		let user;
		try{

				user = await this.userService.findOrCreateUser({
				email: req.user.email,
				username: req.user.username,
				avatar: req.user.picture,
				password: uuidv4(), // Génère un mot de passe aléatoire pour l'utilisateur
			});
			delete user.password;
			const newuser = await this.userService.getUserByUsername(user.username)
			const jwt = this.userService.generateJwt42(user);
			res.cookie("jwt", jwt, { httpOnly: false });
			res.cookie("usercookie", user.username, { httpOnly: false });
			res.redirect(process.env.FORTY_TWO_REDIRECT_URI);
			return (user)
		}
		catch (error)
		{
			res.cookie("status", "422", { httpOnly: false });
			res.redirect(process.env.FORTY_TWO_REDIRECT_URI);
			return (user);
		}

	}


	@Get()
	@UseGuards(AuthGuard)
	async GetUsers(@DUser('id') currentUserId: number): Promise<UserType[]> {
		const users = await this.userService.getUsers(currentUserId)
		return users
	};



	@Get('/usersUnblocked')
	@UseGuards(AuthGuard)
	async GetUsersUnbloked(@DUser("id") currentUserId: number): Promise<UserType[]> {
		return await this.userService.getUsersUnblocked(currentUserId);
	}

	@Get('/usersBlocked')
	@UseGuards(AuthGuard)
	async GetUsersBloked(@DUser("id") currentUserId: number): Promise<UserDto[]> {
		return await this.userService.getUsersBlocked(currentUserId);
	}

	@Patch('/blockUser/:username')
	@UseGuards(AuthGuard)
	async blockSomeone(@DUser("id") currentUserId: number, @Param("username") userBlocked: string) {
		return await this.userService.blockUser(currentUserId, userBlocked);
	}

	@Patch('/unblockUser/:username')
	@UseGuards(AuthGuard)
	async unblockSomeone(@DUser("id") currentUserId: number, @Param("username") userBlocked: string) {
		return await this.userService.unblockUser(currentUserId, userBlocked);
	}


	@Get('user')
	@UseGuards(AuthGuard)
	async currentUser(@DUser() user: UserEntity): Promise<UserResponseInterface> {
		return this.userService.buildUserResponse(user);
	}

	@Post('token')
	async sendToken(@Body() credentials: any): Promise<UserResponseInterface> {
		const credentialsDTO = new LoginUserDto;
		credentialsDTO.username = credentials.username;
		credentialsDTO.password = credentials.password;

		const user = await this.userService.login(credentialsDTO);
		return this.userService.buildUserResponse(user);
	}


	@Post('signup')
	@UsePipes(new ValidationPipe())
	async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseInterface> {
		const user = await this.userService.createUser(createUserDto);
		delete user.password
		const ret = this.userService.buildUserResponse(user);
		return ret;
	}

	@Put('first')
	@UseGuards(AuthGuard)
	@UsePipes(new ValidationPipe())
	async updateFisrtConnect(
		@DUser('id') currentUserId: number,)
		: Promise<UserResponseInterface> {

		const user = await this.userService.updateFisrtConnect(currentUserId)
		delete user.password
		return this.userService.buildUserResponse(user);
	}

	@Put('user')
	@UseGuards(AuthGuard)
	@UsePipes(new ValidationPipe())
	async updateCurrentUser(
		@DUser('id') currentUserId: number,
		@Body('user') UpdateUserDto: UpdateUserDto)
		: Promise<UserResponseInterface> {
		const user = await this.userService.updateUser(currentUserId, UpdateUserDto)
		delete user.password
		return this.userService.buildUserResponse(user);
	}


	@Get('generateQRCode/:username')
	async generateQRCode(@Param("username") currentUsername: string) {
		const ret = await this.userService.generateQRCode(currentUsername);
		return ret;
	}

	@Get('check2FA/:username')
	async check2FA(@Param("username") currentUsername: string) {
		return await this.userService.check2FA(currentUsername);
	}

	@Get('verifyCode/:username/:code')
	async verifyCode(@Param("username") username: string, @Param("code") code: string) {
		return await this.userService.verifyCode(username, code);
	}
}

