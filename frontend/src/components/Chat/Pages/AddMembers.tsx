import React from "react";
import Modal from 'react-bootstrap/Modal';
import UserSearchBar from "../Menu/userSearchBar.tsx";
import { getFetchWithBody } from "../../../services/Fetch.service.ts";

const AddMembers: React.FC = ({ socket, room, roomName, members, setMembers, addMembersIsOpened, setAddMembersIsOpened, setSettingsMembersAreOpened }) => {

    const handleClose = () => { setAddMembersIsOpened(false); };

    const addNewMembers = async () => {
        await getFetchWithBody(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/addNewMembers/${roomName}`, "PATCH", members);
    }
    const handleNewMembers = async () => {
        if (members.length !== 0) {
            if (room.channel.status !== "Private")
                await socket.emit("addNewMember", { members: members, roomName: roomName });
            else
                await socket.emit("newInvitations", { members: members, roomName: roomName });

            setMembers(...members, members);
            await addNewMembers();
            setAddMembersIsOpened(false);
            setSettingsMembersAreOpened(false);
        }
    }

    return (
        <div className="row row-col-md-10 row-col-lg-8 row-col-xl-6 row-mb-10 row-mb-md-10 row-lb-8 row-lb-lg-8 row-xlb-6 row-xlb-xlg-6">
            <Modal
                show={addMembersIsOpened}
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
                    <div>
                        Members :
                        <UserSearchBar roomName={roomName} members={members} setMembers={setMembers} />
                    </div>
                    <button className="btn right mt-2" style={{ backgroundColor: "#8380e1", opacity: "0.7" }} onClick={(e) => handleNewMembers()}>
                        Add new members
                    </button>

                </Modal.Body>
            </Modal>
        </div >
    )
}

export default AddMembers;