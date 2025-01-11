import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import ToDosList from "./ToDosList";
import { useState } from "react";
import Insights from "./Insights";

function App() {
  const [username, setUsername] = useState('');
  const [showInsights, setShowInsights] = useState(false);
  const [insightsRequestedForTodo, setInsightsRequestedForTodo] = useState('');

  function handleLogout() {
    setUsername('');
  };
  
  function handleInsightsClick() {
    !showInsights && setShowInsights(!showInsights);
  };

  function closeInsightsIfShown() {
    console.log('Request to hide insights is received');
    console.log('current value of showInsights:', showInsights);
    // only if insights are shown, close insights
    showInsights && setShowInsights(!showInsights);
  }

  return (
    <div className="container">
      <Header username={username} handleLogout={handleLogout} />
      <ToDosList 
        notifyParentOnInsightsClick={handleInsightsClick} 
        notifyParentToCloseInsightsIfOpen={closeInsightsIfShown} 
        setInsightsRequestedForTodo={setInsightsRequestedForTodo}/>
      
      {showInsights && <Insights notifyParentToCloseInsightsIfOpen={closeInsightsIfShown} todoId={insightsRequestedForTodo}/>}
      <Footer />
    </div>
  );
};

export default App;