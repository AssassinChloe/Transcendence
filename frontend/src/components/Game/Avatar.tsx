import React, { useState, FunctionComponent, useEffect } from 'react';
import { getUserById } from '../../services/profile.service.ts';
import Avatar from 'react-avatar'


const MyAvatar: FunctionComponent = ({ username }) => {
	const [user, setUser] = useState();

	useEffect(() => {
		const updateProfile = async () => {
			getUserById(username).then(profile => {
				setUser(profile);
			})
		};
		updateProfile();
	}, []);


	if (user && user.profile) {
		let avatar = user.profile.avatar;
		const verif = avatar.slice(0, 4);
		if (verif !== 'http')
			avatar = process.env.PUBLIC_URL + '/' + avatar;
		return (<Avatar round={true} size="50" src={avatar} />);
	}
}

export default MyAvatar;