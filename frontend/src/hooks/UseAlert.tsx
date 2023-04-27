import { useContext } from 'react';
import AlertContext from '../components/AlertContext.tsx';

const useAlert = () => useContext(AlertContext);

export default useAlert;