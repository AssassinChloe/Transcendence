import { Injectable } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from './Entities/game.entity'
import { UserEntity } from 'src/user/Entities/user.entity';
import Player from './interface/player';
import Ball from './interface/ball';

@Injectable()
export class GameService {
	constructor(
		@InjectRepository(Game) private gamesRepository: Repository<Game>,
		@InjectRepository(UserEntity) private usersRepository: Repository<UserEntity>) { }
	private games = new Map<number, Game>();
	private balls = new Map<number, Ball>();
	private matchmaking_list = new Array<UserEntity>();
	private players = new Map<number, Player[]>();
	private WIDTH = 800;
	private HEIGHT = 440;
	private PLAYER_W = this.WIDTH / 80;
	private PLAYER_H = this.HEIGHT / 5;
	private BALL_RAD = this.WIDTH / 80;

	async createGame(game: CreateGameDto): Promise<Game> {

		return await (this.gamesRepository.save(game));
	}

	async set_matchmaking(data) {
		let user = await this.usersRepository.findOne({where: {id: +data.text}}) 
		let allreadyinqueue = false
		if (user) {
			this.matchmaking_list.forEach(element => {
				if (element.id === user.id)
					allreadyinqueue = true
			})
			if (allreadyinqueue === false)
				this.matchmaking_list.push(user);
		}
		return (this.matchmaking_list.length);
	}

	async create_game(style) {
		let game = new CreateGameDto();
		game.status = "pending";
		game.type = "default";
		game.player1 = this.matchmaking_list.shift();
		game.player1_score = 0;
		game.player2 = this.matchmaking_list.shift();
		game.player2_score = 0;
		return (await this.set_maps(game, style));
	}

	async set_maps(game, style) {
		let player = new Array<Player>();
		let ball: Ball;
		let n_game = await this.createGame(game);
		ball = {
			radius: this.BALL_RAD,
			x: this.WIDTH / 2,
			y: this.HEIGHT / 2,
			speed_x: 5, speed_y: 0,
			speed_max: 30,
			primary: style.primary,
			secondary: style.secondary,
			background: style.background,
			start: 0,
			duration: style.duration,
			norminet: style.norminet
		};
		this.balls.set(n_game.id, ball);
		this.games.set(n_game.id, n_game);
		player.push({ username: n_game.player1.username, x: 0, y: this.HEIGHT / 2, score: 0 });
		player.push({ username: n_game.player2.username, x: this.WIDTH - this.PLAYER_W, y: this.HEIGHT / 2, score: 0 });
		this.players.set(n_game.id, player);
		this.clear_player_data(n_game.player1)
		this.clear_player_data(n_game.player2)
		return (n_game);
	}

	async create_custom_game(style, player1) {
		let game = new CreateGameDto();
		game.status = "pending";
		game.type = "custom";
		game.player1 = await this.usersRepository.findOne({ where: { id: player1 }});
		game.player1_score = 0;
		game.player2 = await this.usersRepository.findOne({ where: { id: style.player2 }});
		game.player2_score = 0;

		return await this.set_maps(game, style)
	}


	async shake_start(socket, data, server) {
		let db_game = await this.gamesRepository.findOne({ where: { id: data.id }, relations: ['player1', 'player2'] })
		let game = await this.get_game(data.id);
		let ball = this.balls.get(data.id);
		let players = this.players.get(data.id);
		socket.join(game.id.toString());
		if (game.status === "pending" && (+socket.handshake.auth.token === db_game.player1.id
			|| +socket.handshake.auth.token === db_game.player2.id)) 
		{
			if (+socket.handshake.auth.token === db_game.player1.id)
				game = await this.uGameStatus(game.id, "player1");
			else
				game = await this.uGameStatus(game.id, "player2");

		}
		else if ((+socket.handshake.auth.token === db_game.player1.id && game.status === "player2")
			 || (+socket.handshake.auth.token === db_game.player2.id && game.status === "player1"))
		{
			game = await this.uGameStatus(game.id, "full");
			ball.start = Date.now();
			server.to(data.id.toString()).emit('both_ready', { id: data.id, status: "full", players: players, ball: ball });
		}
	}

