import React, { useState, useEffect } from "react";
import Modal from 'react-bootstrap/Modal';
import { getFetch } from "../../../services/Fetch.service.ts";
import { RxCross2 } from "react-icons/rx";

const ChatBanned: React.FC = ({ room, setModalIsOpen }) => {

    const handleClose = async () => { setModalIsOpen(false) }
    const [usersBanned, setUsersBanned] = useState<[]>([]);
    const [refresh, setRefresh] = useState<boolean>(true);


    const getUsersBanned = async () => {
        const data = await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/getUsersBanned/${room.channel.roomName}`, "GET");
        const dataJson = await data.json();

        await setUsersBannedWithDB(dataJson);
    }

    const unBanRoomUser = async (username: string) => {
        await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/unBanRoomUser/${room.channel.roomName}/${username}`, "PATCH");
    }

    const setUsersBannedWithDB = async (data: any) => {
        for (let elem of data) {
            setUsersBanned([...usersBanned, elem]);
            usersBanned.push(elem);
        }
    }

    const handleUserBanned = async (username: string) => {
        await unBanRoomUser(username);
        const pos = usersBanned.map((e) => e.username).indexOf(username);
        if (pos !== -1)
            usersBanned.splice(pos, 1);
        setRefresh(!refresh);
        setModalIsOpen(false);
    }

    useEffect(() => {
        getUsersBanned();
    }, [])

    return (
        <Modal
            show="true"
            onHide={handleClose}
            aria-labelledby="contained-modal-title-vcenter"
            centered
            style={{
                backgroundColor: "transparent",
            }}
        >
            <Modal.Header>
                <Modal.Title id="contained-modal-title-vcenter">
                    User banned
                </Modal.Title>

            </Modal.Header>
            <Modal.Body>

                {React.Children.toArray(
                    usersBanned.map((userBanned) => {
                        return (
                            <ul className="list-unstyled mb-0" >
                                <li className="p-2 text-center" style={{ backgroundColor: "#eee" }}>
                                    <div className="card-title">
                                        <span style={{ color: "blue" }}>{userBanned.username}
                                            <a className="btn-lg" type="button" onClick={(e) => handleUserBanned(userBanned.username)} style={{ color: "#9A617A", padding: "4px" }}>
                                                <RxCross2 />
                                            </a>
                                        </span>
                                    </div>
                                </li>
                            </ul>
                        )
                    })
                )}
            </Modal.Body>
        </Modal >
    )

}

export default ChatBanned;