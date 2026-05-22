import React from 'react';

function Toast({ message, type, show }) {
  if (!show) return null;
  
  return (
    <div className={`toast ${type} show`}>
      {message}
    </div>
  );
}

export default Toast;