	async get_game(id): Promise<Game> {
		let game = await this.gamesRepository.findOne({ where: { id: +id }, relations: ['player1', 'player2'] });
		if (!game)
			return (game);
		this.clear_player_data(game.player1)
		this.clear_player_data(game.player2)
		return (game);
	}

	async watcher(data, server) {
		let ball = this.balls.get(+data.id);
		let game = await this.gamesRepository.findOne({ where: { id: +data.id }, relations: ['player1', 'player2'] });
		if (!game)
			return;
		this.clear_player_data(game.player1)
		this.clear_player_data(game.player2)
		await server.to(data.id.toString()).emit('game_watched', { game: game, ball: ball });
	}

	async get_ongoing_games(): Promise<Game[]> {
		let games = await this.gamesRepository.find({ where: { status: "full" }, relations: ['player1', 'player2'] });
		games.forEach(element => {
				this.clear_player_data(element.player1)
				this.clear_player_data(element.player2)
			});
		return (games);
	}

	async update(data, socket, server) {
		let status = "full";
		socket.join(data.id);
		let players = this.players.get(+data.id);
		let ball = this.balls.get(+data.id);
		let game = await this.gamesRepository.findOne({ where: { id: data.id }, relations: ['player1', 'player2'] });
		if (game.status === "finished")
			return;
		if (data.text === "stop") {
			status = "finished"

			if (game.status === status)
				return;
			await this.gamesRepository.update(data.id, { status: 'finished', player1_score: players[0].score, player2_score: players[1].score });
			if (players[0].score > players[1].score) {
				await this.usersRepository.update(game.player1.id, { NbGamesPlayed: (game.player1.NbGamesPlayed += 1), NbGamesWon: (game.player1.NbGamesWon += 1), Score: (game.player1.Score += 2), InGame: false, game_id: 0 })
				await this.usersRepository.update(game.player2.id, { NbGamesPlayed: (game.player2.NbGamesPlayed += 1), NbGamesLost: (game.player2.NbGamesLost += 1), InGame: false, game_id: 0 })
			}
			else if (players[0].score < players[1].score) {
				await this.usersRepository.update(game.player1.id, { NbGamesPlayed: (game.player1.NbGamesPlayed += 1), NbGamesLost: (game.player1.NbGamesLost += 1), InGame: false, game_id: 0 })
				await this.usersRepository.update(game.player2.id, { NbGamesPlayed: (game.player2.NbGamesPlayed += 1), NbGamesWon: (game.player2.NbGamesWon += 1), Score: (game.player2.Score += 2), InGame: false, game_id: 0 })
			}
			else {
				await this.usersRepository.update(game.player1.id, { NbGamesPlayed: (game.player1.NbGamesPlayed += 1), Score: (game.player1.Score += 1), InGame: false, game_id: 0 })
				await this.usersRepository.update(game.player2.id, { NbGamesPlayed: (game.player2.NbGamesPlayed += 1), Score: (game.player2.Score += 1), InGame: false, game_id: 0 })
			}
			const rooms = server.of(data.id.toString()).adapter.rooms;
			rooms.forEach(element => { element.leave(data.id.toString()) });
		}
		else if (data.text === "ball_move") {
			ball.x = ball.x + ball.speed_x;
			ball.y = ball.y + ball.speed_y;
			if (ball.y > this.HEIGHT || ball.y < 0) {
				ball.speed_y *= -1;
			}
			else if (ball.x > (this.WIDTH - this.PLAYER_W)) {
				let ret = await this.collide(players[0], players[1], ball);
				ball = ret.ball;
				players[0] = ret.player;
			}
			else if (ball.x < this.PLAYER_W) {
				let ret = await this.collide(players[1], players[0], ball);
				ball = ret.ball;
				players[1] = ret.player;
			}
			else if (ball.norminet === true && ((ball.start - Date.now()) % 5) === 0 && ball.x >= this.WIDTH / 2 - 20 && ball.y >= this.HEIGHT / 2 - 20 && ball.x <= this.WIDTH / 2 + 20 && ball.y <= this.HEIGHT / 2 + 20) {
				ball.speed_y *= -1.8
				ball.speed_x *= -1.3;
			}
		}
		else if (data.text === "move_up") {
			let player_id = socket.handshake.auth.token;

			if (player_id === game.player1.id && players[0].y >= 0)
				players[0].y -= Math.abs(ball.speed_x);
			else if (player_id === game.player2.id && players[1].y >= 0)
				players[1].y -= Math.abs(ball.speed_x);
		}
		else if (data.text === "move_down") {
			let player_id = socket.handshake.auth.token;
			if (player_id === game.player1.id && players[0].y <= (this.HEIGHT - this.PLAYER_H))
				players[0].y += Math.abs(ball.speed_x);
			else if (player_id === game.player2.id && players[1].y <= (this.HEIGHT - this.PLAYER_H))
				players[1].y += Math.abs(ball.speed_x);

		}
		this.clear_player_data(game.player1)
		this.clear_player_data(game.player2)
		server.volatile.to(data.id.toString()).emit('updated_game', { id: data.id, status: status, game: game, players: players, ball: ball });
		if (status === 'finished') {
			this.games.delete(data.id);
			this.balls.delete(data.id);
			this.players.delete(data.id);
		}
	}

