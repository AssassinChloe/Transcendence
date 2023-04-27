import React, { useState, useEffect, useRef } from "react";
import PerfectScrollbar from 'react-perfect-scrollbar'
import "react-perfect-scrollbar/dist/css/styles.css";
import ChatHeader from "./Header.tsx"
import Dropdown from 'react-bootstrap/Dropdown';
import authService from '../../../services/auth.service.ts';
import { getFetch, getFetchWithBody } from "../../../services/Fetch.service.ts";
import "../../../styles/Chat.css";
import MyAvatar from "../../Game/Avatar.tsx";
import Custom from "../../Game/Custom.tsx"


const Chat: React.FC = ({ socket, room, activeRoom, setActiveRoom, messageList, setMessageList, rooms, setCurrentLastMsg, setRefreshIndex, refreshIndex, setIsMute, isMute }) => {

  const currentUser = authService.getCurrentUser();
  const [refresh, setRefresh] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [currentMessage, setCurrentMessage] = useState<string>();
  const [usersUnblocked, setUsersUnblocked] = useState<[]>([]);
  const [opponent, setOpponent] = useState<object>({});
  const [launchGameIsOpened, setLaunchGameIsOpened] = useState<boolean>(false);

  const messagesEndRef = useRef(null);

  const getMessages = async () => {
    const data = await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/messages/${room.channel.roomName}`, "GET");
    const dataJson = await data.json();
    await setMessagesWithDb(dataJson);
  }

  const getUsersBlocked = async () => {
    const data = await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/user/usersUnblocked`, "GET");
    const dataJson = await data.json();
    await setUsersBlockedWithDb(dataJson);
  }

  const setMessagesWithDb = async (data) => {
    for (let msg of data) {
      setNewMessage(msg);
    }
  }

  const unmuteUser = async () => {
    const body = { roomId: room.channel.id, userId: currentUser.user.id };
    await getFetchWithBody(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/unmuteUser`, "POST", body);
  }


  const setUsersBlockedWithDb = async (data) => {
    for (let user of data) {
      await setUsersUnblocked([...usersUnblocked, user]);
      await usersUnblocked.push(user);
    }
  }

  const setNewMessage = async (msg) => {
    if (msg !== "") {
      setMessageList([...messageList, msg]);
      messageList.push(msg);
    }
  }

  const dateFormat = (tmp: Date) => {
    const date = new Date(tmp);
    var intl = new Intl.DateTimeFormat("fr-FR", { hour12: false, hour: "2-digit", minute: "2-digit" });
    const year = new Intl.DateTimeFormat('fr', { year: 'numeric' }).format(date);
    const day = new Intl.DateTimeFormat('fr', { day: '2-digit' }).format(date);
    const month = new Intl.DateTimeFormat('en', { month: 'long' }).format(date);
    return day + " " + month + " " + year + " " + intl.format(date);

  }

  const sendMessage = async () => {
    const pattern = /[a-zA-Z0-9]/;
    let ret;
    if (currentMessage !== undefined)
      ret = currentMessage.match(pattern);
    if (ret && currentMessage !== undefined) {
      const msgData = {
        message: currentMessage,
        destination: room.channel.roomName,
        timestamp: new Date(),
        author: currentUser.user,
      };

      await socket.emit('sendMessage', msgData);
      setNewMessage(msgData);
      setCurrentMessage("");
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  useEffect(() => {
    setMessageList([]);
    socket.emit("JoinRoom", room.channel.roomName);
    room.numberUnreadMessage = 0;
    getMessages();
    getUsersBlocked();
    setRefresh(!refresh);

    return () => {
      setMessageList([]);
      socket.emit("leaveRoom", room.channel.roomName);
    }
  }, [room])

  useEffect(() => {
    scrollToBottom();
    socket.on('recMessage', async (msg) => { setNewMessage(msg); });

  }, [messageList]);

  useEffect(() => {
    socket.on("updateLastMsg", async (msg) => {
      await getUsersBlocked();
      if (!room.lastMessage) {
        room.lastMessage = [];
        room.lastMessage.timestamp = new Date();
      }
      if (room.channel.roomName === msg.destination) {
        const pos = usersUnblocked.map((e) => e.id).indexOf(msg.author.id);

        if (pos === -1)
          msg.message = "*******";
        if (msg.message.length > 50)
          msg.message = msg.message.substring(0, 50) + "...";
        room.lastMessage.message = msg.message;
        setCurrentLastMsg(msg);
      }
    });
  }, [currentMessage]);

  useEffect(() => {

    socket.on("kicked", async (msg) => {
      const pos = rooms.map((e) => e.channel.roomName).indexOf(msg.roomName);
      if (pos !== -1) {
        const userPos = rooms[pos].channel.members.map((e) => e.username).indexOf(msg.username);
        if (userPos !== -1) {
          rooms[pos].channel.members.splice(userPos, 1);
        }
        if (msg.roomName === room.channel.roomName && msg.isConnected)
          setActiveRoom(undefined);
      }
    })

    return () => {
      setMessageList([])
    }
  }, [refresh]);

  useEffect(() => {
    socket.on("youAreMute", async (userId) => {
      if (userId === currentUser.user.id) {
        setDisabled(true);
        await setIsMute(true);
        const timer = setTimeout(async () => {
          setDisabled(false);
          await setIsMute(false);
          await unmuteUser();
        }, 5000);

        return async () => {
          clearTimeout(timer);
        }
      }
    })
  }, []);

  function MuteInput() {
    return (
      <input type="text" disabled={disabled} />
    )
  }

  const launchGame = async (opponentId: object) => {
    setOpponent(opponentId);
    setLaunchGameIsOpened(true);
  }

  const handleInput = async (e) => {
    if (e.key === "Enter") {
      sendMessage();
      e.preventDefault()
    }
  }

  return (
    <div className="mesgs" id="container">
      <ChatHeader socket={socket} room={room} refresh={refresh} setRefresh={setRefresh} refreshIndex={refreshIndex} setRefreshIndex={setRefreshIndex} activeRoom={activeRoom} setActiveRoom={setActiveRoom} />
      {launchGameIsOpened && <Custom socket={socket} isOpen={launchGameIsOpened} setIsOpen={setLaunchGameIsOpened} user={currentUser.user} buddy={opponent} />}
      <div className="msg_history" data-mdb-perfect-scrollbar="true" style={{ height: "40em" }}>
        <PerfectScrollbar >
          {
            React.Children.toArray(
              messageList.map((message) => {
                return (
                  <div ref={messagesEndRef}>
                    {message.author.username !== currentUser.user.username ?
                      <div className="incoming_msg">
                        <Dropdown style={{ height: "1px", paddingBottom: "10px", paddingTop: "5px" }}>
                          <Dropdown.Toggle as="button" style={{ backgroundColor: "transparent", border: "none" }}>
                            <MyAvatar username={message.author.username} />
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item href={`http://${process.env.REACT_APP_ADDRESS}:3000/user/${message.author.username}`} >Profile</Dropdown.Item>
                            <Dropdown.Item href='#' onClick={(e) => launchGame({ id: message.author.id, username: message.author.username })}>Launch game</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                        <div className="received_msg">
                          {usersUnblocked.map((e) => e.id).indexOf(message.author.id) !== -1 ?
                            <div className="received_withd_msg">
                              <p style={{ paddingLeft: "60px", backgroundColor: "#B9B8B3" }}>{message.message}</p>
                            </div>
                            :
                            <div className="received_withd_msg" style={{ color: "transparent", textShadow: "0 0 8px #000", userSelect: "none" }}>
                              *******************************
                            </div>
                          }
                          <span className="time_date"> {dateFormat(message.timestamp)}</span>
                          <div ref={messagesEndRef} />
                        </div>
                      </div>
                      :
                      <div className="outgoing_msg">
                        <div className="sent_msg">
                          <p style={{ backgroundColor: room.channel.color }}>{message.message}</p>
                          <span className="time_date"> {dateFormat(message.timestamp)}</span> </div>
                        <div ref={messagesEndRef} />
                      </div>
                    }
                  </div>
                )
              })
            )}
        </PerfectScrollbar >

      </div>
      <span>
        {disabled === true ?
          <MuteInput />
          :
          <div className="type_msg">
            <div className="input_msg_write">
              <textarea maxLength="80" type="text" className="write_msg" placeholder="Type a message" onKeyPress={(e) => { handleInput(e) }} onChange={(e) => { setCurrentMessage(e.target.value); }} value={currentMessage || ''} aria-label="Recipient's username" aria-describedby="button-addon2" onClick={(e) => room.numberUnreadMessage = 0} disabled={disabled} style={{ resize: "none" }} />
              <button className="msg_send_btn" type="submit" onClick={sendMessage}></button>
            </div>
          </div>
        }
      </span>
    </div>
  )
}

export default Chat;
