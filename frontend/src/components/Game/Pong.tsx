import '../../styles/Pong.css'
import React, {useState} from 'react';
import {Socket} from 'socket.io-client';
import Firework from './Firework.tsx'
import flower from '../../assets/flower.jpg'
import lavander from '../../assets/lavander.jpg'
import MyAvatar from './Avatar.tsx'
import Watch from './Watch.tsx'

import norm1 from '../../assets/norm1.png'
import norm2 from '../../assets/norm2.png'
import norm3 from '../../assets/norm3.png'
import norm4 from '../../assets/norm4.png'
import patoune from '../../assets/patoune.png'
import beeball_l from '../../assets/Beeball.png'
import beeball_r from '../../assets/Beeball_right.png'

import { BsFillArrowDownSquareFill } from "react-icons/bs";
import { BsFillArrowUpSquareFill } from "react-icons/bs";

let img = new Image();
let sprite1 = new Image(); 
let sprite2 = new Image(); 
let sprite3 = new Image(); 
let sprite4 = new Image(); 
let sprite5 = new Image();
let beeball_left = new Image();
let beeball_right = new Image();

const keyboard = {};
var updateId : any,
previousDelta = 0,
fpsLimit = 70;
window.onkeydown = function(e) {
keyboard[e.key] = true;
};

window.onkeyup = function(e) {
delete keyboard[e.key];
};

function Pong({socket, Appgame, user, updateGame})
{
    const [firework, setFirework] = useState("plop");
    const [canvas, setCanvas] = useState();
    const canvasRef = React.useRef(null);
    const [paused, setPaused] = useState<boolean>(true);
    if (!Appgame || Appgame.status === "finished" || Appgame.status === "canceled" || Appgame.status === "declined")
    {
        return (<div>
        <Watch socket={socket} user={user} updateGame={updateGame} setFireWork={setFirework} />
        <Firework firework={firework}/>
        </div>)
    }
    else    
    {
        sprite1.src = norm1;
        sprite2.src = norm2;
        sprite3.src = norm3;
        sprite4.src = norm4;
        sprite5.src = patoune;
        beeball_left.src = beeball_l;
        beeball_right.src = beeball_r;
        let game = Appgame
        return (
        <div id="pong">
            <ul id="game-buttons">
                <li id="game-button"> <div> {game.player1.username} </div></li>
                <li id="game-button"> <div className="score" id="player1-score"> 0 </div></li>
                <li id="game-button"> <MyAvatar username={game.player1.username}/></li>
                {paused === true && <li id="game-button"><button id="button_play" className="button" onClick={() => {setCanvas(canvasRef.current); player_ready(socket, game, user, setFirework, setPaused)}}>Click to Start</button></li>}
                <li id="game-button"> <div id="timer"> 00:00 </div></li>
                {/* <li id="game-button"> <button id="button_play2" className="button" onClick={() => {socket.emit('game_update', {'id' : game.id, 'text' : 'stop'});}}>Quit Game</button></li> */}
                <li id="game-button"> <MyAvatar username={game.player2.username}/></li>
                <li id="game-button"> <div className="score" id="player2-score"> 0 </div></li>
                <li id="game-button"> <div> {game.player2.username} </div></li>

            </ul>
            <canvas id="canvas" ref={canvasRef} width = {window.innerWidth} height={window.innerWidth * 0.55}>
            </canvas>
            <div id="game-button">
                <p>How to play : use <BsFillArrowDownSquareFill/> and <BsFillArrowUpSquareFill/> of your keyboard to move your plank.</p>
                <p>If you leave this page now you will cancel the game and loose if it has allready been started.</p>
            </div>
            <Firework firework={firework}/>
        </div>);
    }
}