	update_timer(id) {
		let ball = this.balls.get(+id);
		let newduration = ball.duration - ((Date.now() - ball.start) / 1000);
		ball.duration = newduration;
		ball.start = Date.now();
	}

	async collide(player: Player, defense: Player, ball: Ball) {
		// The player does not hit the ball
		if (ball.y < (defense.y - this.BALL_RAD) || ball.y > (defense.y + this.BALL_RAD + this.PLAYER_H)) {
			player.score += 1;
			ball.x = this.WIDTH / 2;
			ball.y = this.HEIGHT / 2;
			ball.speed_y = 0;
			if (defense.x === 0)
				ball.speed_x = -3;
			else
				ball.speed_x = 3;
		}
		else {
			ball.speed_x *= -1;
			var impact = ball.y - defense.y - this.PLAYER_H / 2;
			// Get a value between 0 and 10
			ball.speed_y = Math.round(impact * 0.2);
			// Increase speed if it has not reached max speed
			if (Math.abs(ball.speed_x) < ball.speed_max) {
				if (ball.speed_x < 0)
					ball.speed_x -= 1;
				else
					ball.speed_x += 1;
			}
		}
		return ({ ball: ball, player: player });
	}

	async uGameStatus(id, new_status) {
		await this.gamesRepository.update(+id, { status: new_status });
		let game = await this.gamesRepository.findOne({ where: { id: +id }, relations: ['player1', 'player2'] });
		if (!game)
			return (game);
		this.clear_player_data(game.player2)
		this.clear_player_data(game.player1)
		return (game);
	}

	async get_Games_by_Player(user_id: number) {
		let games_finished = await this.gamesRepository.find({ where: { status: "finished" }, relations: ['player1', 'player2'] });
		let games = new Array<Game>();
		games_finished.forEach(element => {
			if (element.player1.id === +user_id || element.player2.id === +user_id)
			{
				this.clear_player_data(element.player1)
				this.clear_player_data(element.player2)
				games.push(element)
			}
		});
		return (games)
	}

	async get_pending_games(user_id) {
		let games_pending = await this.gamesRepository.find({ where: {status: "pending"}, relations: ['player1', 'player2'] });
		let games = new Array<Game>();
		games_pending.forEach(element => {
		if (element.player2.id === +user_id || element.player1.id === +user_id)
		{
			this.clear_player_data(element.player1)
			this.clear_player_data(element.player2)
			games.push(element)
		}});
		let games_p1 = await this.gamesRepository.find({ where: {status: "player1"}, relations: ['player1', 'player2'] });
		games_p1.forEach(element => {
		if (element.player2.id === +user_id || element.player1.id === +user_id)
		{
			this.clear_player_data(element.player1)
			this.clear_player_data(element.player2)
			games.push(element)
		}});
		let games_p2 = await this.gamesRepository.find({ where: {status: "player2"}, relations: ['player1', 'player2'] });
		games_p2.forEach(element => {
		if (element.player2.id === +user_id || element.player1.id === +user_id)
		{
			this.clear_player_data(element.player1)
			this.clear_player_data(element.player2)
			games.push(element)
		}	
	});
		return (games);
	}

