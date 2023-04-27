import React, { useState } from "react";
import Modal from 'react-bootstrap/Modal';
import { getFetch } from "../../../services/Fetch.service.ts"

const HandlePassword: React.FC = ({ socket, isOpen, setIsOpen, room, setActiveRoom }) => {

    const [firstPassword, setFirstPassword] = useState<string>();
    const [secondPassword, setSecondPassword] = useState<string>();
    const [error, setError] = useState<string>();


    const requestToDeletePassword = async () => {
        await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/deletePassword/${room.channel.roomName}`, "DELETE");
    }

    const handleClose = () => { setIsOpen(false) };

    const handleFirstPassword = (e) => { setFirstPassword(e.target.value); }

    const handleSecondPassword = (e) => { setSecondPassword(e.target.value); }

    const sendPassword = async () => {
        const pattern = /[a-zA-Z0-9]/;
        if (firstPassword === secondPassword) {
            if (firstPassword.match(pattern) && !firstPassword.match(" ")) {
                await socket.emit("changePassword", { roomName: room.channel.roomName, password: firstPassword });
                setIsOpen(false);
                setActiveRoom(undefined);
            }
            else
                setError("Password need to be valid")
        }
        else
            setError("Error passwords are differents")
    }

    const deletePassword = async () => {
        await requestToDeletePassword();
        await setIsOpen(false);
        await socket.emit("deletePassword", { roomName: room.channel.roomName });
        setActiveRoom(undefined);
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
                }}
            >
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title-vcenter">
                        Password Request
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error !== undefined &&
                        <div className="alert alert-danger">{error}</div>
                    }
                    <div>
                        <input type="password" placeholder="New password" onChange={(e) => handleFirstPassword(e)} onKeyPress={(e) => { e.key === "Enter" && sendPassword(e) }}></input>
                    </div>

                    <div>
                        <input type="password" placeholder="Confirm password" onChange={(e) => handleSecondPassword(e)} onKeyPress={(e) => { e.key === "Enter" && sendPassword(e) }}></input>
                    </div>
                    <a className="link-btn" type="button" onClick={(e) => deletePassword()} style={{ color: "#8380e1" }}>To delete password click here</a>
                    <button className="btn right mt-2" style={{ backgroundColor: "#8380e1", opacity: "0.7" }} type="submit" onClick={(e) => sendPassword()}>
                        send password
                    </button>
                </Modal.Body>
            </Modal>
        </div >
    )
}

export default HandlePassword;