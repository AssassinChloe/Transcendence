import '../styles/Navbar.css';
import React from 'react';
import menu_icon from "../assets/menu.png"

const menuList = [
  'Lobby',
  'Buddies',
  'Everybuddies',
  'Play',
  'Wall of fame',
  'Chat',
  'Logout'
]

function Navbar() {
  return (<div className="row nav">
    <div className="menu col-12">
      <label htmlFor="mobile"><img src={menu_icon} className="fas fa-bars"></img></label>
      <input type="checkbox" id="mobile" role="button" />
      <ul>
        {menuList.map((menu, index) => (
          <li key={`${menu}-${index}`} className="deroulant"><a href={`http://${process.env.REACT_APP_ADDRESS}:3000/${menu}`} >{menu}</a></li>))}
      </ul>
    </div>
  </div>)
}

export default Navbar