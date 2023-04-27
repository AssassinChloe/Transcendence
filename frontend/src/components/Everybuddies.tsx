import React, { useState, useEffect } from 'react';
import ProfileCard from '../components/profile-card.tsx';
import {getAllUsers} from '../services/user.service.ts';
import '../styles/Pong.css'

  
const Everybuddies: React.FC  = () => {
  const [users, setUsers] = useState([]);
  const [isFetched, setFetched] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false)

  useEffect(() => {
    const updateAllUsers = async () => {
      const usersData = await getAllUsers();
      if (usersData !== undefined) {
        setUsers(usersData);
      }
      if (usersData.length === 0 || usersData.length === undefined)
        setIsEmpty(true)
    };
    updateAllUsers();
  }, [isFetched]);
  
  return (
    <div id="pong">
      <h1 className="center">All the beautiful people</h1>
      <div>{isEmpty
                  ? <div><br/>... You're sooooo alone. Please, don't cry ... </div>
                  : <div></div>}
              </div>
      <div className="container"> 
        <div className="row"> 
        {users.map(user => (
          <ProfileCard key={user.username} user={user}/> 
        ))}
        </div>
      </div>
    </div> 
  );
    }

  export default Everybuddies;