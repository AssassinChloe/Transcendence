import React, { useState, useEffect} from "react";
import Select from 'react-select';
import { authHeader } from "../../services/AuthHeader.ts";

const FriendSearchBar: React.FC = (props) => {

    const [options, setOptions] = useState<[]>([]);

    const getUsers = async () => {
        try
        {
            const response = await fetch(`http://${process.env.REACT_APP_ADDRESS}:7001/profile/friends`, {
            method: "GET",
            headers: authHeader(),
            body: null,
            redirect: "follow",
            });
            const result_1 = await response.json();
            if (!response.ok)
            {
                return "error";
            }
            await fillOPtions(result_1);
        } catch (error) 
        {
            return error;
        }
    }

    const fillOPtions = async (data) => {
        data.map(user => {
            if (user.id !== props.user.id && user.connected === true && user.ingame === false) {
                const newOption = { value: user.id, label: user.username };
                setOptions([...options, newOption])
                options.push(newOption);
            }
        });
    }

    useEffect(() => {
        getUsers();
    }, [])

    const onChange = async (e) => {
        props.setPlayer2(e.value);
    }

    return (
        <div>
            <Select
                options={options}
                className="basic-multi-select"
                classNamePrefix="select"
                onChange={onChange}
            />
        </div>
    )
}

export default FriendSearchBar;