import '../styles/Banner.css'
import logo from '../assets/logo.png'
import React from 'react';
import Avatar from 'react-avatar'


function Banner(props) {
    const title = 'Transcendence';

    if (!props.token)
    {
        return (
            <div className='banner'>
                <img src={logo} alt='FtTranscendence' className='logo' />
                <h1 className='title'>{title}</h1>
            </div>)
    }
    else
    {
        
        let avatar = JSON.parse(localStorage.getItem("token")).user.avatar
        const verif = avatar.slice(0, 4) ;
        if (verif !== 'http')
            avatar = process.env.PUBLIC_URL + '/' + avatar;
        return (
            <div className='banner'>
                <h1 className='title'>{title}</h1>
                <img src={logo} alt='FtTranscendence' className='logo' />
                <div className="banner_info">
                <a href={`http://${process.env.REACT_APP_ADDRESS}:3000/Lobby`}>
						<Avatar round={true} size="50" src={avatar} /></a>
                <p> You're logged as {props.token.user.username} !</p>
                </div>
            </div>)
    }
}

export default Banner