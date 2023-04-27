import React, { useState, useEffect } from "react";
import Modal from 'react-bootstrap/Modal';
import Select from 'react-select';
import { getFetch, getFetchWithBody } from "../../../services/Fetch.service.ts";
import authService from "../../../services/auth.service.ts";

const MPCreation: React.FC = ({ socket, modalIsOpened, setModalIsOpened, rooms, setRefresh, refresh, setRooms, setMessageList, setActiveRoom, activeRoom, messageList }) => {

    const [options, setOptions] = useState<[]>([]);
    const [message, setMessage] = useState<string>();
    const [messageError, setMessageError] = useState<string>();
    const [userSelected, setUserSelected] = useState();
    const currentUser = authService.getCurrentUser();
    const [color, setColor] = useState<string>("#8380e1");

    const handleClose = async () => {
        setModalIsOpened(false);
    }

    const getUsers = async () => {
        const data = await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/getProbablyPrivMsg`, "GET");
        const dataJson = await data.json();

        await setOptionsWithDB(dataJson);
    }

    const createRoom = async (dataChan: any, user: string) => {
        const body = { data: dataChan, member: user };
        const data = await getFetchWithBody(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/privmsg`, "POST", body);
        const dataJson = await data.json();
        return dataJson;
    }

    const setOptionsWithDB = async (data: any) => {
        for (let elem of data) {
            if (elem.username !== currentUser.user.username) {
                const tmp = { value: elem.username, label: elem.username };
                options.push(tmp);
            }
        }
    }

    const onChange = async (e) => {
        setUserSelected(e);
    }

    const sendMessage = async () => {
        if (userSelected !== undefined) {
            let room = await checkRoomAlreadyExists();
            const pattern = /[a-zA-Z0-9]/;

            if (message.match(pattern)) {
                const msgData = {
                    message: message,
                    destination: room === null ? currentUser.user.username + "_" + userSelected.value : room.channel.roomName,
                    timestamp: new Date(),
                    author: currentUser.user,
                    color: color,
                };
                if (!room && message !== undefined) {
                    room = await createRoom(msgData, userSelected.value);
                    await socket.emit("newRoom", room);
                }
                await socket.emit("JoinRoom", msgData.destination);

                await socket.emit('sendMessage', msgData);
                setModalIsOpened(false);

                setActiveRoom(room);
                setRooms([]);
                setMessageList([]);
                setRefresh(!refresh);
            }
            else
                setMessageError("Message is not valid");
        }
    }

    const checkRoomAlreadyExists = async () => {
        for (let room of rooms) {
            const pos = await room.channel.members.map((e) => e.username).indexOf(userSelected.value);
            if (pos !== -1) {
                return room;
            }
        }
        return null;
    }

    const colorOnChange = async (e) => {
        setColor(e.target.value);
    }

    useEffect(() => {
        getUsers();
    }, [])

    return (
        <div>
            <Modal
                show={modalIsOpened}
                onHide={handleClose}
                aria-labelledby="contained-modal-title-vcenter"
                centered
                style={{
                    backgroundColor: "transparent",
                }}
            >
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title-vcenter">
                        Send new private message
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Select
                        name="members"
                        options={options}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        onChange={onChange}
                    />
                    <input className="mt-3 mb-3" type="color" id="colorpicker" value={color} onChange={e => colorOnChange(e)}></input>

                    {messageError !== undefined &&
                        <div className="alert alert-danger">{messageError}</div>
                    }
                    <textarea maxLength="80" className="form-control mt-2" placeholder="Your message..." style={{ height: "130px", wordWrap: "break-word", overflow: "hidden", resize: "none" }} onChange={(e) => setMessage(e.target.value)}></textarea>
                    <button className="btn right mt-2" style={{ backgroundColor: "#8380e1", opacity: "0.7" }} onClick={(e) => sendMessage()}>Send</button>
                </Modal.Body>
            </Modal>
        </div >
    )
}

export default MPCreation;
