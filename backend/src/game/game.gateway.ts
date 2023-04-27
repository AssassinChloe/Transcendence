import { WebSocketGateway, SubscribeMessage, WebSocketServer } from '@nestjs/websockets';
import { GameService } from './game.service';
import { Server, Socket } from 'socket.io';
import { UserEntity } from 'src/user/Entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatGateway } from 'src/chat/socketEvents';

@WebSocketGateway(5001, { cors: `*` })

export class GameGateway {
	constructor(private readonly gameService: GameService, private chatGateway: ChatGateway,
		@InjectRepository(UserEntity) private usersRepository: Repository<UserEntity>,) { }
	private j = 0;
	@WebSocketServer()
	server: Server;

	@SubscribeMessage('init_game')
	async add_matchmaking_list(socket: Socket, data) {
		if (socket.handshake.auth.token)
		{
			let ret = await this.gameService.set_matchmaking(data)
			if (ret >= 2) {
				let game = await this.gameService.create_game(data.style);
				let users = await this.chatGateway.getUsers();
				if (users)
				{
					if (users.get(game.player1.id))
					users.get(game.player1.id).forEach(element => { element.join(game.id.toString()) });
					if (users.get(game.player2.id))
					users.get(game.player2.id).forEach(element => { element.join(game.id.toString()) });
				}
				this.server.emit('game_on', JSON.stringify(game));
			}
		}
	}

	@SubscribeMessage('ready')
	ready(socket: Socket, data) {
		if (socket.handshake.auth.token)
		{
			this.gameService.shake_start(socket, data, this.server);
		}
	}

	@SubscribeMessage('game_update')
	async update_game(socket: Socket, data) {
		if (socket.handshake.auth.token)
		{
			await this.gameService.update(data, socket, this.server);
		}
	}

	@SubscribeMessage('watch')
	async join_room(socket, data) {
		if (socket.handshake.auth.token)
		{
			let game = await this.gameService.get_game(data.id);
			if (game === null || game.status === "finished" || game.status === "canceled" || game.status === "declined") {
				socket.join("notfound");
				this.server.to("notfound").emit("notfound");
			}
			else {
				socket.join(data.id.toString());
				await this.gameService.watcher(data, this.server);
			}
		}
	}

	@SubscribeMessage('game_paused')
	async paused_game(socket, data) {
		if (socket.handshake.auth.token)
		{
			this.gameService.update_timer(data.id);
			this.server.to(data.id.toString()).emit('paused_game');
		}
	}

	@SubscribeMessage('init_custom_game')
	async init_custom_game(socket, data) {
		if (socket.handshake.auth.token)
		{
			let game = await this.gameService.create_custom_game(data.style, socket.handshake.auth.token);
			let users = await this.chatGateway.getUsers();
			if (users)
			{
				if (users.get(game.player1.id))
					users.get(game.player1.id).forEach(element => { element.join(game.id.toString()) });
				if (users.get(game.player2.id))
					users.get(game.player2.id).forEach(element => { element.join(game.id.toString()) });
			}
			this.server.to(game.id.toString()).emit('invitation', JSON.stringify(game));
	}
	}

	@SubscribeMessage('player_join_game')
	async player_join_game(socket, data) {
		if (socket.handshake.auth.token)
		{
			let users = await this.chatGateway.getUsers();
			if (users)
				users.get(socket.handshake.auth.token).forEach(element => { element.join(data.game.id) });
			await this.usersRepository.update(socket.handshake.auth.token, { InGame: true, game_id: data.game.id });
			this.server.to(data.game.id).emit('launch_game', data.game);
		}
	}

	@SubscribeMessage('player_refuse_game')
	async declined_game_handle(socket, data) {
		if (socket.handshake.auth.token)
		{
			this.gameService.uGameStatus(data.game.id, "declined");
			this.server.emit("declined", JSON.stringify({game:data.game, decliner:socket.handshake.auth.token}));
		}
	}

	async handle_deconnexion_end(deconnected_user) {
		await this.gameService.endGame(deconnected_user, this.server);
	}

	async clean_games_list(user_id)
	{
		await this.gameService.cleanGamesList(user_id, this.server);
	}
}
