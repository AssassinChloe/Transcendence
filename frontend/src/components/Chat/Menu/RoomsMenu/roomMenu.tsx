import React, { useState, useEffect, useRef } from "react";
import 'react-perfect-scrollbar/dist/css/styles.css';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { RxPencil1 } from "react-icons/rx";
import RoomCreation from "../../Channels/RoomCreation.tsx"
import { FaLock, FaEnvelope, FaLockOpen } from 'react-icons/fa';
import PasswordRequestForm from './passwordRequestForm.tsx'
import { getFetch, getFetchWithBody } from "../../../../services/Fetch.service.ts";
import authService from '../../../../services/auth.service.ts';
import GiveOwnerTitle from "../../Pages/GiveOwnerTitle.tsx"
import ConfirmDeletedRoom from "../../Pages/confirmDeletedRoom.tsx";
import PrivMsgMenu from "../PrivMsgMenu/PrivMsgMenu.tsx";
import "../../../../styles/Chat.css";
import Chat from "../../Pages/Chat.tsx";
import { TbTriangle } from 'react-icons/tb';


const RoomsMenu: React.FC = ({ socket, type, setRefreshIndex, refreshIndex }) => {

  const [rooms, setRooms] = useState<[]>([]);
  const [newRoomisOpen, setNewRoomisOpen] = useState<boolean>(false);
  const [protectedRoomisOpen, setProtectedRoomisOpen] = useState<boolean>(false);
  const [protectedRoom, setProtectedRoom] = useState<string>();
  const [owner, setOwner] = useState();
  const [numberOfMembers, setNumberOfMembers] = useState<number>(1);
  const roomsEndRef = useRef(null);
  const currentUser = authService.getCurrentUser();
  const [refreshPage, setRefreshPage] = useState<boolean>(false);
  const [ownerTitleIsOpened, setOwnerTitleIsOpened] = useState<boolean>(false);
  const [currentRoomName, setCurrentRoomName] = useState<string>("");
  const [quitConfirmation, setQuitConfirmation] = useState<boolean>(false);
  const [activeRoom, setActiveRoom] = useState();
  const [messageList, setMessageList] = useState<[]>([]);
  const [currentLastMsg, setCurrentLastMsg] = useState<string>("");
  const [hasNewRoom, setHasNewRoom] = useState<boolean>(false);
  const [usersUnblocked, setUsersUnblocked] = useState<[]>([]);
  const [isMute, setIsMute] = useState<boolean>(false)

  const getRooms = async () => {
    const data = await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/rooms`, "GET");
    const dataJson = await data.json();
    await setRoomsWithDb(dataJson);
  }

  const getUsersUnblocked = async () => {
    const data = await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/user/usersUnblocked`, "GET");
    const dataJson = await data.json();
    await setUsersBlockedWithDb(dataJson);
  }

  const getOwner = async (roomName: string) => {
    const data = await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/getOwnerByRoomName/${roomName}`, "GET");
    const dataJason = await data.json();
    await setOwner(dataJason);
  }

  const getNbOfUnreadMsg = async (roomName: string) => {
    const data = await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/getNbOfUnreadMsg/${roomName}`, "GET");
    const dataJson = await data.json();

    return dataJson;
  }

  const getNumberOfMembers = async (roomName: string) => {
    const data = await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/countRoomMember/${roomName}`, "GET");
    const dataJason = await data.json();
    await setNumberOfMembers(dataJason);
  }

  const newMemberJoined = async (roomName: string) => {
    const data = { roomName: roomName }
    await getFetchWithBody(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/memberJoined`, "POST", data);
  }

  const setRoomsWithDb = async (data) => {
    for (let elem of data) {
      await setRooms([...rooms, elem]);
      rooms.push(elem);
    }
  }

  const setUsersBlockedWithDb = async (data) => {
    for (let user of data) {
      const pos = usersUnblocked.map((e) => e.id).indexOf(user.id);
      if (pos === -1) {
        await setUsersUnblocked([...usersUnblocked, user]);
        await usersUnblocked.push(user);
      }
    }
  }

  const HandleRightClick = async (room: any) => {
    if (room.channel.status !== "Public") {
      await getOwner(room.channel.roomName);
      await getNumberOfMembers(room.channel.roomName);
      await setCurrentRoomName(room.channel.roomName);

      if (currentUser.user.id === room.channel.owner.id && (room.channel.members.length - 1 > 0)) {
        await setOwnerTitleIsOpened(true);
      }
      else {
        setQuitConfirmation(true);
      }
    }
  }

  useEffect(() => {
    socket.on("userBlocked", async (data) => {
      const pos = usersUnblocked.map((e) => e.id).indexOf(data.user.id);
      if (pos !== -1) {
        usersUnblocked.splice(pos, 1);

        setUsersUnblocked([...usersUnblocked]);
        await setRooms([]);
        setRefreshPage(!refreshPage);
        setActiveRoom(undefined);
      }
      return () => {
        setUsersUnblocked([]);
      }
    });

    socket.on("userUnblocked", async (data) => {
      const pos = usersUnblocked.map((e) => e.id).indexOf(data.user.id);
      if (data.user.usersBlocked == null)
        data.user.usersBlocked = [];
      if (pos === -1 && data.user.usersBlocked.map((e) => e.id).indexOf(currentUser.user.id) === -1) {
        usersUnblocked.push(data.user);
        setUsersUnblocked([...usersUnblocked]);
        await setRooms([]);
        setRefreshPage(!refreshPage);
        setActiveRoom(undefined);
      }
    });

    socket.on("kicked", async (data) => {
      const pos = await rooms.map((e) => e.channel.roomName).indexOf(data.roomName);
      if (pos !== -1) {
        rooms.splice(pos, 1);
        setRooms([...rooms]);
      }
      setActiveRoom(undefined);
    })

    socket.on("reduceNbOfMembers", async (data) => {
      const pos = await rooms.map((e) => e.channel.roomName).indexOf(data.roomName);
      if (pos !== -1) {
        const userPos = rooms[pos].channel.members.map((e) => e.username).indexOf(data.username);
        if (userPos !== -1) {
          rooms[pos].channel.members.splice(userPos, 1);
          setRooms([...rooms]);
        }
      }
    })

    socket.on("updateLastMsg", async (msg) => {
      await getUsersUnblocked();
      const pos = rooms.map((e) => e.channel.roomName).indexOf(msg.destination);
      if (pos !== -1) {
        rooms[pos].numberUnreadMessage = await getNbOfUnreadMsg(msg.destination);
        if (!rooms[pos].lastMessage)
          rooms[pos].lastMessage = [];

        rooms[pos].lastMessage.message = msg.message;
        rooms[pos].lastMessage.timestamp = new Date();
        setCurrentLastMsg(msg.message);
      }
    });

    scrollToBottom();
  }, [rooms, hasNewRoom]);

  useEffect(() => {
    getRooms();

  }, [refreshPage]);

  useEffect(() => {
    getUsersUnblocked()
    socket.on("newMemberAdded", (data) => {
      const pos = rooms.map((e) => e.channel.roomName).indexOf(data.room.channel.roomName);
      if (pos !== -1) {
        rooms[pos].channel.members.push(data.member);
        setRooms([...rooms]);
      }
    });

    socket.on("hasNewRoom", (data) => {
      if (data.room.channel.type !== "PrivMsg") {
        const pos = rooms.map((e) => e.channel.roomName).indexOf(data.room.channel.roomName);
        if (pos === -1) {
          setRooms([...rooms, data.room]);
          rooms.push(data.room);
        }
      }
    });

    socket.on("setActiveRoom", () => { setActiveRoom(undefined); });

    socket.on("passwordChanged", (data) => {
      const pos = rooms.map((e) => e.channel.roomName).indexOf(data.room.channel.roomName);
      if (pos !== -1) {
        rooms[pos].channel.password = data.password;
        setRooms([...rooms]);
      }
    });

    socket.on("passwordDeleted", (data) => {
      const pos = rooms.map((e) => e.channel.roomName).indexOf(data.room.channel.roomName);
      if (pos !== -1)
        rooms[pos].channel.password = null;
      setRooms([...rooms]);
    });

    socket.on("adminAdded", (data) => {
      const pos = rooms.map((e) => e.channel.roomName).indexOf(data.room.channel.roomName);
      if (pos !== -1) {
        rooms[pos].channel.admins.push(data.member);
        setRooms([...rooms]);
      }
    });

    socket.on("reduceNbOfMembers", async (data) => {
      const pos = await rooms.map((e) => e.channel.roomName).indexOf(data.roomName);
      if (pos !== -1) {
        const userPos = rooms[pos].channel.members.map((e) => e.username).indexOf(data.username);
        if (userPos !== -1) {
          rooms[pos].channel.members.splice(userPos, 1);
          setRooms([...rooms]);
        }
      }
    })

    socket.on("RoomQuitted", async (data) => {
      const pos = rooms.map((e) => e.channel.roomName).indexOf(data.roomName);
      if (pos !== -1) {
        const userPos = rooms[pos].channel.members.map((e) => e.username).indexOf(data.username);
        if (userPos !== -1) {
          rooms[pos].channel.members.splice(userPos, 1);
        }
        rooms.splice(pos, 1);
        setRooms([...rooms]);
      }
    });

    socket.on("ownerHasChanged", async (data) => {
      const pos = rooms.map((e) => e.channel.roomName).indexOf(data.roomName);
      if (pos !== -1) {

        const memberPos = rooms[pos].channel.members.map((e) => e.username).indexOf(data.newOwner);
        if (memberPos !== -1) {
          const adminPos = rooms[pos].channel.admins.map((e) => e.username).indexOf(data.newOwner);

          if (adminPos === -1)
            rooms[pos].channel.admins.push(rooms[pos].channel.members[memberPos]);

          rooms[pos].channel.owner = rooms[pos].channel.members[memberPos];
          setRooms([...rooms]);
        }
      }
    });

  }, [activeRoom]);

  const scrollToBottom = () => {
    roomsEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  const roomHandleClick = async (roomName: string, room: any) => {
    if (activeRoom === undefined || activeRoom.channel.id !== room.channel.id) {
      if (isMute === false) {
        await setMessageList([]);
        let oldActiveRoom;

        if (activeRoom !== undefined)
          oldActiveRoom = activeRoom;
        if (room.channel.status !== "Protected" || room.channel.password === null) {
          if (room.channel.status === "Protected") {
            await newMemberJoined(room.channel.roomName);
            const pos = room.channel.membersJoined.map((e) => e.id).indexOf(currentUser.user.id);
            if (pos === -1)
              room.channel.membersJoined.push(currentUser.user);
          }
          await setActiveRoom(room);
          await setMessageList([]);
        }
        else {
          setActiveRoom(undefined)
          setProtectedRoom(room);
          setProtectedRoomisOpen(true);
        }
        if (oldActiveRoom !== undefined) {
          await socket.emit("leaveRoom", oldActiveRoom.channel.roomName);
        }
      }
    }
  }

  const plusHandleClick = async () => {
    setNewRoomisOpen(true);
  }

  const dateFormat = (tmp: Date) => {
    const date = new Date(tmp);
    var intl = new Intl.DateTimeFormat("fr-FR", { hour12: false, hour: "2-digit", minute: "2-digit" });
    return intl.format(date)
  }

  return (
    <div>
      {newRoomisOpen === true && <RoomCreation socket={socket} isOpen={newRoomisOpen} setIsOpen={setNewRoomisOpen} setMessageList={setMessageList} messageList={messageList} setActiveRoom={setActiveRoom} activeRoom={activeRoom} />}
      {protectedRoomisOpen === true && <PasswordRequestForm socket={socket} isOpen={protectedRoomisOpen} setIsOpen={setProtectedRoomisOpen} room={protectedRoom} setActiveRoom={setActiveRoom} activeRoom={activeRoom} />}
      {ownerTitleIsOpened === true && <GiveOwnerTitle socket={socket} roomName={currentRoomName} modalIsOpened={ownerTitleIsOpened} setModalIsOpened={setOwnerTitleIsOpened} currentUser={currentUser} setRefreshPage={setRefreshPage} refreshPage={ReferenceError} rooms={rooms} />}
      {quitConfirmation === true && <ConfirmDeletedRoom socket={socket} roomName={currentRoomName} modalIsOpened={quitConfirmation} setModalIsOpened={setQuitConfirmation} currentUser={currentUser} rooms={rooms} setActiveRoom={setActiveRoom} refreshInvitations={refreshIndex} setRefreshInvitations={setRefreshIndex} />}
      <div className="container" data-mdb-perfect-scrollbar="true">
        {type === "Channel" ?
          <div className="messaging">
            <div className="inbox_msg">
              <div className="inbox_people">
                <div className="headind_srch">
                  <div className="recent_heading">
                    <h4 >Rooms</h4>
                  </div>
                  <a type="button" className="btn right" onClick={() => plusHandleClick()}>
                    <RxPencil1 />
                  </a>
                </div>
                <div className="inbox_chat">
                  <PerfectScrollbar>
                    {React.Children.toArray(
                      rooms.map(room => {
                        return (
                          <span>
                            {activeRoom === room ?
                              <div className="chat_list active_chat">
                                <a type="button" className="d-flex justify-content-between" onContextMenu={(e) => HandleRightClick(room)} onClick={(e) => roomHandleClick(room.channel.roomName, room)}>
                                  <div className="chat_people">
                                    <div className="chat_img">
                                      <TbTriangle size={40} color={room.channel.color} />
                                    </div>
                                    <div className="chat_ib">
                                      <h5>{room.channel.roomName} </h5>
                                      {(room.channel.status !== "Protected") &&
                                        <span>
                                          {room.numberUnreadMessage > 0 &&
                                            <span className="badge bg-danger right">{room.numberUnreadMessage}</span >
                                          }
                                          {room.lastMessage !== undefined && room.lastMessage !== null &&
                                            < span >
                                              <span className="chat_date" style={{ color: 'rgba(157, 156, 208, 0.933)' }}>
                                                {dateFormat(room.lastMessage.timestamp)}
                                              </span>
                                              <p style={{ color: "#8380e1" }}>{room.lastMessage.message}</p>
                                            </span>
                                          }
                                        </span>
                                      }
                                      {room.channel.status === "Protected" && (room.channel.membersJoined.map((e) => e.id).indexOf(currentUser.user.id)) !== -1 &&
                                        <span>
                                          {room.numberUnreadMessage > 0 &&
                                            <span className="badge bg-danger right">{room.numberUnreadMessage}</span >
                                          }
                                          {room.lastMessage !== undefined && room.lastMessage !== null &&
                                            <span>
                                              <span className="chat_date" style={{ color: 'rgba(157, 156, 208, 0.933)' }}>
                                                {dateFormat(room.lastMessage.timestamp)}
                                              </span>
                                              <p style={{ color: "#8380e1" }}>{room.lastMessage.message}</p>
                                            </span>
                                          }
                                        </span>
                                      }
                                    </div>
                                  </div>
                                </a>
                                {room.channel.status === "Public" && <FaLockOpen />}
                                {room.channel.status === "Protected" && <FaLock />}
                                {room.channel.status === "Private" && <FaEnvelope />}

                              </div>
                              :
                              <div className="chat_list">
                                <a type="button" className="d-flex justify-content-between" onContextMenu={(e) => HandleRightClick(room)} onClick={(e) => roomHandleClick(room.channel.roomName, room)}>
                                  <div className="chat_people">
                                    <div className="chat_img">
                                      <TbTriangle size={40} color={room.channel.color} />
                                    </div>
                                    <div className="chat_ib">
                                      <h5>{room.channel.roomName} </h5>
                                      {(room.channel.status !== "Protected") &&
                                        <span>
                                          {room.numberUnreadMessage !== 0 &&
                                            <span className="badge bg-danger right">{room.numberUnreadMessage}</span >
                                          }
                                          {room.lastMessage !== undefined && room.lastMessage !== null &&
                                            <span>
                                              <span className="chat_date" style={{ color: 'rgba(157, 156, 208, 0.933)' }}>
                                                {dateFormat(room.lastMessage.timestamp)}
                                              </span>
                                              <p style={{ color: "#8380e1" }}>{room.lastMessage.message}</p>
                                            </span>
                                          }
                                        </span>
                                      }
                                      {room.channel.status === "Protected" && (room.channel.membersJoined.map((e) => e.id).indexOf(currentUser.user.id)) !== -1 &&
                                        <span>
                                          {room.numberUnreadMessage > 0 &&
                                            <span className="badge bg-danger right">{room.numberUnreadMessage}</span >
                                          }
                                          {room.lastMessage !== undefined && room.lastMessage !== null &&
                                            <span>
                                              <span className="chat_date" style={{ color: 'rgba(157, 156, 208, 0.933)' }}>
                                                {dateFormat(room.lastMessage.timestamp)}
                                              </span>
                                              <p style={{ color: "#8380e1" }}>{room.lastMessage.message}</p>
                                            </span>
                                          }
                                        </span>
                                      }
                                    </div>
                                  </div>
                                </a>
                                {room.channel.status === "Public" && <FaLockOpen />}
                                {room.channel.status === "Protected" && <FaLock />}
                                {room.channel.status === "Private" && <FaEnvelope />}
                              </div>
                            }
                          </span>
                        )
                      })
                    )}
                  </PerfectScrollbar>
                </div>
              </div>
              {activeRoom !== undefined &&
                <Chat socket={socket} room={activeRoom} activeRoom={activeRoom} setActiveRoom={setActiveRoom} messageList={messageList} setMessageList={setMessageList} setCurrentLastMsg={setCurrentLastMsg} rooms={rooms} setRooms={setRooms} setIsMute={setIsMute} isMute={isMute} />
              }
            </div>
          </div >
          :
          <PrivMsgMenu socket={socket} messageList={messageList} setMessageList={setMessageList} />
        }
      </div >
    </div >
  );
}

export default RoomsMenu;
