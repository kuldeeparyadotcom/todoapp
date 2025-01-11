import Markdown from 'markdown-to-jsx';
import React, { useEffect, useState } from 'react';

function Insights({notifyParentToCloseInsightsIfOpen, todoId}) {
  const[insights, setInsights] = useState('');
  const[loading, setLoading] = useState(false);

  if (todoId === undefined || todoId === '') {
    return null;
  }

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch(`http://localhost:3000/todos/insights/${todoId}`);
        const result = await response.json();
        setInsights(result.insights);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setInsights("\nNo Insights available for this task.");
        setLoading(false);
    }
  };
  setLoading(true);
  fetchInsights();
  }, []);


  async function fetchInsights() {
    try {
      const response = await fetch(`http://localhost:3000/todos/insights/${todoId}`);
      const result = await response.json();
      setInsights(result.insights);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setInsights("\nNo Insights available for this task.");
      setLoading(false);
  }};

  fetchInsights();

  if (loading) {
    <div style={{color: 'white', marginTop: '20px'}}>
      <span style={{fontSize: '24px'}}>Insights</span>
      <button style={{fontSize: '12px', color: 'red', marginLeft: '20px'}} onClick={notifyParentToCloseInsightsIfOpen}>Hide</button>
      <span>
        <Markdown>"### \nGenerating insights... Please wait..."</Markdown>
      </span>
    </div>
  }

  return (
    <div style={{color: 'white', marginTop: '20px'}}>
      <span style={{fontSize: '24px'}}>Insights</span>
      <button style={{fontSize: '12px', color: 'red', marginLeft: '20px'}} onClick={notifyParentToCloseInsightsIfOpen}>Hide</button>
      <span>
        {console.log(`coming from API: ${insights}`)}
        <Markdown>{insights}</Markdown>
      </span>
    </div>
  );
};

export default Insights;
