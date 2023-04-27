import React, { createContext, useState } from 'react';

const ALERT_TIME = 10000;
const initialState = {
  text: '',
  type: '',
  action:''
};

const AlertContext = createContext({
  ...initialState,
  setAlert: () => {},
});

export const AlertProvider = ({ children }) => {
  const [text, setText] = useState('');
  const [type, setType] = useState('');
  const [action, setAction] = useState('');

  const setAlert = (text, type, action) => {
    setText(text);
    setType(type);
    setAction(action);

    setTimeout(() => {
      setText('');
      setType('');
      setAction('');
    }, ALERT_TIME);
  };

  return (
    <AlertContext.Provider
      value={{
        text,
        type,
        action,
        setAlert,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export default AlertContext;