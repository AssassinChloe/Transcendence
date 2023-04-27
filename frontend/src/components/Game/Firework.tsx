import React from 'react';
import '../../styles/Firework.css';
import '../../styles/Pong.css';

function Firework ({firework}:{firework:string}){
    if (firework === "finished")
    {
        return (<div>
        <div className="firework"></div>
        <div className="firework"></div>
        <div className="firework"></div>
        </div>)
    }
    else
        return (null);
}

export default Firework;
