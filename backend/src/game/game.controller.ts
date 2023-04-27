import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { GameService } from './game.service';
import { AuthGuard } from "../user/guards/auth.guards"

@Controller('Play')
export class GameController {
	constructor(private readonly gameService: GameService) { }

	@Get("getOnGoingGame")
    @UseGuards(AuthGuard)
	async getOnGoingGame() {
		let games = await this.gameService.get_ongoing_games();
		return (games)
	}
	@Get('allUsers')
	@UseGuards(AuthGuard)
	async getAllUsers()
	{
		let users = await this.gameService.getAllUsers();
		return users
	}
	
	@Get("historyMatch/:user_id")
    @UseGuards(AuthGuard)
	async getOnePlayerGames(@Param("user_id") user_id: number)
	{
		let games = await this.gameService.get_Games_by_Player(user_id);
		return (games)
	}

	@Get("InviteMatch/:user_id")
    @UseGuards(AuthGuard)
	async getInvited(@Param("user_id") user_id: number)
	{
		let games = await this.gameService.get_pending_games(user_id);
		return (games)
	}
	
	@Get(':id')
    @UseGuards(AuthGuard)
	async getGameById(@Param('id') id: number)
	{
		let games = await this.gameService.get_game_by_id(id);
		return (games)
	}

}