import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from 'react-bootstrap/Modal';
import FriendSearchBar from "./FriendSearchBar.tsx"

const Custom: React.FC = ({user, socket, isOpen, setIsOpen, buddy}) => {
    const handleClose = () => { setIsOpen(false); }
    const types = ["Lavender field", "Flowers", "Custom Colors"];
    const [norminet, setNorminet] = useState<Boolean>(false);
    const [gameStyle, setGameStyle] = useState<string>("");
    const [gameBackground, setGameBackground] = useState<string>("#FFFFFF");
    const [gameColor, setGameColor] = useState<string>("#000000");
    const [gameDuration, setGameDuration] = useState<number>(120);
    const [player2, setPlayer2] = useState<number>(buddy.id);
    const navigate = useNavigate();
    const styleOnChange = async (e) => {
        setGameStyle(e.target.value);
    }

    const backgroundOnChange = async (e) => {
        setGameBackground(e.target.value);
    }

    const colorOnChange = async (e) => {
        setGameColor(e.target.value);
    }

    const durationOnChange = async (e) => {
        setGameDuration(e.target.value);
    }

    const norminetOnChange = async (e) => {
        if (e.target.value === "yes")
            setNorminet(true);
        else
            setNorminet(false);
    }

    const init_custom_play  = () =>
    {
		socket.emit('init_custom_game',  { 'text': user.id, 'style': {primary:gameBackground, secondary:gameColor, background:gameStyle, duration:gameDuration, norminet:norminet, player2:player2} });
		setIsOpen(false);
        navigate(`/Play`);
    }

    return (
        <div className="row row-col-md-10 row-col-lg-8 row-col-xl-6 row-mb-10 row-mb-md-10 row-lb-8 row-lb-lg-8 row-xlb-6 row-xlb-xlg-6">
            <Modal
                show={isOpen}
                onHide={handleClose}
                aria-labelledby="contained-modal-title-vcenter"
                centered
                style={{
                    backgroundColor: "transparent",
                }}>
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title-vcenter">
                        New Custom Game
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Custom your style :</p>
                    {types.map(type => (
                        <div key={type} style={{ marginBottom: '10px' }}>
                            <label>
                                <input id={type} type="radio" className="filled-in" value={type} checked={gameStyle === type} onChange={e => styleOnChange(e)}></input>
                                <span>
                                    {type}
                                </span>
                            </label>
                        </div>
                    ))}
                    {gameStyle === "Custom Colors" && <label htmlFor="colorpicker"> Players & Ball : </label>} 
                    {gameStyle === "Custom Colors" && <input type="color" id="colorpicker" value={gameColor} onChange={e => colorOnChange(e)}></input>}
                    {gameStyle === "Custom Colors" && <label htmlFor="colorpickerball"> Background : </label>}
                    {gameStyle === "Custom Colors" && <input type="color" id="colorpicker" value={gameBackground} onChange={e => backgroundOnChange(e)}></input>}
                    <br></br>
                    <p>Ask a friend to play with you :</p>
                    {buddy.id === 0 && <FriendSearchBar setPlayer2={setPlayer2}  user={user} />}
                    {buddy.id !== 0 && <span> {buddy.username}</span>}
                    <br></br>

                    {gameStyle === "Custom Colors" &&
                        <div >
                            <p>And do you wanna play with Norminet ?</p>
                            <label>
                                <input id="norminety" type="radio" className="filled-in" value="yes" checked={norminet === true} onChange={e => norminetOnChange(e)}></input>
                                <span>
                                    Yes
                                </span>
                            </label>
                            <label>
                                <input id="norminetn"  type="radio" className="filled-in" value="no" checked={norminet === false} onChange={e => norminetOnChange(e)}></input>
                                <span>
                                    No
                                </span>
                         </label>
                    </div>
                    }
                    <br></br>
                    <p>Choose the duration of your game : {gameDuration}''</p>
                    <input type ="range" min="30" max="300" value={gameDuration} step="15" onChange={e => durationOnChange(e)}></input>
                    <br></br>
                    <button className="right btn" onClick={() => init_custom_play()}>
                        Play
                    </button>

                </Modal.Body>
            </Modal>
        </div >
    )
}
export default Custom;  