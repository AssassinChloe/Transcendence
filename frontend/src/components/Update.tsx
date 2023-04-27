import React, { useState, useMemo } from 'react';
import {loginUser} from './Login.tsx';
import '../styles/Pong.css';
import {useNavigate} from 'react-router-dom'
import { authContentHeader } from "../services/AuthHeader.ts";
import QRCode from './2FA/QRCode.tsx';
import Auth2F from "../components/2FA/Auth2f.tsx";
import { redirect } from "react-router-dom";
import Avatar from 'react-avatar'
import { useCookies } from 'react-cookie';

const UpdateUser: React.FC = ({setToken}) =>
{
    let navigate = useNavigate();
    
    const [usernameLocal, setUsernameLocal] = useState(JSON.parse(localStorage.getItem("token")).user.username);
    const [emailLocal, setEmailLocal] = useState(JSON.parse(localStorage.getItem("token")).user.email);
    const [avatarLocal, setAvatarLocal] = useState(JSON.parse(localStorage.getItem("token")).user.avatar);
    const [qrCodeIsDisplayed, setQrCodeIsDisplayed] = useState<boolean>(false);
    const [auth2FisOpened, setAuth2FisOpened] = useState<boolean>(false);
    const [redirect,setRedirect] = useState<boolean>(false);
    const [cookies, setCookies, removeCookies] = useCookies({secure: true, sameSite: 'none'});


    const notFirstConnect = async () => {
          const response = await fetch(`http://${process.env.REACT_APP_ADDRESS}:7001/user/first`, {
          method: "PUT",
          headers: authContentHeader(),
          body: null,
          redirect: "follow",
          });
  }
  notFirstConnect();

      const [user, setUser] = useState({
        username: JSON.parse(localStorage.getItem("token")).user.username,
        email: JSON.parse(localStorage.getItem("token")).user.email,
        avatar: JSON.parse(localStorage.getItem("token")).user.avatar,
        Enable2FA: JSON.parse(localStorage.getItem("token")).user.Enable2FA,
      });

      const currentUsername = JSON.parse(localStorage.getItem("token")).user.username
    

    const handleChange = e => {
      setUser({ ...user, [e.target.name]: e.target.value });
      setAvatarLocal(avatarLocal);
      setUsernameLocal(usernameLocal);
      setEmailLocal(emailLocal);
    };
    
    
      async function updateUser(credentials)
      { 
        const data = await (fetch(`http://${process.env.REACT_APP_ADDRESS}:7001/user/user`,
          {
              method: "PUT",
              headers: authContentHeader(),
              body: JSON.stringify(credentials)
          }))
        if (data['status'] === 422) {
          alert('Nickname or email already used');
        }
          return data.json();
      }

    
    const handleSubmit = async e => {
        e.preventDefault();
    
        if (user.username.length > 20 || user.username.length < 3) 
        {
          alert("Your username should be between 3 and 20 characters");
          return;
        }
        
        if (!/\S+@\S+\.\S+/.test(user.email)) 
        {
          alert("Invalid email.");
          return;
        }

        let retToken = await updateUser({user});
        if (retToken.user) {
          localStorage.setItem('token', JSON.stringify(retToken));
          setToken(retToken);
          navigate("/lobby");
        }
      };

      const enable2FA = async () => {
        user.Enable2FA = true;
        let retToken = await updateUser({ user});
        localStorage.setItem('token', JSON.stringify(retToken));
        setQrCodeIsDisplayed(true);
    }

    const disable2FA = async () => {
      user.Enable2FA = false;
      let retToken = await updateUser({ user});
      if (retToken['statusCode'])
        alert("BAAAAAAAD UPDATE ! (Probably an invalid username... please check)")
      else {
        localStorage.setItem('token', JSON.stringify(retToken));
        setQrCodeIsDisplayed(false);
        setAuth2FisOpened(true);
        navigate("/lobby");
    }
  }

  const setAvatarValue = async (avatar: string) =>
  {
    setAvatarLocal(avatar)
    setUser({...user, avatar: avatar})
  }


      return (
        <div id="pong" className="center">
          {qrCodeIsDisplayed && <QRCode username={user.username} isOpen={qrCodeIsDisplayed} setIsOpen={setQrCodeIsDisplayed} />}
          {auth2FisOpened && <Auth2F setIsOpen={setAuth2FisOpened} isOpen={auth2FisOpened} username={user.username} setToken={setToken} setRedirect={!setRedirect} token={user.token} />}
                    <div className="row">
                    <div className="col s12 m8 l3 offset-l2 pull-l1"> 
            <h2 className="header center">Update {currentUsername}'s profile</h2>
        <form onSubmit={handleSubmit}>  
          <div>
          <Avatar round={true} size="150" src={user.avatar} />
          </div>
          <br />
          <label>
            Nickname: 
            <input
              type="text"
              name="username"
              value={user.username}
              onChange={handleChange}
            />
          </label>
          <br />
          <label>
            avatar: <br /> 
            (choose below or paste internet link)
            <input
              type="text"
              name="avatar"
              value={user.avatar}
              onChange={handleChange}
            />
          </label>      
          <br />
          <button id="button" type="submit">Update me !</button>
        </form>

        <div>
        <div>{ user.Enable2FA 
              ? <div onClick={disable2FA}>
                  <button id="button"  >Disable 2FA </button>
                </div>
              : <div onClick={enable2FA}>
                  <button id="button"  >Enable 2FA </button>
                </div>}
                </div>
    </div>
          
          <button id="buttonAvatar"><Avatar onClick={(e) => setAvatarValue('avatar0.jpg')} round={true} size="100" src={'avatar0.jpg'} /></button>
          <button id="buttonAvatar"><Avatar onClick={(e) => setAvatarValue('avatar1.jpg')} round={true} size="100" src={'avatar1.jpg'} /></button>
          <button id="buttonAvatar"><Avatar onClick={(e) => setAvatarValue('avatar2.jpg')} round={true} size="100" src={'avatar2.jpg'} /></button>
          <button id="buttonAvatar"><Avatar onClick={(e) => setAvatarValue('avatar3.jpg')} round={true} size="100" src={'avatar3.jpg'} /></button>
          <button id="buttonAvatar"><Avatar onClick={(e) => setAvatarValue('avatar4.jpg')} round={true} size="100" src={'avatar4.jpg'} /></button>
          <button id="buttonAvatar"><Avatar onClick={(e) => setAvatarValue('avatar5.jpg')} round={true} size="100" src={'avatar5.jpg'} /></button>
          <br /> <button id="buttonAvatar"><Avatar onClick={(e) => setAvatarValue('avatar6.jpg')} round={true} size="100" src={'avatar6.jpg'} /></button>
          <button id="buttonAvatar"><Avatar onClick={(e) => setAvatarValue('avatar7.jpg')} round={true} size="100" src={'avatar7.jpg'} /></button>
          <button id="buttonAvatar"><Avatar onClick={(e) => setAvatarValue('avatar8.jpg')} round={true} size="100" src={'avatar8.jpg'} /></button>
          <button id="buttonAvatar"><Avatar onClick={(e) => setAvatarValue('avatar9.jpg')} round={true} size="100" src={'avatar9.jpg'} /></button>
          <button id="buttonAvatar"><Avatar onClick={(e) => setAvatarValue('avatar10.jpg')} round={true} size="100" src={'avatar10.jpg'} /></button>
          <button id="buttonAvatar"><Avatar onClick={(e) => setAvatarValue('avatar11.jpg')} round={true} size="100" src={'avatar11.jpg'} /></button>
          <br /> <button id="buttonAvatar"><Avatar onClick={(e) => setAvatarValue('avatar12.jpg')} round={true} size="100" src={'avatar12.jpg'} /></button>
          <button id="buttonAvatar"><Avatar onClick={(e) => setAvatarValue('Chloe.jpg')} round={true} size="100" src={'Chloe.jpg'} /></button>
          <button id="buttonAvatar"><Avatar onClick={(e) => setAvatarValue('Manon.jpg')} round={true} size="100" src={'Manon.jpg'} /></button>
          <button id="buttonAvatar"><Avatar onClick={(e) => setAvatarValue('Valerie.jpg')} round={true} size="100" src={'Valerie.jpg'} /></button>
          </div>
        </div>
        </div>
        
      );
}

export default UpdateUser;