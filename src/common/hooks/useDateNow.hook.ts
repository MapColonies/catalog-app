import { useEffect, useRef } from 'react';

const SECOND = 1000;

const useDateNow = () => {
    const dateNowRef = useRef(new Date());
  
    useEffect(() => {
      const interval = setInterval(() => {
        dateNowRef.current = new Date();
      }, SECOND);
  
      return () => clearInterval(interval);
    }, []);
  
    return dateNowRef;
  };

export default useDateNow;