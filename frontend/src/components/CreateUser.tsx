import React, { useState } from 'react';
import '../styles/Pong.css';
import { useNavigate } from 'react-router-dom';
import QRCode from './2FA/QRCode.tsx';

const CreateUser: React.FC = (props) => {
  let navigate = useNavigate();

  const [qrCodeIsDisplayed, setQrCodeIsDisplayed] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [user, setUser] = useState({
    id: null,
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    avatar: "avatar1.jpg",
    Enable2FA: false,
    valid2FA: false,
  });

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [enable2FA, setEnable2FA] = useState(false);
  const passwordHasLower = /[a-z]/.test(user.password)
  const passwordHasUpper = /[A-Z]/.test(user.password)
  const passwordHasNumber = /[0-9]/.test(user.password)
  const passwordHasMinChar = user.password.length >=5

  const handleChange = e => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleAcceptTerms = e => {
    setAcceptTerms(e.target.checked);
  }

  async function createUser(credentials) {
    const data = await (fetch(`http://${process.env.REACT_APP_ADDRESS}:7001/user/signup`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
      }))

    return data.json();
  }


  const handleSubmit = async e => {
    e.preventDefault();
    setDisabled(true);

    // Vérifie si tous les champs sont remplis
    if (!user.username || !user.email || !user.password || !user.confirmPassword) {
      alert("All fields are required...");
      setDisabled(false);
      return;
    }

    if (user.username.length > 20 || user.username.length < 3) {
      alert("Your username should be between 3 and 20 characters");
      setDisabled(false);
      return;
    }

    if (user.username == 'vmercier' || user.username == 'val')
      user.avatar = "Valerie.jpg"

    // Vérifie si l'email est valide
    if (!/\S+@\S+\.\S+/.test(user.email)) {
      alert("Invalid email...");
      setDisabled(false);
      return;
    }

    // verifie le format du password et la confimation du password
    if (!passwordHasLower || !passwordHasUpper || !passwordHasNumber || !passwordHasMinChar)
    {
      alert("Please check the format of your password. It should have: \n  - a lower letter \n  - an upper letter, \n  - a number, \n  - a minimum of 5 characters, \n  - a drop of unicorn blood (or not)")
      setDisabled(false);
      return;
    }
    if (user.password !== user.confirmPassword) {
      alert("Please check your password...");
      setDisabled(false);
      return;
    }

    if (enable2FA)
      user.Enable2FA = true;

    // Vérifie si les conditions d'utilisation ont été acceptées 
    if (!acceptTerms) {
      alert("Please accept terms of use !");
      setDisabled(false);
      return;
    }

    // Propose un avatar par defaut
    if (user.username == 'vmercier' || user.username == 'val')
      user.avatar = "Valerie.jpg"

    else if (user.username == 'cassassi' || user.username == 'chloe' || user.username == 'peluche')
      user.avatar = "Chloe.jpg"

    else if (user.username == 'mbouquet' || user.username == 'Manon' || user.username == 'manon')
      user.avatar = "Manon.jpg"

    else {
      const num = Math.floor(Math.random() * 13)
      user.avatar = 'avatar' + num + '.jpg'
    }

    const password = user.password;
    const username = user.username;
    const email = user.email;
    const avatar = user.avatar;
    const Enable2FA = user.Enable2FA;

    let retToken = await createUser({ username, password, email, avatar, Enable2FA });
    if (retToken['statusCode'])
    {
      alert("BAAAAAAAD CREATION !")
      setDisabled(false);
    }
    else {
      localStorage.setItem('token', JSON.stringify(retToken));
      props.setToken(retToken);
      props.setRedirect(!retToken);
      if (Enable2FA)
        setQrCodeIsDisplayed(true);
      else
        navigate("/update");
    }
  };

  return (
    <div id="pong" className="center">
      {qrCodeIsDisplayed && <QRCode username={user.username} isOpen={qrCodeIsDisplayed} setIsOpen={setQrCodeIsDisplayed} />}
      <div className="row">
        <div className="col s12 m8 l3 offset-l2 pull-l1">
          <h2 className="header center">New user</h2>
          <form onSubmit={handleSubmit}>
            <label>
              Username:
              <input
                type="text"
                name="username"
                value={user.username}
                onChange={handleChange}
                minLength="3"
                maxLength="20"
              />
            </label>
            <br />
            <label>
              Email:
              <input
                type="email"
                name="email"
                value={user.email}
                onChange={handleChange}
              />
            </label>
            <br />
            <label>
              Password:
              <input
                type="password"
                name="password"
                value={user.password}
                onChange={handleChange}
              />
            </label>
            <br />
            <label>
              Confirm Password:
              <input
                type="password"
                name="confirmPassword"
                value={user.confirmPassword}
                onChange={handleChange}
              />
            </label>
            <br />
            <div>
              <label>
                <input
                  type="checkbox"
                  name="Enable2FA"
                  id="visible"
                  checked={enable2FA}
                  onChange={(e) => setEnable2FA(e.target.checked)}
                />
                I'm paranoid, please enable 2 Factors Authentification for my account
              </label>
            </div>
            <label>
              <input
                id="visible2"
                type="checkbox"
                name="acceptTerms"
                checked={acceptTerms}
                onChange={handleAcceptTerms}
              />
              I acknowledge and accept the terms of use. In particular I accept to be kind to Chloe, Manon and Valerie. Any bug detected and notified in an undiplomatic way could lead to a broken knee
            </label>
            <br />
            <button id="button" type="submit" disabled={disabled}>Count me in !</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateUser;