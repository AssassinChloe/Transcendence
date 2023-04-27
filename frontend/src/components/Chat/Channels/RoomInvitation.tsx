import React, { useState, useEffect } from "react";
import 'react-perfect-scrollbar/dist/css/styles.css';
import { FcCheckmark } from "react-icons/fc";
import 'react-perfect-scrollbar/dist/css/styles.css';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { RxCross2 } from "react-icons/rx";
import { getFetch } from "../../../services/Fetch.service.ts"
import authService from "../../../services/auth.service.ts"
import "../../../styles/Chat.css";
const RoomInvitation: React.FC = ({ socket }) => {

    const [invitations, setInvitations] = useState<[]>([]);
    const currentUser = authService.getCurrentUser();

    const getInvitations = async () => {
        const data = await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/getRoomInvitations`, "GET");
        const dataJson = await data.json();

        await setInvitationsWithDB(dataJson);
    }

    const declineInvitation = async (roomName: string) => {
        await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/invitationDeclined/${roomName}`, "PATCH")
    }

    const AcceptInvitation = async (roomName: string) => {
        await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/invitationAccepted/${roomName}`, "PATCH")
    }

    const setInvitationsWithDB = async (data) => {
        for (let elem of data) {
            setInvitations([...invitations, elem]);
            invitations.push(elem);
        }
    }

    useEffect(() => {
        getInvitations();
    }, [])

    useEffect(() => {
        socket.on('haveNewInvitation', (data) => {
            setInvitations([...invitations, data.room]);
            invitations.push(data.room);
        });

        socket.on("cancelInvitation", (roomName) => {
            const pos = invitations.map((e) => e.roomName).indexOf(roomName);
            if (pos !== -1) {
                invitations.splice(pos, 1);
                setInvitations([...invitations]);
            }
        });

    })

    const acceptInvitations = async (roomName: string) => {
        const pos = invitations.map((e) => e.roomName).indexOf(roomName);
        if (pos !== -1) {
            invitations.splice(pos, 1);
            setInvitations([...invitations]);
        }

        await socket.emit("JoinRoom", roomName);
        await socket.emit("invitationAccepted", { roomName: roomName, username: currentUser.user.username });
        await AcceptInvitation(roomName);
    }

    const declineInvitations = async (roomName: string) => {
        const pos = invitations.map((e) => e.roomName).indexOf(roomName);
        if (pos !== -1) {
            invitations.splice(pos, 1);
            setInvitations([...invitations]);
        }
        await declineInvitation(roomName);
    }

    return (
        <div className="container d-flex justify-content-center" style={{ backgroundColor: "#eee", height: "100%" }}>
            <div className="container">
                <div className="row row-col-md-12 row-col-lg-12 row-col-xl-12 row-mb-12 row-mb-md-12 row-lb-12 row-lb-lg-12 row-xlb-12 row-xlb-xlg-12">
                    <div className="col-md-12 col-lg-12 col-xl-12 mb-12 mb-md-12 lb-12 lb-lg-12 xlb-12 lb-xlg-12" >
                        <h4 style={{ color: "#05728f" }}>Invitations</h4>
                        <div className="card">
                            <div className="col-md-12 col-lg-12 col-xl-12 mb-12 mb-md-12 lb-12 lb-lg-12 xlb-12 xlb-xlg-12">
                                <div className="card-body" data-mdb-perfect-scrollbar="true" style={{ position: "relative", height: "30em" }}>
                                    <PerfectScrollbar>
                                        {
                                            React.Children.toArray(
                                                invitations.map((invitation) => {
                                                    return (
                                                        <ul className="list-unstyled mb-0" >
                                                            <li className="p-2 text-center" style={{ backgroundColor: "#eee" }}>
                                                                <div className="card-title">
                                                                    {invitation.roomName}
                                                                </div>
                                                                <div className="card-body">
                                                                    <div className="card-text">
                                                                        You're invited to join {invitation.roomName}
                                                                        <a className="btn-lg" type="button" onClick={(e) => acceptInvitations(invitation.roomName)}>
                                                                            <FcCheckmark />
                                                                        </a>
                                                                        <a className="btn-lg" type="button" onClick={(e) => declineInvitations(invitation.roomName)} style={{ color: "red" }}>
                                                                            <RxCross2 />
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        </ul>
                                                    )
                                                })
                                            )
                                        }
                                    </PerfectScrollbar>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

}

export default RoomInvitation;