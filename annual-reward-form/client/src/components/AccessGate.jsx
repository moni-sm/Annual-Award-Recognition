import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AccessGate.css';

const AccessGate = () => {
  const navigate = useNavigate();
  const location = useLocation(); // ✅ Use hook instead of global object

  useEffect(() => {
    const today = new Date();
    const day = today.getDate();
    console.log("Today is:", day);

    // Use location.pathname from the hook, not the global
    if ((day < 2 || day > 9) && location.pathname !== '/access') {
      navigate('/access', { replace: true });
    }
  }, [navigate, location.pathname]); // ✅ This is now valid

  return (
    <div className="access-wrapper">
      <h2 className="access-message">
        🚫 The Rewards & Recognition form is accessible only from <strong>2nd to 9th</strong> of each month.<br />
        Please try again during the nomination period.
      </h2>
    </div>
  );
};

export default AccessGate;
