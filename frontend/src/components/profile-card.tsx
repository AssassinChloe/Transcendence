import React, {FunctionComponent, useState } from 'react';
import User from '../models/User.ts';
import '../styles/Profile.css';
import '../styles/Pong.css';
import { useNavigate } from  'react-router-dom';
import Avatar from 'react-avatar'

type Props = {
    user: User,
    borderColor?: string
};


const ProfileCard: FunctionComponent<Props> = ({user, borderColor = "#9c03e4"}) => {
    
  const [color, setColor] = useState<string>();
  const [onLine, setOnLine] = useState<boolean>();
  let navigate = useNavigate();
  
  const showBorder = () => {
    setColor(borderColor);
  }

  const hideBorder = () => {
    setColor("#f5f5f5");
  }

  const goToUserByUsername = (username: string) => {
    navigate(`/user/${username}`);
  }

  const unconnected = { color: 'red' };
  const connected = { color: 'green' };

    return (
    
        <div className="col col-auto">
        <div onClick={() => goToUserByUsername(user.username)} onMouseEnter={showBorder} onMouseLeave={hideBorder} onContextMenu={(e) => {
        e.preventDefault(); 
         }}>
          <div className="card horizontal" style={{ borderColor: color }}>
            <div className="card-image"> 
              <div className="avatar-sub-block">
                <Avatar src={user.avatar} round={true} alt={user.username} />
              </div>
            </div>
            <div className="card-stacked">
              <div className="card-content">
                    <div id="username"><b>{user.username}</b></div>
                    <div align="left">Score: <b>{user.Score}</b></div>
                    <div align="left"><b>{(user.connected || user.Connected)
                      ? <div style={connected}>Connected</div> 
                      : <div style={unconnected}>Not Connected</div>}</b></div>
                      <div align="left"><b>{(user.ingame || user.InGame)
                      ? <div style={unconnected}>In Game</div> 
                      : <div style={connected}>Not In Game</div>}</b></div>
              </div>
            </div>
          </div> 
        </div>
                    {(user.ingame || user.InGame) && <button id="button" onClick={() => navigate(`../Play/${user.game_id}`)}> Watch </button>}
     </div>
      );
}

export default ProfileCard;