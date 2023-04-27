import React, { useEffect, useState } from 'react';
import '../styles/Pong.css'
import MyAvatar from './Game/Avatar.tsx'
import { getAllUsers } from '../services/user.service.ts';
import { authHeader } from "../services/AuthHeader.ts";
import { FaCrown } from 'react-icons/fa';

function WallOfFame(props) {
	const [users, setUsers] = useState([]);
	const [isFetched, setFetched] = useState(false);
	let i = 1;
  
	useEffect(() => {
	  const updateAllUsers = async () => {
		await getUsers(setUsers);
	  } 
	  updateAllUsers();
	}, [isFetched]);
	

	return (
		<div>
			<div id="card_play">
				<div className="table-responsive">
					<table className="table table-hover table-nowrap">
						<thead className="table-light">
							<tr>

								<th scope="col" id="text-center"> Score </th>
								<th scope="col"	id="text-center"> Player </th>
								<th scope="col"	id="text-center"> Played Games </th>
								<th scope="col" id="text-center"> Victory Ratio </th>
								<th scope="col" id="text-center"> Loose Ratio </th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{users.sort(function (a, b) {return b.Score - a.Score}).map((user) => (
								<tr key={`${user}-${user.id}`} style={user.username === props.user.username? { backgroundColor: "#d3d3f0" } :  { backgroundColor: "#eeeeee" } }>

									<td data-label=" Score " id="text-center">
									{i == 3 && <span style={{color: "#B8860B"}}> <FaCrown/> </span>}
									{i == 2 && <span style={{color: "#C0C0C0"}}> <FaCrown/> </span>}
									{i == 1 && <span style={{color: "#FFD700"}}> <FaCrown/> </span>}
									<span> {user.Score} </span>
									<div style={{display: "none"}}>{i++}</div>
									</td>
									<td data-label=" Player " id="text-left">
									<a id="link_matchmaking" href={`http://${process.env.REACT_APP_ADDRESS}:3000/user/${user.username}`}>
										<MyAvatar username={user.username} />
										<span id="name_matchmaking" >  {user.username}  </span>
										</a>
									</td>

									<td data-label=" Played Games " id="text-center">
									<span> {user.NbGamesPlayed} </span>
									</td>

									<td data-label=" Victory Ratio " id="text-center">
									<span> { Number.isNaN(Math.floor(user.NbGamesWon * 100 / user.NbGamesPlayed)) ? 0 : Math.floor(user.NbGamesWon * 100 / user.NbGamesPlayed) } % </span>
									</td>


									<td data-label=" Loose Ratio " id="text-center">
									<span> { Number.isNaN(Math.floor(user.NbGamesLost * 100 / user.NbGamesPlayed)) ? 0 : Math.floor(user.NbGamesLost * 100 / user.NbGamesPlayed) } % </span>

									</td>
								</tr>))}
						</tbody>
					</table>
				</div>
			</div>
		</div>)
}

async function getUsers(setUsers) {
    try
    {
      const response = await fetch(`http://${process.env.REACT_APP_ADDRESS}:7001/Play/allUsers`, {
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
        setUsers(result_1);
    } catch (error) 
    {
        return error;
    }

}
export default WallOfFame;
