import React from "react";
import "./App.css";

function LoggedInUser({username, handleLogout}) {

    if (username === '' || username === null || username === undefined) {
        return (
            <div className="logged-in-user">
                <h2>Welcome Guest!</h2>
                <p style={{color: 'white'}}>Please LogIn first.</p>
            </div>
        );
    };

  return (
    <>
    <div className="logged-in-user">
        <span><img src="https://via.placeholder.com/50" alt="User Avatar" /></span>
        <span><h3>Welcome {username} </h3></span>
        <span><button onClick={handleLogout}>Log Out</button></span>
    </div>
    
    </>
  );
};

export default LoggedInUser;