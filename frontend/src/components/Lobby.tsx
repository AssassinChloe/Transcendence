import '../styles/Pong.css'
import React, { useState, useEffect } from 'react';
import authService from '../services/auth.service.ts';
import { getUserById } from '../services/profile.service.ts';
import Avatar from 'react-avatar'
import History from './Game/History.tsx'
import '../styles/Login.css'
import '../styles/Pong.css'

const Lobby: React.FC = () => {
  const token = authService.getCurrentUser();
  const username = JSON.parse(localStorage.getItem("token")).user.username;
  let update_address = `http://${process.env.REACT_APP_ADDRESS}:3000/Update`;
  const [user, setUser] = useState([]);
 

  useEffect(() => {
    const updateProfile = async () => {
      getUserById(username).then(profile => {
        setUser(profile);
      })
    };
    updateProfile();
  }, []);

  if (user && user.profile) {
    return (
      <div>
        <div id="pong" className="center">
          <h2>You're log as ... </h2>
          <div className="row">
            <div className="col s12 m8 l3 offset-l2 pull-l1">
              <Avatar round={true} size="150" src={user.profile.avatar} />
              <h2 className="header center">{user.profile.username}</h2>
              <div className="card hoverable">
                <div className="card-image">
                </div>
                <div className="card-stacked">
                  <div className="card-content">
                    <table className="bordered striped">
                      <tbody>
                        <tr>
                          <td>Nickname</td>
                          <td><strong>{user.profile.username}</strong></td>
                        </tr>
                        <tr>
                          <td>Login</td>
                          <td><strong>{user.profile.loginname}</strong></td>
                        </tr>
                        <tr>
                          <td>Email</td>
                          <td><strong>{user.profile.email}</strong></td>
                        </tr>
                        <tr>
                          <td>2FA enable ?</td>
                          <td><strong>{user.profile.Enable2FA ? <div>Yes</div> : <div>No</div>}</strong></td>
                        </tr>
                        <tr>
                          <td>Total Score</td>
                          <td><strong>{user.profile.Score}</strong></td>
                        </tr>
                        <tr>
                          <td>Nb games played</td>
                          <td><strong>{user.profile.NbGamesPlayed}</strong></td>
                        </tr>
                        <tr>
                          <td>Nb games won</td>
                          <td><strong>{user.profile.NbGamesWon}</strong></td>
                        </tr>
                        <tr>
                          <td>Nb games lost</td>
                          <td><strong>{user.profile.NbGamesLost}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <a href={update_address}>
                  <div id="game-buttons">
                    <button id="button" type="submit" >Update my Profile</button>
                  </div></a>
              </div>
            </div>
          </div>
        </div>
        <History userid={token.user.id} />
      </div>

    )
  }
}

export default Lobby;