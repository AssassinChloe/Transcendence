import React, { useState, useEffect } from 'react';
import Banner from './Banner.tsx'
import Navbar from './Navbar.tsx'
import Pong from './Game/Pong.tsx'
import Login from './Login.tsx';
import io from "socket.io-client";
import ChatMenu from './Chat/Menu/index.tsx';
import SearchBar from './Chat/Menu/userSearchBar.tsx';
import Logout from './Logout.tsx';
import Lobby from './Lobby.tsx';
import Update from './Update.tsx';
import { BrowserRouter as Router, Route, Link, Switch, Navigate, useNavigate, Routes } from 'react-router-dom'
import PageNotFound from './PageNotFound.tsx';
import CreateUser from './CreateUser.tsx';
import authService from '../services/auth.service.ts';
import Matchmaking from './Game/Matchmaking.tsx';
import Game from '../models/Game.ts'
import Buddies from './Buddies.tsx';
import Everybuddies from './Everybuddies.tsx';
import ProfileDetail from './ProfileDetail.tsx';
import WallOfFame from './WallOfFame.tsx';
import AlertPopup from './AlertPopup.tsx';
import useAlert from '../hooks/UseAlert.tsx';
import '../styles/Pong.css'
import { getFetch } from "../services/Fetch.service.ts"

function App() {
  const [token, setToken] = useState(authService.getCurrentUser());
	const [isFetched, setFetched] = useState(true);
  const [redirect, setRedirect] = useState<boolean>(!(token && token.user));
  let i_game: Game;
  const [game, updateGame] = useState(i_game);
  const { setAlert } = useAlert();
  let socket;
  let user_id;

  if (token && token.user) 
  {
    user_id = token.user.id;
    socket = io(`http://${process.env.REACT_APP_ADDRESS}:5001`, { auth: { token: user_id } });

    socket.on('invitation', function (data) {
      let c_game = JSON.parse(data);
      if (user_id != c_game.player1.id) {
        setAlert((`${c_game.player1.username} invite you to play, check your Play page`), '#8380e1', (<a href={`http://${process.env.REACT_APP_ADDRESS}:3000/Play/`}>GO</a>))
      }
      setFetched(!isFetched);
    });

    socket.on('game_on', function (data) {
      let c_game = JSON.parse(data);
      if (user_id == c_game.player1.id || user_id == c_game.player2.id) {
        setAlert((`We find you a match, check your Play page`), '#8380e1', (<a href={`http://${process.env.REACT_APP_ADDRESS}:3000/Play/`}>GO</a>))
      }
      setFetched(!isFetched);

    });

    socket.on('declined', function (data) {
      let c_game = JSON.parse(data);
      if (token.user.username == c_game.game.player1.username || token.user.username == c_game.game.player2.username) {
        if (c_game.decliner == c_game.game.player1.id)
          setAlert((`${c_game.game.player1.username} declined the game, sorry`), '#8380e1', (<div></div>))
        else if (c_game.decliner == c_game.game.player2.id)
          setAlert((`${c_game.game.player2.username} declined the game, sorry`), '#8380e1', (<div></div>))
      }
      setFetched(!isFetched);

    });
  }

  const roomDisconnected = async () => {
    await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/roomDeconnexions`, "POST");
  }

  useEffect(() => {
    if (token && token.user)
      roomDisconnected();
  }, []);


  return (
    <Router>
      <div>
        <Banner token={token} />
        <Navbar />
        <Routes>
          <Route path="/" element={redirect ? (<Navigate replace to="/login" />) : (<Lobby />)} />
          <Route path="/login" element={<Login setToken={setToken} setRedirect={setRedirect} />} />
          <Route path="/Chat" element={redirect ? (<Navigate replace to="/login" />) : <ChatMenu socket={socket} />} />
          <Route path="/search" element={redirect ? (<Navigate replace to="/login" />) : <SearchBar />} />
          <Route path="/signup" element={<CreateUser setToken={setToken} setRedirect={setRedirect} />} />
          <Route path="/logout" element={redirect ? (<Navigate replace to="/login" />) : (<Logout socket={socket} setToken={setToken} setRedirect={setRedirect} />)} />
          <Route path="/lobby" element={redirect ? (<Navigate replace to="/login" />) : (<Lobby token={token} setToken={setToken} />)} />
          <Route path="/buddies" element={redirect ? (<Navigate replace to="/login" />) : (<Buddies />)} />
          <Route path="/everybuddies" element={redirect ? (<Navigate replace to="/login" />) : (<Everybuddies />)} />
          <Route path={"/user/:username"} element={redirect ? (<Navigate replace to="/login" />) : (<ProfileDetail socket={socket} />)} />
          <Route path="/update" element={redirect ? (<Navigate replace to="/login" />) : (<Update setToken={setToken} setRedirect={setRedirect} />)} />
          <Route path="/Play" element={redirect ? (<Navigate replace to="/login" />) : (<Matchmaking socket={socket} updateGame={updateGame} user={token.user} isFetched={isFetched}/>)} />
          <Route path={"/Play/:id"} element={redirect ? (<Navigate replace to="/login" />) : (<Pong socket={socket} Appgame={game} updateGame={updateGame} user={token.user} />)} />
          <Route path="*" element={<PageNotFound />} />
          <Route path="/Wall of Fame" element={redirect ? (<Navigate replace to="/login" />) : (<WallOfFame user={token.user} />)} />
        </Routes>
        <AlertPopup />
      </div>
    </Router>
  )
}
export default App

