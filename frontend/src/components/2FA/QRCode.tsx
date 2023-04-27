import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import { QRCodeSVG } from 'qrcode.react';

const QRCode: React.FC = ({ isOpen, setIsOpen, username }) => {

    const navigate = useNavigate();
    const [test, setTest] = useState();
    const generateQRCode = async () => {
        const data = await (fetch(`http://${process.env.REACT_APP_ADDRESS}:7001/user/generateQRCode/${username}`,
            {
                method: "GET",
            }));

        const dataJson = await data.json();
        setTest(dataJson.qrcode);
    }

    useEffect(() => {
        generateQRCode();
    }, [])

    const handleClose = async () => { 
        setIsOpen(false); 
        if (JSON.parse(localStorage.getItem('token')).user.firstConnect)
            navigate("/update")
        else
            navigate("/lobby"); }

    return (
        <Modal
            show={isOpen}
            onHide={handleClose}
            aria-labelledby="contained-modal-title-vcenter"
            centered
            backdrop="static"
            style={{
                backgroundColor: "transparent",
            }}
        >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    Flash this QR Code
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <img src={test} />
            </Modal.Body>
        </Modal >

    )
}

export default QRCode;