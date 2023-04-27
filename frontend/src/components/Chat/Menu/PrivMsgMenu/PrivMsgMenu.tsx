import React, { useState, useEffect, useRef } from "react";
import 'react-perfect-scrollbar/dist/css/styles.css';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { getFetch } from "../../../../services/Fetch.service.ts"
import { RxPencil1 } from "react-icons/rx";
import MPCreation from "../../Channels/PrivateMessageCreation.tsx";
import Chat from "../../Pages/Chat.tsx";
import MyAvatar from "../../../Game/Avatar.tsx";

const PrivMsgMenu: React.FC = ({ socket, messageList, setMessageList }) => {

    const [convs, setConvs] = useState<[]>([]);
    const [modalIsOpened, setModalIsOpened] = useState<boolean>(false);
    const roomsEndRef = useRef(null);
    const [activeRoom, setActiveRoom] = useState();
    const [refresh, setRefresh] = useState<boolean>(false);
    const [currentLastMsg, setCurrentLastMsg] = useState<string>("");

    const getPrivMsg = async () => {
        const data = await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/privmsgMenu`, "GET");
        const dataJson = await data.json();
        await setConversationsWithDB(dataJson);
    }

    const setConversationsWithDB = async (data) => {
        for (let elem of data) {
            setConvs([...convs, elem]);
            convs.push(elem);
        }
    }

    const createConversation = async () => {
        setModalIsOpened(true);
    }

    const getNbOfUnreadMsg = async (roomName: string) => {
        const data = await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/getNbOfUnreadMsg/${roomName}`, "GET");
        const dataJson = await data.json();

        return dataJson;
    }

    const scrollToBottom = () => {
        roomsEndRef.current?.scrollIntoView({ behavior: "auto" });
    };

    useEffect(() => {
        socket.on("hasNewRoom", async (data) => {
            const pos = convs.map((e) => e.roomName).indexOf(data.room.channel.roomName);
            if (pos !== -1) {
                convs[pos] = data.room;
            }
            setConvs([...convs, data.room]);
        });

        scrollToBottom();
    }, [convs]);

    useEffect(() => {
        setMessageList([]);
        getPrivMsg();
    }, [refresh]);

    useEffect(() => {
        socket.on("handlePrivMsg", async (data) => {
            const pos = convs.map((e) => e.channel.roomName).indexOf(data.room.channel.roomName);
            if (pos !== -1)
                convs.splice(pos, 1);
        });

        socket.on("setActiveRoom", async () => {
            setActiveRoom(undefined);
        });


        socket.on("handlePrivMsgUnblocked", async (data) => {
            const pos = convs.map((e) => e.channel.roomName).indexOf(data.room.channel.roomName);
            if (pos === -1) {
                setConvs([...convs, data.room])
            }
        });

        socket.on("updateLastMsg", async (msg) => {
            const value = await getNbOfUnreadMsg(msg.destination);
            const pos = convs.map((e) => e.channel.roomName).indexOf(msg.destination);

            if (pos !== -1) {
                convs[pos].numberUnreadMessage = value;
                if (!convs[pos].lastMessage)
                    convs[pos].lastMessage = [];
                convs[pos].lastMessage.message = msg.message;
                convs[pos].lastMessage.timestamp = new Date();
                setCurrentLastMsg(msg.message);
            }
        });
    })

    const dateFormat = (tmp: Date) => {
        const date = new Date(tmp);
        var intl = new Intl.DateTimeFormat("fr-FR", { hour12: false, hour: "2-digit", minute: "2-digit" });
        return intl.format(date)
    }

    const roomHandleClick = async (room: any) => {
        if (activeRoom !== room) {
            setActiveRoom(room);
            await setMessageList([]);
        }
    }

    return (
        <span>
            {modalIsOpened === true && <MPCreation socket={socket} modalIsOpened={modalIsOpened} setModalIsOpened={setModalIsOpened} rooms={convs} setRooms={setConvs} refresh={refresh} setRefresh={setRefresh} setActiveRoom={setActiveRoom} setMessageList={setMessageList} activeRoom={activeRoom} messageList={messageList} />}
            <div className="messaging">
                <div className="inbox_msg">
                    <div className="inbox_people">
                        <div className="headind_srch">
                            <div className="recent_heading">
                                <h4>Rooms</h4>
                            </div>
                            <a type="button" onClick={(e) => createConversation()} className="btn right">
                                <RxPencil1 />
                            </a>
                        </div>
                        <div className="inbox_chat">
                            <PerfectScrollbar >
                                {React.Children.toArray(
                                    convs.map(conv => {
                                        return (
                                            <div>
                                                {activeRoom === conv ?
                                                    <div className="chat_list active_chat">
                                                        <a type="button" className="d-flex justify-content-between" onClick={(e) => roomHandleClick(conv)} style={{ textDecoration: "none" }}>
                                                            <div className="chat_people">
                                                                {conv.receiver !== null && conv.receiver !== undefined &&

                                                                    <div>
                                                                        <MyAvatar username={conv.receiver.username} />
                                                                        <h6 style={{ color: "black", marginLeft: "30px", marginTop: "10px" }}>{conv.receiver.username} </h6>
                                                                    </div>
                                                                }
                                                                <div className="chat_date">
                                                                    {conv.numberUnreadMessage > 0 &&
                                                                        <span className="badge bg-danger right">{conv.numberUnreadMessage}</span >
                                                                    }
                                                                    {conv.lastMessage !== null && conv.lastMessage !== undefined &&
                                                                        <span>
                                                                            <span className="" style={{ color: 'rgba(157, 156, 208, 0.933)' }}> {dateFormat(conv.lastMessage.timestamp)}</span>
                                                                            <p style={{ color: "#8380e1" }}>{conv.lastMessage.message}</p>
                                                                        </span>
                                                                    }
                                                                </div>
                                                            </div>
                                                        </a>
                                                    </div>
                                                    :
                                                    <div className="chat_list">
                                                        <a type="button" className="d-flex justify-content-between" onClick={(e) => roomHandleClick(conv)} style={{ textDecoration: "none" }}>
                                                            <div className="chat_people">
                                                                {conv.receiver !== null && conv.receiver !== undefined &&
                                                                    <div>
                                                                        <MyAvatar username={conv.receiver.username} />
                                                                        <h6 style={{ color: "black", marginLeft: "30px", marginTop: "10px" }}>{conv.receiver.username} </h6>
                                                                    </div>
                                                                }
                                                                <div className="chat_date">
                                                                    {conv.numberUnreadMessage > 0 &&
                                                                        <span className="badge bg-danger right">{conv.numberUnreadMessage}</span >
                                                                    }
                                                                    {conv.lastMessage !== null && conv.lastMessage !== undefined &&
                                                                        <span>
                                                                            <span className="" style={{ color: 'rgba(157, 156, 208, 0.933)' }}> {dateFormat(conv.lastMessage.timestamp)}</span>
                                                                            <p style={{ color: "#8380e1" }}>{conv.lastMessage.message}</p>
                                                                        </span>
                                                                    }
                                                                </div>
                                                            </div>
                                                        </a>
                                                    </div>
                                                }
                                            </div>
                                        )
                                    })
                                )}
                            </PerfectScrollbar>
                        </div>
                    </div>
                    {
                        activeRoom !== undefined &&
                        <Chat socket={socket} room={activeRoom} activeRoom={activeRoom} messageList={messageList} setMessageList={setMessageList} setCurrentLastMsg={setCurrentLastMsg} />
                    }
                </div >

            </div >

        </span >

    )
}
export default PrivMsgMenu;