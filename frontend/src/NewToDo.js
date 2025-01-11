import React, { useState } from 'react';

function NewToDo ({notifyParent, notifyParentOnAddNewClick}) {
    const [task, setTask] = useState("");
    const [priority, setPriority] = useState("Top");
    const [showForm, setShowForm] = useState(false);
    const [eta, setEta] = useState(new Date().toISOString().split('T')[0]);

    const today = new Date().toISOString().split('T')[0];

    function addNewButtonClicked() {
        setShowForm(!showForm)
        // notify TODO list that add new button was clicked so get the insights closed if open
        notifyParentOnAddNewClick();
    };

    if (!showForm) {
        return (
            <div className='add-todo'>
                <button onClick={addNewButtonClicked}> ✍️ Add New </button>
            </div>
        );
    }

    const handleSubmit = (e) => {
        console.log(eta);
        e.preventDefault();
        if (task.trim()) {
            fetch('http://localhost:3000/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ task: task, priority: priority, eta: eta}),
            })
            .then(response => response.json())
            .then(data => {
                notifyParent(data);
            })
            .catch(error => {
                console.error('Error:', error);
            });
            setTask('');
            setShowForm(false);
        }
    };

    return (
        <div className='add-todo'>
            <form onSubmit={handleSubmit}>
                <input autoFocus
                    type="text"
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    placeholder="Enter new task"
                />

                <label htmlFor="priority"> Priority: </label>
                <select onChange={(e) => setPriority(e.target.value)}>
                    <option value="Top" id='Top' defaultChecked="true">🔥 Top</option>
                    <option value="Low" id='Low'>💁 Low</option>
                </select>

                <label htmlFor="eta"> ETA: </label>
                <input style={{background: 'white'}} type="date" id="eta" name="eta" defaultValue={eta} min={today} max={12/29/2029} onChange={(e)=>setEta(e.target.valueAsDate)}/>

                <button type="submit">Add</button>
                <button type="cancel" onClick={() => setShowForm(!showForm)}>Cancel</button>
            </form>
        </div>
    );
};

export default NewToDo;