import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Pong.css'
import authService from '../services/auth.service.ts';
import Auth2F from "../components/2FA/Auth2f.tsx";
import { useCookies } from 'react-cookie';



const Login: React.FC = (props) => {
    let navigate = useNavigate();
    let savedUser;
    let redirect = `http://${process.env.REACT_APP_ADDRESS}:7001/user/42`
    let username2;
    const [username, setUsername] = useState<string>();
    const [password, setPassword] = useState<string>("");
    const [auth2FisOpened, setAuth2FisOpened] = useState<boolean>(false);
    const [token, setToken] = useState(authService.getCurrentUser());
    const [auth42, setAuth42] = useState<boolean>(false);
    const [isFetched, setFetched] = useState(false);
    const [redirUpdate, setRedirUpdate] = useState<boolean>(false);
    


    useEffect(() => {

        if (token && token.user.username) {
            if (token.user.Enable2FA === true) {
                savedUser = (localStorage.getItem('token'))
                localStorage.removeItem("token");
                setAuth2FisOpened(true)
            }
            else {
                props.setToken(token);
                props.setRedirect(!token);
            }
        }
    }, [isFetched]);


    async function loginUser(credentials) {
        const data = await (fetch(`http://${process.env.REACT_APP_ADDRESS}:7001/user/token`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(credentials),
            }))
        return data.json();
    }

    async function cookieToToken() {
        const fetchurl = `http://${process.env.REACT_APP_ADDRESS}:7001/user/cookieToToken/` + cookies.usercookie + "/" + cookies.jwt
        const data = await (fetch(fetchurl,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            }))
        setAuth42(true)
        return data.json();
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (username) {
            let retToken = await loginUser({ username, password });
            if (retToken['statusCode'])
                alert("BAAAAD LOGIN !")
            else {
                setToken(retToken);
                if (retToken.user.Enable2FA)
                    setAuth2FisOpened(true);
                else {
                    localStorage.setItem('token', JSON.stringify(retToken));
                    props.setToken(retToken);
                    props.setRedirect(!retToken);
                    navigate("/lobby");
                }
            }
        }
    }

    const [cookies, setCookies, removeCookies] = useCookies({ secure: true, sameSite: 'none' });
     removeCookies('usercookie');
    removeCookies('jwt');
    removeCookies('appel');
    const [appel, setAppel] = useState<boolean>(false); 

    if (cookies.status && cookies.status === "422")
    {
        alert("Username or email is already used. \nPlease register manually")
        removeCookies('status', {secure: true, sameSite: 'none'});
    }
    if (cookies.usercookie && !cookies.appel)
    {
        cookieToToken().then(newUser => {
            localStorage.setItem('token', JSON.stringify(newUser))
            setCookies('appel', true, {sameSite: 'none' });
            setAppel(true);
            setAuth42(true);
            setRedirUpdate(JSON.parse(localStorage.getItem("token")).user.firstConnect)
            const redirectUpdate = JSON.parse(localStorage.getItem("token")).user.firstConnect
            if (redirectUpdate)
                setTimeout(navigate("/update"), 1000);
            else
                setTimeout(navigate("/lobby"), 1000);
        })
    }


    if (localStorage.getItem(token) && localStorage.getItem(token.user.Enable2FA)) {
        setAuth2FisOpened(true);
    }

    if (localStorage.getItem('token') && localStorage.getItem(token.user) && !localStorage.getItem(token.user.firstConnect))
        navigate("/lobby");
    if (localStorage.getItem('token') && localStorage.getItem(token.user) && localStorage.getItem(token.user.firstConnect))
        navigate("/update")

    async function hide_button() {
        var elem = document.querySelector(".log42");
        if (elem) {
            if (elem.classList.contains("nolog42")) {
                elem.classList.remove("nolog42");
            }
            else {
                elem.classList.add("nolog42");
            }
        }
    }
    return (
        <div id="pong">
            {!savedUser && auth2FisOpened && <Auth2F setIsOpen={setAuth2FisOpened} isOpen={auth2FisOpened} username={username} setToken={props.setToken} setRedirect={props.setRedirect} token={token} />}
            {savedUser && auth2FisOpened && <Auth2F setIsOpen={setAuth2FisOpened} isOpen={auth2FisOpened} username={username2} setToken={props.setToken} setRedirect={props.setRedirect} token={savedUser} />}
            <div className="center">
                <h3>Looooooogin</h3>
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col s12 m8 offset-l2 pull-l1">
                            <div className="form-group">
                                <label htmlFor="name">Login </label>
                                <input id="name" name="name" type="text" className="form-control" placeholder="Username" minLength="3" maxLength="20" onChange={e => setUsername(e.target.value)}></input>
                            </div>
                            <div className="form-group">
                                <label htmlFor="name">Password </label>
                                <input id="password" password="password" type="password" classpassword="form-control" placeholder="Password" onChange={e => setPassword(e.target.value)}></input>
                            </div>
                        </div>
                    </div>
                    <div id="game-buttons">
                        <button id="button" type="submit" >Login with username & password</button>
                    </div>
                </form>
            </div>
            <div id="game-buttons" className="log42">
                <a id="button" type="button" href={redirect} onClick={() => { hide_button() }}>Login with 42API</a>
            </div>
            <div>
                <div className="right">
                    <Link to="/signup" className="waves-effect waves-teal btn-flat">
                        New user ? Please register...
                    </Link>
                </div>
            </div>
        </div>

    )
}

export default Login;
async function wait(time: number) {
    await new Promise(f => setTimeout(f, time));
}
