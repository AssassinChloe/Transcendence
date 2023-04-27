import React, { useState, useEffect } from "react";
import Modal from 'react-bootstrap/Modal';
import NewOwnerSearchBar from "../Menu/RoomsMenu/newOwnerSearchBar.tsx"
import { getFetch } from "../../../services/Fetch.service.ts"

const GiveOwnerTitle: React.FC = ({ socket, roomName, modalIsOpened, setModalIsOpened, currentUser, rooms }) => {

    const handleClose = () => { setModalIsOpened(false); };
    const [newOwner, setNewOwner] = useState();
    const [members, setMembers] = useState<[]>([]);

    const getRoomMembers = async () => {
        const data = await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/getMembers/${roomName}`, "GET");
        const dataJson = await data.json();

        await setMembersWithDB(dataJson);
    }

    const changeRoomOwner = async (newOwnerName: string) => {

        await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/setRoomOwner/${roomName}/${newOwnerName}`, "PATCH");
    }

    const setMembersWithDB = async (data: any) => {
        for (let elem of data) {
            setMembers([...members, elem]);
            members.push(elem);
        }
    }

    useEffect(() => {
        getRoomMembers();
    }, [])

    const quitRoom = async (roomName: string) => {
        await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/quitRoomMember/${roomName}/${currentUser.user.username}`, "PATCH");
    }

    const handleOwner = async () => {
        if (newOwner) {
            await changeRoomOwner(newOwner.value);

            await socket.emit("quitRoom", { roomName: roomName, username: currentUser.user.username });
            await quitRoom(roomName);
            await socket.emit("ownerChanged", { roomName: roomName, ownerUsername: newOwner.value });

            setModalIsOpened(false);
            const pos = rooms.map((e) => e.channel.roomName).indexOf(roomName);
            if (pos !== -1)
                rooms.splice(pos, 1);
        }
    }

    return (
        <div className="row row-col-md-10 row-col-lg-8 row-col-xl-6 row-mb-10 row-mb-md-10 row-lb-8 row-lb-lg-8 row-xlb-6 row-xlb-xlg-6">
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
                        Choose the new owner of {roomName}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div>
                        Members :
                        <NewOwnerSearchBar roomName={roomName} newOwner={newOwner} setNewOwner={setNewOwner} />
                    </div>
                    <button className="btn right mt-2" style={{ backgroundColor: "#8380e1", opacity: "0.7" }} onClick={(e) => handleOwner()}>
                        Send the decision
                    </button>

                </Modal.Body>
            </Modal>
        </div >
    )
}

export default GiveOwnerTitle;