	async get_game_by_id(id) {
		
		let game = await this.gamesRepository.findOne({ where: { id: id }, relations: ['player1', 'player2'] });
		if (!game)
			return (game);
		this.clear_player_data(game.player1)
		this.clear_player_data(game.player2)
		return (game);
	}

	async endGame(deconnected_user, server) {
		let players = this.players.get(deconnected_user.game_id);
		let game = await this.gamesRepository.findOne({where: {id:deconnected_user.game_id}, relations: ['player1', 'player2']});
		if (game.status === "full")
		{
			if (players && deconnected_user.id === game.player1.id)
			{
				if (players[1].score === 0)                                                                                                                                                                                                                                                                      			if (players[1].score === 0)
					players[1].score++;
				await this.gamesRepository.update(game.id, { status: 'finished', player1_score: 0, player2_score: players[1].score });
				await this.usersRepository.update(game.player1.id, { NbGamesPlayed: (game.player1.NbGamesPlayed += 1), NbGamesLost: (game.player1.NbGamesLost += 1), InGame: false, game_id: 0 })
				await this.usersRepository.update(game.player2.id, { NbGamesPlayed: (game.player2.NbGamesPlayed += 1), NbGamesWon: (game.player2.NbGamesWon += 1), Score: (game.player2.Score += 2), InGame: false, game_id: 0 })

			}
			else if (players && deconnected_user.id === game.player2.id)
			{
				if (players[0].score === 0)
					players[0].score++;
				await this.gamesRepository.update(game.id, { status: 'finished', player1_score: players[0].score, player2_score: 0 });
				await this.usersRepository.update(game.player1.id, { NbGamesPlayed: (game.player1.NbGamesPlayed += 1), NbGamesWon: (game.player1.NbGamesWon += 1), Score: (game.player1.Score += 2), InGame: false, game_id: 0 })
				await this.usersRepository.update(game.player2.id, { NbGamesPlayed: (game.player2.NbGamesPlayed += 1), NbGamesLost: (game.player2.NbGamesLost += 1), InGame: false, game_id: 0 })
			}
		}
		else if (game.status === "pending" || game.status === "player1" || game.status === "player2")
		{
			await this.gamesRepository.update(game.id, { status: 'canceled'});
			await this.usersRepository.update(game.player1.id, { InGame: false, game_id: 0 });
			await this.usersRepository.update(game.player2.id, { InGame: false, game_id: 0 });
		}
		game = await this.gamesRepository.findOne({ where: { id: deconnected_user.game_id }, relations: ['player1', 'player2'] });
		if (game)
		{
			this.clear_player_data(game.player1)
			this.clear_player_data(game.player2)
		}
		server.volatile.to(game.id.toString()).emit('paused_game', { id: game.id, status: "finished", game: game });

	}

	async getAllUsers()
	{
		let users = await this.usersRepository.find();
		users.forEach(element => {
			this.clear_player_data(element);
		})
		return (users);
	}
	
	async cleanGamesList(user_id, server)
	{
		let pending = await this.get_pending_games(+user_id);
		for (let i = 0; i < pending.length; i++)
		{
			await this.uGameStatus(pending[i].id, "declined");
			server.emit("declined", JSON.stringify({game:pending[i], decliner:user_id}))
		}
		for(let i = 0; i < this.matchmaking_list.length; i++)
		{
			if (this.matchmaking_list[i].id == user_id)
				this.matchmaking_list.splice(i, 1);
		}
	}

	clear_player_data(data)
	{
		delete data.password
		delete data.email
		delete data.bio
		delete data.Enable2FA
		delete data.Valid2FA
		delete data.secret2FA
		delete data.jwt
		delete data.firstConnect
	}
}
