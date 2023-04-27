import React, { useState, useEffect } from "react";
import RoomInvitation from '../Channels/RoomInvitation.tsx';
import RoomsMenu from "./RoomsMenu/roomMenu.tsx";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import '../../../styles/Tabs.css'

const ChatMenu: React.FC = ({ socket }) => {

    const [refresh, setRefresh] = useState<boolean>();
    const [newInvitations, setNewInvitations] = useState<boolean>(false);

    useEffect(() => {
        setNewInvitations(!newInvitations);
    }, [refresh]);

    return (
        <div className="container d-flex justify-content-center">
            <div className="col-md-8 col-lg-6 col-xl-4" style={{ width: "100%" }}>
                <div className="card" style={{ height: "100%", backgroundColor: "#eee" }}>
                    <Tabs style={{ backgroundColor: "#eee", tabSelected: "blue" }}>
                        <TabList>
                            <Tab> My Rooms
                            </Tab>
                            <Tab> Invitations </Tab>
                            <Tab> Private messages </Tab>
                        </TabList>
                        <TabPanel>
                            <div onContextMenu={(e) => { e.preventDefault(); }} >
                                <RoomsMenu socket={socket} type="Channel" refreshIndex={refresh} setRefreshIndex={setRefresh} />
                            </div>
                        </TabPanel>
                        <TabPanel>
                            <RoomInvitation socket={socket} />
                        </TabPanel>
                        <TabPanel>
                            <RoomsMenu socket={socket} type="PrivMsg" refreshIndex={refresh} setRefreshIndex={setRefresh} />
                        </TabPanel>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}

export default ChatMenu;