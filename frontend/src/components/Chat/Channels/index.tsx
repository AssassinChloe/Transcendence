import React from 'react';
import RoomCreation from './RoomCreation.tsx';

const ChannelPage: React.FC = ({socket}) => {
    return (
        <div className="row d-flex justify-content-center">
            <div className="col-md-8 col-lg-6 col-xl-4">
                <div className="card">
                    <RoomCreation socket={socket}/>
                </div>
            </div>
        </div>
    )
}

export default ChannelPage;