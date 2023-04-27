import React, { useState } from "react";
import GiveOwnerTitle from "./GiveOwnerTitle.tsx";
import ChatMembers from "./Members.tsx";
import authService from '../../../services/auth.service.ts';
import HandlePassword from './handlePassword.tsx';
import ChatBanned from "./Banned.tsx";
import Dropdown from 'react-bootstrap/Dropdown';


const ChatHeader: React.FC = ({ socket, room, activeRoom, setActiveRoom }) => {

    const currentUser = authService.getCurrentUser();
    const [isRoomOwner, setIsRoomOwner] = useState<boolean>(false);

    const [settingsMembersAreOpened, setSettingsMembersAreOpened] = useState<boolean>(false);
    const [ownerTitleIsOpened, setownerTitleIsOpened] = useState<boolean>(false);
    const [numberOfMembers, setNumberOfMembers] = useState<number>();
    const [handlePasswordIsOpened, setHandlePasswordIsOpened] = useState<boolean>(false);
    const [settingsBannedAreOpened, setSettingsBannedAreOpened] = useState<boolean>(false);


    return (
        <div className="container" >
            <div className="text-center">
                {settingsMembersAreOpened === true && <ChatMembers room={room} socket={socket} roomName={room.channel.roomName} isRoomOwner={currentUser.user.username === room.channel.owner.username} settingsMembersAreOpened={settingsMembersAreOpened} setSettingsMembersAreOpened={setSettingsMembersAreOpened} currentUser={currentUser} setNumberOfMembers={setNumberOfMembers} numberOfMembers={numberOfMembers} owner={room.channel.owner} />}
                {ownerTitleIsOpened === true && <GiveOwnerTitle socket={socket} roomName={room.channel.roomName} modalIsOpened={ownerTitleIsOpened} setModalIsOpened={setownerTitleIsOpened} setIsRoomOwner={setIsRoomOwner} currentUser={currentUser} />}
                {handlePasswordIsOpened === true && <HandlePassword socket={socket} isOpen={handlePasswordIsOpened} setIsOpen={setHandlePasswordIsOpened} room={room} activeRoom={activeRoom} setActiveRoom={setActiveRoom} />}
                {settingsBannedAreOpened === true && <ChatBanned socket={socket} room={room} setModalIsOpen={setSettingsBannedAreOpened} />}
                {(room.channel.status && room.channel.status !== "Public") && room.channel.type !== "PrivMsg" ?
                    <Dropdown>
                        <Dropdown.Toggle className="text-center" style={{ backgroundColor: "transparent", color: "rgba(157, 156, 208, 0.933)", border: "none" }}>
                            {room.channel.type === "PrivMsg" ?
                                <h5 className="text-center" >{room.receiver.username}</h5>
                                :
                                <h5 className="text-center" >{room.channel.roomName}</h5>
                            }
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={(e) => setSettingsMembersAreOpened(true)}>Members</Dropdown.Item>
                            {(currentUser.user.username === room.channel.owner.username) && room.channel.status === "Protected" ?
                                <Dropdown.Item onClick={(e) => setHandlePasswordIsOpened(true)}> Handle password </Dropdown.Item>
                                :
                                <Dropdown.Item disabled="true"> Handle password </Dropdown.Item>
                            }
                            {(currentUser.user.username === room.channel.owner.username) || room.channel.admins.map((e) => e.id).indexOf(currentUser.user.id) !== -1 ?
                                <Dropdown.Item onClick={(e) => setSettingsBannedAreOpened(true)}> Banned </Dropdown.Item>
                                :
                                <Dropdown.Item disabled="true"> Banned </Dropdown.Item>
                            }
                        </Dropdown.Menu>
                    </Dropdown>
                    :
                    <div style={{ backgroundColor: "transparent", color: "rgba(157, 156, 208, 0.933)", border: "none" }}>
                        {room.channel.type === "PrivMsg" ?
                            <h5 className="text-center" >{room.receiver.username}</h5>
                            :
                            <h5 className="text-center" >{room.channel.roomName}</h5>
                        }
                    </div>
                }
            </div>
        </div >
    );
}



export default ChatHeader;
