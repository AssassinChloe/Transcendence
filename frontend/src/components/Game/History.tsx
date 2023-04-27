import React, { useEffect, useState } from 'react';
import '../../styles/Pong.css'
import MyAvatar from './Avatar.tsx'
import { authHeader } from "../../services/AuthHeader.ts";

import { GiPartyPopper } from 'react-icons/gi';
function History({userid}) {

	const [gameList, updateGameList] = useState([]);
	const [isFetched, setFetched] = useState(false);

    useEffect(() => {
        const getHistory = async () => {
          await getGames(userid, updateGameList);
        };
        getHistory();
      }, [isFetched]);
    return (
            <div>
                    <div className="table-responsive">
                        <h1> Game History </h1>
                        <table className="table table-hover table-nowrap">
                            <thead className="table-light">
                                <tr>
                                    <th scope="col" id="text-right">Player 1</th>
                                    <th scope="col" id="text-center">Score 1</th>
                                    <th scope="col" id="text-center">  -  </th>
                                    <th scope="col" id="text-center">Score 2</th>
                                    <th scope="col" id="text-left">Player 2</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {gameList.sort(function (a, b) {return b.id - a.id}).map((game) => (
                                    <tr key={`${game}-${game.id}`}>
                                        <td data-label="Player 1" id="text-right">
                                        <a id="link_matchmaking" href={`http://${process.env.REACT_APP_ADDRESS}:3000/user/${game.player1.username}`}>
                                            {(game.player1_score > game.player2_score) && <span style={{color: "#228B22"}}> <GiPartyPopper/> </span>}
                                            <span id="name_matchmaking" >  {game.player1.username}  </span>
                                            <MyAvatar username={game.player1.username} />
                                            </a>
                                        </td>
                                        <td data-label="Score 1" id="text-center">
                                            <span> {game.player1_score} </span>
                                        </td>
                                        <td></td>
                                        <td data-label="Score 2" id="text-center">
                                            <span> {game.player2_score} </span>
                                        </td>
                                        <td data-label="Player 2" id="text-left">
                                        <a id="link_matchmaking" href={`http://${process.env.REACT_APP_ADDRESS}:3000/user/${game.player2.username}`}>
                                            <MyAvatar username={game.player2.username} />
                                            <span id="name_matchmaking">  {game.player2.username}  </span>
                                            {(game.player2_score > game.player1_score) && <span style={{color: "#228B22"}}> <GiPartyPopper/> </span>}
                                            </a>
                                        </td>
                                    </tr>))}
                            </tbody>
                        </table>
                    </div>
            </div>);
}

async function getGames(userid, updateGameList) {
    try
    {
      const response = await fetch(`http://${process.env.REACT_APP_ADDRESS}:7001/Play/historyMatch/`+ userid, {
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

export default History;