const player_ready = async(socket, game, user, setFirework, setPaused) =>
{
    let button = document.getElementById('button_play');
    if (button)
        button.style.display = "none";
    socket.emit('ready', {'id':game.id});
    socket.on('both_ready', (game) =>
    {
        if (game.ball.background === "Flowers")
            img.src = flower;
        else if (game.ball.background === "Lavender field")
            img.src = lavander;
        setPaused(false);
        draw_start(socket, game, user, setFirework, setPaused);
    });
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    draw_message({primary:"000000", secondary:"FFFFFF"}, 'Waiting for the other player...', canvas.width/2, canvas.height/2);
    socket.on('paused_game', () =>
    {
        context.clearRect(0, 0, canvas.width, canvas.height);
        draw_message({primary:"FFFFFF", secondary:"000000"}, "SORRY!", canvas.width/2, canvas.height/2)
        draw_message({primary:"FFFFFF", secondary:"000000"}, "Your opponent leave the game...", canvas.width/2, canvas.height/4)
        end_game(setFirework);
    });
}

function draw_message(info, message, x, y)
{
    var context = canvas.getContext('2d');
    context.font = 'bold 3em Segoe UI';
    context.textAlign = 'center';
    context.fillStyle = info.primary
    context.fillText(message, x + 2, y + 2);
    context.fillStyle = info.secondary
    context.fillText(message, x, y);
}

function update(currentDelta, socket, game, user, setFirework, setPaused) {
    updateId = requestAnimationFrame(() => update(Date.now(), socket, game, user, setFirework, setPaused));

    var delta = currentDelta - previousDelta;
    if (fpsLimit && delta < 1000 / fpsLimit) {
        return;
    }
    if (game.status === "full")
    {
        socket.on('updated_game', (data) =>
        {
            game = data;
        });
        socket.on('paused_game', () =>
        {
            draw_message(game.ball, "SORRY!", canvas.width/2, canvas.height/2)
            draw_message(game.ball, "Your opponent leave the game...", canvas.width/2, canvas.height/4)
            end_game(setFirework);
        });
        playerMove(socket, game);
        if (delta % 2 === 0 && user.username === game.players[1].username)
            socket.emit('game_update', {'id':game.id, 'text' : 'ball_move'});        
        if (delta % 2 !== 0 && user.username === game.players[0].username)
            socket.emit('game_update', {'id':game.id, 'text' : 'ball_move'});

        draw(socket, game);
    }
    else 
    {
        draw_stop(game, user);
        end_game(setFirework);
        return;
    }
    previousDelta = currentDelta;
}

function end_game(setFirework)
{
        setFirework("finished");
        cancelAnimationFrame(updateId);
        return;
}

function draw(socket, game)
{
    const RATIO = canvas.width / 800;
    var context = canvas.getContext('2d');
    let timer = Math.floor(+game.ball.duration + (+game.ball.start/1000 - Date.now()/1000));
    // Draw field
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = game.ball.primary;
    context.fillRect(1, 1, (canvas.width-2),(canvas.height-2));

    context.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw middle line
    context.strokeStyle = game.ball.secondary;
    context.beginPath();
    context.moveTo(canvas.width / 2, 0);
    context.lineTo(canvas.width / 2, canvas.height);
    context.stroke();

    //Draw Norminet
    if (game.ball.norminet === true)
    {
        if (game.ball.x * RATIO <= canvas.width/2)
        {
            if (timer % 2 == 0)
                context.drawImage(sprite1, (canvas.width/2 - canvas.height/16), (canvas.height/2 - canvas.height/16), canvas.height/6, canvas.height/6 );
            else
                context.drawImage(sprite2, (canvas.width/2 - canvas.height/16), (canvas.height/2 - canvas.height/16), canvas.height/6, canvas.height/6 );
        }
        else
        {
            if (timer % 2 == 0)
                context.drawImage(sprite3, (canvas.width/2 - canvas.height/16), (canvas.height/2 - canvas.height/16), canvas.height/6, canvas.height/6);
            else
                context.drawImage(sprite4, (canvas.width/2 - canvas.height/16), (canvas.height/2 - canvas.height/16), canvas.height/6, canvas.height/6);
        }
    
        // Draw la patoune
    
        if (game.ball.x * RATIO <= (canvas.width/2 + canvas.height/6) && game.ball.y * RATIO <= (canvas.height/2 + canvas.height/6) && game.ball.x * RATIO >= (canvas.width/2 - canvas.height/6) && game.ball.y * RATIO >= (canvas.height/2 - canvas.height/6))
        {
            context.drawImage(sprite5, game.ball.x * RATIO, game.ball.y * RATIO, canvas.height/12, canvas.height/12);
        }
    }

    // Draw players
    context.fillStyle = game.ball.secondary /*game.player1.color*/;
    context.fillRect(game.players[0].x * RATIO, game.players[0].y * RATIO, (canvas.width/80), (canvas.height/5));
    context.fillStyle = game.secondary /*game.player2.color*/;
    context.fillRect(game.players[1].x * RATIO, game.players[1].y * RATIO, (canvas.width/80), (canvas.height/5));

    // Draw ball
    context.beginPath();
    context.fillStyle = game.ball.secondary;
    context.arc(game.ball.x * RATIO, game.ball.y * RATIO, canvas.width/80, 0, Math.PI * 2, false);
    context.fill();
    document.querySelector('#player1-score')!.textContent = game.players[0].score;
    document.querySelector('#player2-score')!.textContent = game.players[1].score;

    //Draw BeeBall
    if (game.ball.background === "Flowers" || game.ball.background === "Lavender field")
    {
        if (game.ball.speed_x < 0)
        context.drawImage(beeball_left, game.ball.x * RATIO - canvas.width/80, game.ball.y * RATIO - canvas.width/80,  canvas.width/40,  canvas.width/40);
        else
        context.drawImage(beeball_right, game.ball.x * RATIO - canvas.width/80, game.ball.y * RATIO - canvas.width/80,  canvas.width/40,  canvas.width/40);

    }
    //DRAW TIMER
    if (timer <= 0)
    {
        stop(socket, game);
        timer = 0;
    }
    document.querySelector('#timer')!.textContent = ` ${Math.floor(timer / 60)}:${timer % 60} `;
}

