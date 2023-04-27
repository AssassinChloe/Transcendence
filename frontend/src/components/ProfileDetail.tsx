import '../styles/Pong.css'
import React, { useState, FunctionComponent, useEffect } from 'react';
import authService from '../services/auth.service.ts';
import { getFetch } from "../services/Fetch.service.ts";
import { getUserData } from '../services/user.service.ts';
import { RouteComponentProps, Link, useParams, useNavigate } from 'react-router-dom';
import Avatar from 'react-avatar'
import { getUserById, followProfile, unfollowProfile } from '../services/profile.service.ts';
import History from './Game/History.tsx';
import Custom from "./Game/Custom.tsx"

import '../styles/Pong.css';

const ProfileDetail: FunctionComponent = ({ username, socket }) => {
  let navigate = useNavigate();
  const [user, setUser] = useState([]);
  const [isFetched, setFetched] = useState(false);
  const token = authService.getCurrentUser();
  const [currentUser, setCurrentUser] = useState();
  const [followButton, setFollowButton] = useState(false);
  const [blockButton, setBlockButton] = useState(false);
  const [unblockButton, setUnblockButton] = useState(false);
  const [opponent, setOpponent] = useState<object>({});
  const [launchGameIsOpened, setLaunchGameIsOpened] = useState<boolean>(false);

  let userId = useParams();

  const selfStalking = (userId.username == token.user.username)

  useEffect(() => {
		  const getProfile = async () => {
          await updateProfile(userId.username, setUser, setFollowButton)
      }

    const getCurrentUser = async () => {
      const data = await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/user/user`, "GET");
      const dataJson = await data.json();
      await setCurrentUser(dataJson);
      if (dataJson.user.usersBlocked !== null) {
        if (dataJson.user.usersBlocked.map((e) => e.username).indexOf(userId.username) === -1)
          setBlockButton(true);
        else
          setUnblockButton(false);
      }
    }

    getProfile()
    getCurrentUser()

  }, []);

  const addUserBlocked = async (username: string) => {
    const data = await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/user/blockUser/${username}`, "PATCH");
  }

  const deleteUserBlocked = async (username: string) => {
    const data = await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/user/unblockUser/${username}`, "PATCH");
  }


  const handleSubmitFollow = async (e) => {
    e.preventDefault();
    followProfile(user.profile.username);
    setFollowButton(true)
  }

  const handleSubmitUnfollow = async (e) => {
    e.preventDefault();
    unfollowProfile(user.profile.username);
    setFollowButton(false)
  }

  const launchGame = async (opponentId: object) => {
    setOpponent(opponentId);
    setLaunchGameIsOpened(true);
  }

  const handleBlock = async () => {
    await addUserBlocked(user.profile.username);
    setBlockButton(false);
    setUnblockButton(true);
    socket.emit("handleUserBlock", { userId: user.profile.id });
    socket.emit("handlePrivMsgUserBlocked", { userId: user.profile.id });
  }

  const handleUnblock = async () => {
    await deleteUserBlocked(user.profile.username);
    setBlockButton(true);
    setUnblockButton(false);
    socket.emit("handleUserUnblocked", { userId: user.profile.id });
    socket.emit("handlePrivMsgUserUnblocked", { userId: user.profile.id });
  }

  if (user.profile) {

    let avatar = user.profile.avatar;
    const verif = avatar.slice(0, 4);
    if (verif !== 'http')
      avatar = process.env.PUBLIC_URL + '/' + avatar;

    return (
      <div>
        {launchGameIsOpened && <Custom socket={socket} isOpen={launchGameIsOpened} setIsOpen={setLaunchGameIsOpened} user={currentUser.user} buddy={opponent} />}
        <div id="pong" className="center">
          <h2>You're stalking ... </h2>
          <div className="row">
            <div className="col s12 m8 l3 offset-l2 pull-l1">
              <Avatar round={true} size="150" src={avatar} />
              <h2 className="header center">{user.profile.username}</h2>
              <div>{selfStalking
                  ? <div>It's you...... you can run to your lobby if you want to update something </div>
                  : <div></div>}
              </div>
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
                          <td>Friendship status</td>
                          <td><strong>{followButton ? <div>Friend</div> : <div>{ selfStalking ? <div>You</div> :<div>Random chum</div>}</div>}</strong></td>
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
                <div>{selfStalking
                  ? <div> </div>
                  : <div>
                    <div>{followButton
                      ? <form onClick={handleSubmitUnfollow}>
                        <button id="button" type="Submit"  >Unfollow </button>
                      </form>
                      : <form onClick={handleSubmitFollow}>
                        <button id="button" type="Submit"  >Follow </button>
                      </form>}
                    </div>
                    <div>
                      <button id="button" type="Submit" onClick={(e) => launchGame({ id: user.profile.id, username: user.profile.username })}> Invite to play </button>
                    </div>

                    <div>
                      {blockButton === true ?
                        <button id="button" type="Submit" onClick={(e) => handleBlock()}> Block </button>
                        :
                        <button id="button" type="Submit" onClick={(e) => handleUnblock()}> Unblock </button>
                      }
                    </div>
                  </div>}
                </div>
              </div>
            </div>
          </div>
        </div>
        <History userid={user.profile.id} />
      </div>
    )
  }
}
 async function updateProfile(username, setUser, setFollowButton)
 {
    let user;
    await getUserById(username).then(profile => {
    user = JSON.stringify(profile);
    setUser(profile);
  })
  let words = user.split(',');
  if (words[words.length - 1].search("true") > 0)
    setFollowButton(true);
  else
    setFollowButton(false);

}
export default ProfileDetail;