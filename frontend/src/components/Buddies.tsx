import React, { useState, useEffect } from 'react';
import ProfileCard from '../components/profile-card.tsx';
import {getAllBuddies} from '../services/profile.service.ts';
import '../styles/Pong.css'

  
const Buddies: React.FC  = () => {
  const [users, setUsers] = useState([]);
  const [isFetched, setFetched] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false)

  useEffect(() => {
    const updateAllBuddies = async () => {
      const usersData = await getAllBuddies();
      if (usersData !== undefined) {
        setUsers(usersData);}
      if (usersData.length === 0 || usersData.length === undefined)
        setIsEmpty(true)
    };
    updateAllBuddies();
  }, [isFetched]);
  
  return (
    <div id="pong">
      <h1 className="center">Your buddies</h1>
      <div>{isEmpty
                  ? <div><br/>... You have no friends ...  <br/>(Hopefully, you don't have to be kind to people, you just have to follow them)</div>
                  : <div></div>}
              </div>
      <div className="container"> 
        <div className="row s4 m4 l4"> 
        {users.map(user => (

          <ProfileCard key={user.username} user={user}/> 
        ))}
        </div>
      </div>
    </div> 
  );
    }

  export default Buddies;