const draw_start = async(socket, game, user, setFirework, setPaused) =>
{
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    draw_message(game.ball,'GAME ON!', canvas.width/2, canvas.height/2);
    await new Promise(f => setTimeout(f, 1000));
    socket.emit('game_update', {'id':game.id, 'text' : 'ball_move'});
    update(Date.now(), socket, game, user, setFirework, setPaused)
    
}

const draw_stop = async (game, user) =>
{
    if (parseInt(game.players[0].score) > parseInt(game.players[1].score))
    {
        if (user.username === game.players[0].username)
            draw_message({primary:game.ball.secondary, secondary:game.ball.primary}, 'VICTORY!', canvas.width/2, canvas.height/4);
        else
            draw_message({primary:game.ball.secondary, secondary:game.ball.primary}, 'GAME OVER!', canvas.width/2, canvas.height/4);
        draw_message({primary:game.ball.secondary, secondary:game.ball.primary},`${game.players[0].username} won the game!`, canvas.width/2, canvas.height/2);
    }
    else  if (parseInt(game.players[0].score) < parseInt(game.players[1].score))
    {
        if (user.username === game.players[1].username)
            draw_message({primary:game.ball.secondary, secondary:game.ball.primary}, 'VICTORY!', canvas.width/2, canvas.height/4);
        else
            draw_message({primary:game.ball.secondary, secondary:game.ball.primary}, 'GAME OVER!', canvas.width/2, canvas.height/4);
        draw_message({primary:game.ball.secondary, secondary:game.ball.primary},`${game.players[1].username} won the game`, canvas.width/2, canvas.height/2);
    }
    else
    {
        draw_message({primary:game.ball.secondary, secondary:game.ball.primary}, "IT'S A TIE!", canvas.width/2, canvas.height/4);
        draw_message({primary:game.ball.secondary, secondary:game.ball.primary},'No winner, no looser', canvas.width/2, canvas.height/2);
    }

}

async function playerMove(socket: Socket, game)
{
    if (keyboard['ArrowUp'])
    { 
        socket.emit('game_update', {'id':game.id, 'text' : 'move_up'});
    }
    if (keyboard['ArrowDown'])
    {
        socket.emit('game_update', {'id':game.id, 'text' : 'move_down'});
    }
}

async function stop(socket:Socket, game) 
{
    socket.emit('game_update', {'id' : game.id, 'text' : 'stop'});
}

export default Pong;


