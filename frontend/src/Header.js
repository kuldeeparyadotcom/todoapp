import React from "react";
import LoggedInUser from "./LoggedInUser";

function Header({username, handleLogout}) {

  return (
    <div >
      <header className="header">
        <h1>My Todos</h1>
        <LoggedInUser username={username} handleLogout={handleLogout} />
      </header>
    </div>
  );
};

export default Header;