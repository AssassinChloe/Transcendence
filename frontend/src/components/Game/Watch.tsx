import '../../styles/Pong.css'
import React, {useState} from 'react';
import PageNotFound from '../PageNotFound.tsx';

import flower from '../../assets/flower.jpg'
import lavander from '../../assets/lavander.jpg'
import { useNavigate } from "react-router-dom";
import norm1 from '../../assets/norm1.png'
import norm2 from '../../assets/norm2.png'
import norm3 from '../../assets/norm3.png'
import norm4 from '../../assets/norm4.png'
import patoune from '../../assets/patoune.png'

let sprite1 = new Image(); 
let sprite2 = new Image(); 
let sprite3 = new Image(); 
let sprite4 = new Image(); 
let sprite5 = new Image();

function Watch({socket, setFirework})
{
    let img = new Image();

    sprite1.src = norm1;
    sprite2.src = norm2;
    sprite3.src = norm3;
    sprite4.src = norm4;
    sprite5.src = patoune;
    let game;
    const [canvas, setCanvas] = useState();
    const canvasRef = React.useRef(null);
    const navigate = useNavigate();
    let id = window.location.pathname;
    id = id.slice(6, id.length);
    if (Number.isNaN(+id) || +id > 214748364)
    {
        return (<PageNotFound />);
    }
    socket.emit('watch', {'id': +id});

    socket.on('notfound', () =>
    {
        const notFound = document.querySelector('#notFound');
        if (notFound)
            changeDisplay(notFound);
    });

    socket.on('game_watched', (new_data) =>
    {
        if(new_data.ball === undefined)
        {
            const notFound = document.querySelector('#notFound');
            if (notFound)
                changeDisplay(notFound);
            return;
        }
        setCanvas(canvasRef.current);
        const pong = document.querySelector('#watch');
        if (pong)
            changeDisplay(pong);
        document.querySelector('#player1-name')!.textContent = new_data.game.player1.username.toString();
        document.querySelector('#player2-name')!.textContent = new_data.game.player2.username.toString();
        if (new_data.ball.background === "Flowers")
            img.src = flower;
        else if (new_data.ball.background === "Lavender field")
            img.src = lavander;
    });
    socket.on('game_stop', (new_data) =>
    {
        game = JSON.parse(new_data);
        draw_stop(game);
        setFirework("finished");
    });
    socket.on('updated_game', (data) =>
    {
        game = data;
        draw(game, img);
    });

        return (
            <div className="pong">
            <div id="watch">
                <ul id="game-buttons">
                    <li id="game-button"> <div id="player1-name"> Player 1 </div></li>
                    <li id="game-button"> <div className="score" id="player1-score"> 0 </div></li>
                    <li id="game-button"> <div id="timer"> 00:00 </div></li>
                    <li id="game-button"> <div className="score" id="player2-score"> 0 </div></li>
                    <li id="game-button"> <div id="player2-name"> Player 2 </div></li>
                </ul>
                <canvas id="canvas" ref={canvasRef} width = {window.innerWidth} height={window.innerWidth * 0.55}>
                </canvas>
            </div>
            <div id="notFound">
                <p >The game you are trying to watch doesn't exist or is already finished!</p>
            </div>
            </div>);
} 

function changeDisplay(id)
{
    id.style.display = "inline-block";
}

function draw(game, img)
{
    const RATIO = canvas.width / 800;
    var context = canvas.getContext('2d');
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

    let timer = Math.floor(+game.ball.duration + (+game.ball.start/1000) - Date.now()/1000);
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
    context.fillRect(game.players[0].x * RATIO, game.players[0].y * RATIO, (canvas.width/80), (canvas.height/8));
    context.fillStyle = game.secondary /*game.player2.color*/;
    context.fillRect(game.players[1].x * RATIO, game.players[1].y * RATIO, (canvas.width/80), (canvas.height/8));

    // Draw ball
    context.beginPath();
    context.fillStyle = game.ball.secondary;
    context.arc(game.ball.x * RATIO, game.ball.y * RATIO, canvas.width/80, 0, Math.PI * 2, false);
    context.fill();
    document.querySelector('#player1-score')!.textContent = game.players[0].score;
    document.querySelector('#player2-score')!.textContent = game.players[1].score;
    if (timer <= 0)
    {
        timer = 0;
    }
    document.querySelector('#timer')!.textContent = ` ${Math.floor(timer / 60)}:${timer % 60} `;
}

const draw_stop = async (game) =>
{
    var context = canvas.getContext('2d');
    context.font = '3em Segoe UI';
    context.fillText('GAME OVER', canvas.width/4, canvas.height/4);
    if (parseInt(game.players[0].score) > parseInt(game.players[1].score))
        context.fillText(`${game.players[0].username} won the game!`, canvas.width / 4, canvas.height / 2);
    else  if (parseInt(game.players[0].score) < parseInt(game.players[1].score))
        context.fillText(`${game.players[1].username} won the game`,canvas.width/4, canvas.height/2);
    else
        context.fillText('No winner, no looser', canvas.width/4, canvas.height/2);
    await new Promise(f => setTimeout(f, 5000));

}

export default Watch;