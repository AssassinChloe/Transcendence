import React, { useState, useEffect } from 'react';
import authService from '../services/auth.service.ts';
import '../styles/Pong.css'
import { redirect, useNavigate } from "react-router-dom";
import { useCookies } from 'react-cookie';


const Logout: React.FC = ({setToken, socket, setRedirect}) => {
    let navigate = useNavigate();

    const [cookie, setCookie, removeCookie] = useCookies();

    const handleSubmit = async (e) => {
        e.preventDefault();
        authService.logout();
        setRedirect(!authService.getCurrentUser())
        if(setToken){
        setToken(authService.getCurrentUser())
        removeCookie('usercookie');
        removeCookie('jwt');
        removeCookie('appel');
        (socket).emit('logout');
        navigate("/")
        }
    }

    return (
        <div id="Pong" className="center">
            <h3>Sure you want to quit ?</h3>
            <form onSubmit={handleSubmit}>
                <button id="button" type="submit" >Getme out of here !</button>
            </form>
        </div>

    )
}

export default Logout;