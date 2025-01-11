import React from "react";
import "./App.css";

function handleDelete(props) {
  fetch(`http://localhost:3000/todos/${props.id}`, {
    method: 'DELETE',
  })
  .then(response => response.text)
  .then(data => {
    console.log('Success:', data);
    props.notifyParent(props.id);
  })
  .catch(error => {
    console.error('Error:', error);
  });
};

function handleTaskStatusChange(id, taskStatus, notifyParentOnTaskStatusChange) {
  fetch(`http://localhost:3000/todos/status/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({id: id, status: taskStatus == 'Done' ? 'NotStarted' : 'Done'}),
  })
  .then(response => response.text)
  .then(data => {
    console.log('Success:', data);
    notifyParentOnTaskStatusChange(id);
  })
  .catch(error => {
    console.error('Error:', error);
  });
};

function ToDo(props) {

  const taskId = props.id;
  console.log(`taskId read from props in TODO ${taskId}`)
  const handleInsightsButtonClick = () => {
    console.log(`insight button onclick handler clicked`)
    props.notifyParentOnInsightsClick();
    props.setInsightsRequestedForTodo(taskId);
    console.log(`set state for prop by assigning ${taskId}`)
  };

  return (
    <>
      <tr key={props.id} style={props.status == 'Done' ? {color: 'gray', background: 'gray', textDecorationLine: 'line-through'} : {}}>
        <td>{props.task}</td>
        <td style={props.priority == 'Top' ? {color: 'red'} : {color: 'yellow'}}>
          {props.priority} Priority
        </td>
        <td>{new Date(props.eta).toISOString().split('T')[0]}</td>
        <td>
          <input type="checkbox" 
            name="taskStatus" 
            defaultChecked={props.status == 'Done' ? true : false} 
            onClick={() => handleTaskStatusChange(props.id, props.status, props.notifyParentOnTaskStatusChange) }
          ></input>
        </td>
        <td>
            <button style={{display: "flex-inline", alignItems: "center", background: "black"}} onClick={handleInsightsButtonClick}> 💡 </button>
            <button className="todo-item.button.delete" onClick={() => handleDelete(props)}> ❌ </button>
        </td>
      </tr>
    </>
  );
};

export default ToDo;