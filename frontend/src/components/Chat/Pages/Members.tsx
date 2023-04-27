import React, { useState, useEffect } from "react";
import Modal from 'react-bootstrap/Modal';
import { FcCancel } from "react-icons/fc";
import { RxCross2 } from "react-icons/rx";
import { MdAdminPanelSettings } from "react-icons/md";
import { HiUserAdd } from "react-icons/hi";
import AddMembers from "./AddMembers.tsx";
import { getFetch } from "../../../services/Fetch.service.ts"
import { AiTwotonePropertySafety } from "react-icons/ai";
import { BiVolumeMute } from "react-icons/bi";

const ChatMembers: React.FC = ({ room, socket, roomName, isRoomOwner, setSettingsMembersAreOpened, currentUser, setNumberOfMembers, numberOfMembers, owner }) => {

    const [members, setMembers] = useState<[]>([]);
    const [newMembers, setNewMembers] = useState<[]>([]);
    const [admins, setAdmins] = useState<[]>([]);
    const [isAdmin, setIsAdmin] = useState<boolean>(isRoomOwner);

    const handleClose = () => { setSettingsMembersAreOpened(false); };

    const [addMembersIsOpened, setAddMembersIsOpened] = useState<boolean>(false);

    const getRoomMembers = async () => {
        const data = await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/getMembers/${roomName}`, "GET");
        const dataJson = await data.json();
        await setMembersWithDB(dataJson);
    }

    const addNewAdmin = async (newAdminName: string) => {
        await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/addRoomAdmin/${roomName}/${newAdminName}`, "PATCH");
    }

    const getRoomAdmins = async () => {
        const data = await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/getRoomAdmins/${roomName}`, "GET");
        const dataJson = await data.json();

        await setAdminsWithDB(dataJson);
    }

    const quitRoom = async (username: string) => {
        await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/quitRoomMember/${roomName}/${username}`, "PATCH");
    }

    const banUser = async (username: string) => {
        await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/banUser/${roomName}/${username}`, "PATCH");
    }

    const setMembersWithDB = async (data: any) => {
        for (let member of data) {
            if (member.id !== currentUser.user.id) {
                await setMembers([...members, member]);
                members.push(member);
            }
        }
    }

    const setAdminsWithDB = async (data: any) => {
        for (let admin of data) {
            await setAdmins([...admins, admin]);
            admins.push(admin);
        }
        const posCurrentUserInAdmins = await admins.map((e) => e.id).indexOf(currentUser.user.id);
        if (posCurrentUserInAdmins !== -1)
            setIsAdmin(true);
    }

    useEffect(() => {
        getRoomMembers();
        getRoomAdmins();
    }, [])

    const handleAddMembersButton = async () => {
        setAddMembersIsOpened(true);
    }

    const handleMuteUser = async (memberUsername: string) => {
        socket.emit("muteSomeone", { roomName: roomName, username: memberUsername });
        setSettingsMembersAreOpened(false);
    }


    const handleKickMembersButton = async (memberUsername: string) => {
        await socket.emit("kickMember", { username: memberUsername, roomName: roomName });
        const pos = members.map((e) => e.username).indexOf(memberUsername);
        members.splice(pos, 1);
        setMembers([...members]);

        await quitRoom(memberUsername);
        await setNumberOfMembers(numberOfMembers--);
    }

    const handleAddAdminButton = async (newAdminName: string) => {
        await addNewAdmin(newAdminName);
        await socket.emit("addAdmin", { roomName: roomName, username: newAdminName });
        const pos = room.channel.members.map((e) => e.username).indexOf(newAdminName);
        if (pos !== -1)
            room.channel.admins.push(room.channel.members[pos]);
        setSettingsMembersAreOpened(false);
    }

    const handleUserBanned = async (username: string) => {
        await banUser(username);
        await socket.emit("kickMember", { username: username, roomName: roomName });

        const pos = await members.map((e) => e.username).indexOf(username);
        await members.splice(pos, 1);
        await setNumberOfMembers(numberOfMembers--);
    }

    return (
        <div className="row row-col-md-10 row-col-lg-8 row-col-xl-6 row-mb-10 row-mb-md-10 row-lb-8 row-lb-lg-8 row-xlb-6 row-xlb-xlg-6">
            {addMembersIsOpened === true && <AddMembers socket={socket} room={room} roomName={roomName} addMembersIsOpened={addMembersIsOpened} setAddMembersIsOpened={setAddMembersIsOpened} members={newMembers} setMembers={setNewMembers} setSettingsMembersAreOpened={setSettingsMembersAreOpened} />}
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
                        Members
                    </Modal.Title>
                    {isAdmin === true || isRoomOwner === true ?
                        <a className="btn-lg" type="button" onClick={(e) => handleAddMembersButton()} style={{ color: "#9A617A", padding: "4px" }}>
                            <HiUserAdd />
                        </a>
                        :
                        <a className="btn-lg" type="button" style={{ color: "grey", padding: "4px", cursor: "default" }}>
                            <HiUserAdd />
                        </a>
                    }

                </Modal.Header>
                <Modal.Body>
                    {React.Children.toArray(
                        members.map((member) => {
                            return (
                                <ul className="list-unstyled mb-0" >
                                    {member.username !== currentUser.username &&
                                        <li className="p-2 text-center" style={{ backgroundColor: "#eee" }}>
                                            <div className="card-title">
                                                {member.id === owner.id &&
                                                    <span style={{ padding: "4px", fontStyle: "italic" }}>
                                                        <AiTwotonePropertySafety />
                                                    </span>
                                                }
                                                {member.username}
                                                {admins.map((e) => e.id).indexOf(member.id) !== -1 &&
                                                    <span style={{ color: "#9A617A", padding: "4px", fontStyle: "italic" }}>
                                                        (Admin)
                                                    </span>
                                                }

                                                {isAdmin === true &&
                                                    <span>
                                                        {admins.map((e) => e.id).indexOf(member.id) === -1 && member.id !== owner.id &&
                                                            <a className="btn-lg" type="button" onClick={(e) => handleAddAdminButton(member.username)} style={{ color: "blue", padding: "4px" }}>
                                                                <MdAdminPanelSettings />
                                                            </a>
                                                        }
                                                        {member.id !== owner.id &&
                                                            <span>
                                                                <a className="btn-lg" type="button" onClick={(e) => handleKickMembersButton(member.username)} style={{ color: "red", padding: "4px" }}>
                                                                    <RxCross2 />
                                                                </a>
                                                                <a className="btn-lg" type="button" onClick={(e) => handleMuteUser(member.username)} style={{ color: "green", padding: "4px" }}>
                                                                    <BiVolumeMute />
                                                                </a>
                                                                <a className="btn-lg" type="button" onClick={(e) => handleUserBanned(member.username)} style={{ padding: "4px" }}>
                                                                    <FcCancel />
                                                                </a>
                                                            </span>
                                                        }
                                                    </span>
                                                }
                                            </div>
                                        </li>
                                    }
                                </ul>
                            )
                        })
                    )}
                </Modal.Body>
            </Modal >
        </div >
    )
}

export default ChatMembers;
