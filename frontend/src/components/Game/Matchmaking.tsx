import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import Game from '../../models/Game';
import '../../styles/Pong.css'
import Custom from './Custom.tsx';
import MyAvatar from './Avatar.tsx';
import { authHeader } from "../../services/AuthHeader.ts";

function Matchmaking({ socket, user, updateGame, isFetched }) {
	let upgame : Game;
	const [gameList, updateGameList] = useState([]);
	const [inviteList, updateInviteList] = useState([]);
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const navigate = useNavigate();
	useEffect(() => {
		const getPending = async () => {
			await getInvites(user.id, updateInviteList);
		}
		const getOngoingGames = async () => {
			await getGames(updateGameList);
		  };
		  getPending();
		  getOngoingGames();
	}, [!isFetched]);


	function plusHandleClick() {
		setIsOpen(true);
	}

	function init_play()
	{
		socket.emit('init_game', { 'text': user.id, 'style':{primary:"#000000", secondary:"#FFFFFF", background:"", duration:120, norminet:false} });
		setIsOpen(false);
		const notify = document.querySelector('#notification');
		const ellipsis = document.querySelector('#lds-ellipsis');
		const ellipsis1 = document.querySelector('#lds-ellipsis1');
		const ellipsis2 = document.querySelector('#lds-ellipsis2');
		const search = document.querySelector('#search');
		const custom = document.querySelector('#custom');
		if (notify && ellipsis && ellipsis1 && ellipsis2 && search && custom) {
			notif(notify, ellipsis, ellipsis1, ellipsis2, search, custom)
		}
	};
	socket.on('launch_game', function (data) {
		upgame = data;
		updateGame(upgame);
		navigate(`./${+upgame.id}`);
	});

	return (
		<div>
			{isOpen === true && <Custom socket={socket} isOpen={isOpen} setIsOpen={setIsOpen} user={user} buddy={{id:0, username:""}}/>}
			<ul id="game-buttons">
				<li id="game-button">
					<button className="button" id="search" onClick={() => {init_play()}}>Search for a game</button>
					<button className="button" id="custom" onClick={() => {plusHandleClick()}}>Create Custom Game</button>
					<p id="notification"></p>
					<div className="lds-ellipsis" >
						<div id="lds-ellipsis"></div>
						<div id="lds-ellipsis1"></div>
						<div id="lds-ellipsis2"></div>
					</div>
				</li>
			</ul>
			<div id="card_play">
				<h1> Pending Games </h1>
				<div className="table-responsive">
					<table className="table table-hover table-nowrap">
						<thead className="table-light">
							<tr>
								<th scope="col" id="text-center"> Opponent </th>
								<th scope="col" id="text-center">  -  </th>
								<th scope="col" id="text-center">  Type  </th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{inviteList.map((game) => (
								<tr key={`${game}-${game.id}`}>
									<td data-label=" Opponent " id="text-center">
									{	game.player2.username === user.username &&
										<a id="link_matchmaking" href={`http://${process.env.REACT_APP_ADDRESS}:3000/user/${game.player1.username}`}>
										<span id="name_matchmaking" >  {game.player1.username}  </span>
										<MyAvatar username={game.player1.username} />
										</a>}
										{ game.player1.username === user.username &&
										<a id="link_matchmaking" href={`http://${process.env.REACT_APP_ADDRESS}:3000/user/${game.player2.username}`}>
										<span id="name_matchmaking" >  {game.player2.username}  </span>
										<MyAvatar username={game.player2.username} />
										</a>}
									</td>
									<td data-label="  -  " id="text-center">
									<button id="button" onClick={() => {socket.emit('player_join_game', {game})}}> Play </button>
										<button id="button" onClick={() => {socket.emit('player_refuse_game', {game})}}> Decline </button>
									 </td>
									 {game.type === "default" && <td data-label=" Type " id="text-center"> Matchmaking</td>}
									 {game.type === "custom" && <td data-label=" Type " id="text-center"> Custom </td>}
								</tr>))}
						</tbody>
					</table>
				</div>
			</div>
			
			<div id="card_play">
				<h1> Current games </h1>
				<button className="button" onClick={() => {getGames(updateGameList)}}>Update</button>
				<div className="table-responsive">
					<table className="table table-hover table-nowrap">
						<thead className="table-light">
							<tr>
								<th scope="col" id="text-right">Player 1</th>
								<th scope="col" id="text-center">  -  </th>
								<th scope="col" id="text-left">Player 2</th>
								<th></th>
							</tr>
						</thead>
						<tbody>

							{gameList.map((game) => (
								<tr key={`${game}-${game.id}`}>
									<td data-label="Player 1" id="text-right">
									<a id="link_matchmaking" href={`http://${process.env.REACT_APP_ADDRESS}:3000/user/${game.player1.username}`}>
										<span id="name_matchmaking" >  {game.player1.username}  </span>
										<MyAvatar username={game.player1.username} />
										</a>
									</td>
									<td data-label="  -  " id="text-center">
										<button id="button" onClick={() => navigate(`./${game.id}`)}> Watch </button>
									 </td>
									<td data-label="Player 2" id="text-left">
									<a id="link_matchmaking" href={`http://${process.env.REACT_APP_ADDRESS}:3000/user/${game.player2.username}`}>
										<MyAvatar username={game.player2.username} />
										<span id="name_matchmaking">  {game.player2.username}  </span>
										</a>
									</td>
								</tr>))}
						</tbody>
					</table>
				</div>
			</div>
		</div>)
}

function notif(notify, ellipsis, ellipsis1, ellipsis2, search, custom) {
	notify.textContent = "You join the queue!";
	notify.style.color = '#8380e1';
	ellipsis.style.background = '#8380e1';
	ellipsis1.style.background = '#8380e1';
	ellipsis2.style.background = '#8380e1';
	search.style.display = 'none';
	custom.style.display = 'none';
}

async function getInvites(userid, updateInviteList)
{
    try
    {
      const response = await fetch(`http://${process.env.REACT_APP_ADDRESS}:7001/Play/InviteMatch/`+ userid, {
        method: "GET",
        headers: authHeader(),
        body: null,
        redirect: "follow",
      });
      const result_1 = await response.json();
        if (!response.ok)
        {
            return "error";
        }
		updateInviteList(result_1)
    } catch (error) 
    {
        return error;
    }

}

async function getGames(updateGameList)
{
    try
    {
      const response = await fetch(`http://${process.env.REACT_APP_ADDRESS}:7001/Play/getOnGoingGame`, {
        method: "GET",
        headers: authHeader(),
        body: null,
        redirect: "follow",
      });
      const result_1 = await response.json();
        if (!response.ok)
        {
            return "error";
        }
		updateGameList(result_1);
    } catch (error) 
    {
        return error;
    }

}

export default Matchmaking;