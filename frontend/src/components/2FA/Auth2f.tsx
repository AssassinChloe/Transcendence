import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import OtpInput from 'otp-input-react';

const Auth2F: React.FC = ({ isOpen, setIsOpen, username, token, setToken, setRedirect }) => {

    const [isValidate, setIsValidate] = useState<boolean>(false);
    const [code, setCode] = useState<[]>([]);
    const navigate = useNavigate();

    const verifyCode = async () => {
        if (code.length > 0) {
            const data = await (fetch(`http://${process.env.REACT_APP_ADDRESS}:7001/user/verifyCode/${token.user.username}/${code}`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                }))
            const dataJson = await data.json();
            setIsValidate(dataJson);
        }
    }

    useEffect(() => {
        if (isValidate) {
            setIsOpen(false);
            localStorage.setItem('token', JSON.stringify(token));
            setToken(token);
            setRedirect(!token);
            if (localStorage.getItem('token') && localStorage.getItem(token.user.firstConnect))
                navigate("/update");
            else
                navigate("/lobby")
        }
    }, [isValidate])

    const handleClose = async () => { setIsOpen(false); }

    return (
        <Modal show={isOpen} onHide={handleClose} aria-labelledby="title-vcenter" backdrop="static" centered style={{ backgroundColor: "transparent", }}>
            <Modal.Header>
            <Modal.Title id="contained-modal-title-vcenter">
                    Enter your 6 digit code
                </Modal.Title>
            </Modal.Header>
            <Modal.Body >
                <OtpInput value={code} onChange={setCode} autofocus OTPLength={6} otpType="number" />
                <button className="btn btn-blue" type="submit" onClick={(e) => verifyCode()} >Send</button>
            </Modal.Body>
        </Modal >
    )
}

export default Auth2F;