import React from "react";
import { useState, useEffect } from "react";
import "./App.css";
import ToDo from "./ToDo";
import NewToDo from "./NewToDo";

function ToDosList({notifyParentOnInsightsClick, notifyParentToCloseInsightsIfOpen, setInsightsRequestedForTodo}) {
    const [alltodos, setalltodos] = useState([]);

    useEffect(() => {
      const fetchAllTodos = async () => {
        try {
          const response = await fetch("http://localhost:3000/todos/");
          const result = await response.json();
          setalltodos(result);
        } catch (error) {
          console.log("TODO - Sometimes it just needs one more refresh");
          console.error('Error:', error);
      }
    };
    fetchAllTodos();
    }, []);

    function handleNewToDo(newToDoObj) {
      setalltodos((oldValue) => [...oldValue, newToDoObj]);
      // show insights when a new todo is added
      setInsightsRequestedForTodo(newToDoObj.id);
      notifyParentOnInsightsClick();
    };

    function handleDelete(taskId) {
      setalltodos((oldValue) => oldValue.filter((todo) => todo.id !== taskId));
    };

    function handleTaskStatusChange(taskId) {
      setalltodos((oldValue) => oldValue.map((todo) => {
        if (todo.id === taskId) {
          if (todo.status === 'Done') {
            todo.status = 'NotStarted';
          } else {
            todo.status = 'Done';
          }
        }
        return todo;
      }));
    };

    function handleSortingByPriority() {
      setalltodos([...alltodos].sort((a, b) => b.priority.localeCompare(a.priority)));
    };

    function handleSortingByStatus() {
      setalltodos([...alltodos].sort((a, b) => b.status.localeCompare(a.status)));
    };

    function handleSortingByETA() {
      setalltodos([...alltodos].sort((a, b) => new Date(a.eta) - new Date(b.eta)));
    };
    
  function handleAddNewClick() {
    // it means form is open so get the insights closed if open
    notifyParentToCloseInsightsIfOpen();
  };

  return (
    <>
      <table className="todo-list-table">
        <thead>
          <tr>
            <th>
              Task &nbsp;
            </th>
            <th>
              Priority &nbsp;
              <span>
                <button onClick={(handleSortingByPriority)}>⬇️</button>
              </span>
            </th>
            
            <th>
              ETA &nbsp;
              <button onClick={(handleSortingByETA)}>⬇️</button>
            </th>
            <th>
              Status &nbsp;
              <button onClick={(handleSortingByStatus)}>⬇️</button>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {alltodos.map((todo) => (
            <ToDo
              notifyParent={handleDelete}
              notifyParentOnTaskStatusChange={handleTaskStatusChange}
              notifyParentOnInsightsClick={notifyParentOnInsightsClick}
              key={todo.id}
              id={todo.id}
              task={todo.task}
              priority={todo.priority}
              eta={todo.eta}
              status={todo.status}
              setInsightsRequestedForTodo={setInsightsRequestedForTodo}
            />
          ))}
        </tbody>
      </table>

      <div><NewToDo notifyParent={handleNewToDo} notifyParentOnAddNewClick={handleAddNewClick} /></div>
    </>
  );
};

export default ToDosList;
