import React, { useState, useEffect } from "react";
import Select from 'react-select';
import authService from '../../../../services/auth.service.ts';
import { getFetch } from "../../../../services/Fetch.service.ts";

const NewOwnerSearchBar: React.FC = ({ roomName, newOwner, setNewOwner }) => {

    const currentUser = authService.getCurrentUser();

    const [options, setOptions] = useState<[]>([]);

    const getUsers = async () => {
        const data = await getFetch(`http://${process.env.REACT_APP_ADDRESS}:7001/chat/getMembers/${roomName}`, "GET");
        const dataJson = await data.json();

        await fillOptions(dataJson);
    }

    const fillOptions = async (data) => {
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
        setNewOwner(e);
        newOwner = e;
    }

    return (
        <div>
            <Select
                name="members"
                options={options}
                className="basic-multi-select"
                classNamePrefix="select"
                onChange={onChange}
            />
        </div>
    )
}

export default NewOwnerSearchBar;