import io from "socket.io-client";

export const socket = io.connect(`http://${process.env.REACT_APP_ADDRESS}:5001`, { reconnection: false });

