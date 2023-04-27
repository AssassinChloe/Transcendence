import React from 'react';
import Chat from "./Chat.tsx";

const ChatPage: React.FC = ({ socket }) => {
    return (
        <div className="row d-flex justify-content-center">
            <div className="col-md-8 col-lg-8 col-xl-8">
                <div className="card">
                    <Chat socket={socket} />
                </div>
            </div>
        </div>
    )
}

export default ChatPage;