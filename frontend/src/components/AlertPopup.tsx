
import React from 'react'; 
import Alert from '@mui/material/Alert';
import useAlert from '../hooks/UseAlert.tsx';

const AlertPopup = () => {
  const { text, type, action } = useAlert();

  if (text && type && action) {
    return (
      <Alert
      severity="info"
        variant="filled"
        sx={{
            backgroundColor:type,
            position: 'sticky',
			      bottom: '0px',
			      zIndex: 10,
            width : '50%',
            height : '20%',
            fontSize: '1.5em',
            borderColor: '#FFFFFF'
        }}
        action={action}
      >
        {text}
      </Alert>
    );
  } else {
    return <></>;
  }
};

export default AlertPopup;