import React, { useState, useEffect } from "react";
import Modal from 'react-bootstrap/Modal';
import { getFetch } from "../../../../services/Fetch.service.ts";
import authService from "../../../../services/auth.service.ts";

const PasswordRequestForm: React.FC = ({ isOpen, setIsOpen, room, setActiveRoom, activeRoom }) => {
    const handleClose = () => { setIsOpen(false); };
    const [password, setPassword] = useState<string>();
    const [passwordIsCorrect, setPasswordIsCorrect] = useState<boolean>(false);
    const [erreur, setErreur] = useState<string>();
    const [count, setCount] = useState<number>(0);
    const currentUser = authService.getCurrentUser();

    const checkPassword = async () => {
        const data = await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/checkRoomPassword/${room.channel.roomName}/${password}`, "GET");
        const dataJson = await data.json();
        return dataJson;
    }

    const handlePassword = (e) => {
        setPassword(e.target.value);
    }

    const sendPassword = async (e) => {
        if (password !== undefined) {
            const pattern = /[a-zA-Z0-9]/;
            if (password.match(pattern)) {
                const passwordIsGood = await checkPassword();
                setPasswordIsCorrect(passwordIsGood);
                if (!passwordIsGood) {
                    setErreur("Password is not correct ! You still have one chance");
                    setCount(count + 1);
                }
                else {
                    setActiveRoom(room);
                }
            }
            else {
                setErreur("Need a valid password !");
            }
        }
    }

    useEffect(() => {
        if (passwordIsCorrect) {
            if (room.channel.membersJoined.map((e) => e.id).indexOf(currentUser.user.id) === -1)
                room.channel.membersJoined.push(currentUser.user);
            setActiveRoom(room);
            setIsOpen(false);
        }
    }, [passwordIsCorrect])

    useEffect(() => {
        if (count > 1) {
            setActiveRoom(undefined);
            setIsOpen(false);
        }
    }, [count])

    return (
        <div className="row row-col-md-10 row-col-lg-8 row-col-xl-6 row-mb-10 row-mb-md-10 row-lb-8 row-lb-lg-8 row-xlb-6 row-xlb-xlg-6">
            <Modal
                show={isOpen}
                onHide={handleClose}
                aria-labelledby="contained-modal-title-vcenter"
                centered
                style={{
                    backgroundColor: "transparent",
                }}
            >
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title-vcenter">
                        Password Request
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div>
                        <input type="password" placeholder="Password" onChange={(e) => handlePassword(e)} onKeyPress={(e) => { e.key === "Enter" && sendPassword(e) }}></input>
                        {erreur !== undefined &&
                            <div className="alert alert-danger">{erreur}</div>
                        }
                    </div>
                    <button className="btn right mt-2" style={{ backgroundColor: "#8380e1", opacity: "0.7" }} type="submit" onClick={(e) => sendPassword(e)}>
                        send password
                    </button>
                </Modal.Body>
            </Modal>
        </div >
    )
}

export default PasswordRequestForm;