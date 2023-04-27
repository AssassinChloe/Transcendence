import React, { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import UserSearchBar from "../Menu/userSearchBar.tsx"
import { getFetchWithBody } from "../../../services/Fetch.service.ts"

const RoomCreation: React.FC = ({ socket, isOpen, setIsOpen, setMessageList, setActiveRoom, activeRoom, messageList }) => {

    const [channelName, setChannelName] = useState<string>();
    const [message, setMessage] = useState<string>();
    const [members, setMembers] = useState<[]>([]);
    const [roomStatus, setRoomStatus] = useState<string>("Public");
    const [roomPassword, setRoomPassword] = useState<string>("");
    const [erreur, setErreur] = useState<string>();
    const [passwordErreur, setPasswordErreur] = useState<string>();

    const [color, setColor] = useState<string>("#8380e1");

    const types = ["Public", "Private", "Protected"];
    const location = useLocation();

    if (!socket)
        socket = location.state;

    socket.on("roomCreated", msg => { setMessage(msg); });

    useEffect(() => { }, [message]);

    const channelCreation = async (body: any) => {
        const data = await getFetchWithBody(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/roomCreation`, "POST", body);

        return await data.json();
    }

    const createChannel = async () => {
        let isValid: boolean = true;
        const pattern = /[a-zA-Z0-9]/;

        if (channelName && channelName.match(pattern)) {
            if (channelName !== undefined && channelName) {
                if (members.length > 0 || roomStatus === "Public" || roomStatus === "Protected") {
                    const newRoom = {
                        channel: {
                            roomName: channelName,
                            status: roomStatus,
                            password: roomPassword,
                            members: members,
                            color: color,
                        },
                    };
                    if (roomStatus === "Protected" && (!roomPassword.match(pattern) || roomPassword.match(" "))) {
                        setPasswordErreur("Need to have a valid password !");
                        isValid = false;
                    }
                    if (isValid) {
                        const newChan = await channelCreation(newRoom.channel);
                        if (newChan.channel === null)
                            await setErreur("Room already exists !")
                        else {
                            await socket.emit("JoinRoom", newChan.channel.roomName);
                            await socket.emit("newRoom", newChan);
                            if (roomStatus === "Private") {
                                await socket.emit("newInvitations", { roomName: newChan.channel.roomName, members: members });
                            }
                            await setIsOpen(false);
                            setActiveRoom(newChan);
                            setMessageList([]);
                        }
                    }
                }
            }
            // else
            //     await setErreur("Room already exists !")
        }
        else
            await setErreur("Room name needs to be valid !");

    }

    const statusOnChange = async (e) => {
        setRoomStatus(e.target.value);
    }

    const colorOnChange = async (e) => {
        setColor(e.target.value);
    }

    const handleClose = () => { setIsOpen(false); };

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
                        Nouvelle conversation
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <input className="form-control" placeholder="Nom du channel" onChange={(e) => { setChannelName(e.target.value); }} value={channelName || ''} />
                    {erreur !== undefined &&
                        <div className="alert alert-danger">{erreur}</div>
                    }
                    <input className="mt-3 mb-3" type="color" id="colorpicker" value={color} onChange={e => colorOnChange(e)}></input>
                    <div>
                        Members :
                        {roomStatus === "Private" &&
                            <UserSearchBar members={members} setMembers={setMembers} />
                        }
                    </div>
                    <br />
                    {types.map(type => (
                        <div key={type} style={{ marginBottom: '10px' }}>
                            <label>
                                <input id={type} type="radio" className="filled-in" value={type} checked={roomStatus === type} onChange={e => statusOnChange(e)}></input>
                                <span>
                                    {type}
                                </span>
                            </label>
                        </div>
                    ))}
                    {passwordErreur !== undefined &&
                        <div className="alert alert-danger">{passwordErreur}</div>
                    }
                    {roomStatus === "Protected" &&
                        <input type="password" placeholder="Password" onChange={(e) => setRoomPassword(e.target.value)} ></input>
                    }
                    <button className="btn right mt-2" style={{ backgroundColor: "#8380e1", opacity: "0.7" }} onClick={createChannel}>
                        Créer le channel
                    </button>
                </Modal.Body>
            </Modal>
        </div >
    )
}
export default RoomCreation;