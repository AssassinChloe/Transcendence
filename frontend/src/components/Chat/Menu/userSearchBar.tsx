import React, { useState, useEffect } from "react";
import Select from 'react-select';
import authService from '../../../services/auth.service.ts';
import { getFetch } from "../../../services/Fetch.service.ts";

const UserSearchBar: React.FC = ({ roomName, members, setMembers }) => {

    const currentUser = authService.getCurrentUser();

    const [options, setOptions] = useState<[]>([]);

    const getUsers = async () => {
        let data: Response;

        if (roomName === undefined) {
            data = await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/user/usersUnblocked`, "GET");
        }
        else
            data = await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/getRoomNonMembers/${roomName}`, "GET");

        const dataJson = await data.json();
        await fillOPtions(dataJson);
    }

    const fillOPtions = async (data) => {
        data.map(user => {
            if (user.username !== currentUser.user.username) {
                const newOption = { value: user.username, label: user.username };
                setOptions([...options, newOption])
                options.push(newOption);
            }
        });
    }

    useEffect(() => {
        getUsers();
    }, [])

    const onChange = async (e) => {
        setMembers(e);
        members.push(e);
    }

    return (
        <div>
            <Select
                isMulti
                name="members"
                options={options}
                className="basic-multi-select"
                classNamePrefix="select"
                onChange={onChange}
            />
        </div>
    )
}

export default UserSearchBar;