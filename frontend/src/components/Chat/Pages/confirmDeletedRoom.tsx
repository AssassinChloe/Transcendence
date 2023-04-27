import React from "react";
import Modal from 'react-bootstrap/Modal';
import { RxCross2 } from "react-icons/rx";
import { FcCheckmark } from "react-icons/fc";
import { getFetch } from "../../../services/Fetch.service.ts";

const ConfirmDeletedRoom: React.FC = ({ socket, roomName, modalIsOpened, setModalIsOpened, currentUser, rooms, setActiveRoom, refreshInvitations, setRefreshInvitations }) => {

    const handleClose = () => { setModalIsOpened(false); };

    const QuitRoom = async () => {
        await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/quitRoomMember/${roomName}/${currentUser.user.username}`, "PATCH");
    }

    const handleRoom = async () => {

        await socket.emit("cancelInvitations", { roomName: roomName });
        setRefreshInvitations(!refreshInvitations);

        await QuitRoom();
        setModalIsOpened(false);
        setRefreshInvitations(!refreshInvitations);
        await socket.emit("quitRoom", { roomName: roomName, username: currentUser.user.username });


        const pos = rooms.map((e) => e.channel.roomName).indexOf(roomName);
        if (pos !== -1) {
            const userPos = rooms[pos].channel.members.map((e) => e.username).indexOf(currentUser.user.username);
            if (userPos !== -1)
                rooms[pos].channel.members.splice(userPos, 1);
            rooms.splice(pos, 1);
        }

        setActiveRoom(undefined);

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
                <Modal.Body className="p-2 text-center">
                    <div>
                        Are-you sure ?
                    </div>
                    <a className="btn-lg" type="button" onClick={(e) => handleRoom()}>
                        <FcCheckmark />
                    </a>
                    <a className="btn-lg" type="button" onClick={(e) => handleClose()} style={{ color: "red" }}>
                        <RxCross2 />
                    </a>

                </Modal.Body>
            </Modal>
        </div >
    )
}

export default ConfirmDeletedRoom;