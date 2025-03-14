import React from "react";

const Action = (props) => {
  // Add validation function for priority
  const validateAndChangePriority = () => {
    const newPriority = prompt("Enter new priority:", props.selectedTask.priority);
    
    // Check if the user clicked Cancel
    if (newPriority === null) return;
    
    // Validate the priority
    const validPriorities = ["High", "Medium", "Low"];
    if (!validPriorities.includes(newPriority)) {
      alert("Invalid priority! Please enter High, Medium, or Low.");
      return;
    }
    
    // If valid, call the handler function
    props.handleChangePriority(newPriority);
  };

  return (
    <div className="mt-2 space-x-2">
      <button
        className="btn btn-secondary"
        onClick={() =>
          props.handleEditTask(prompt("Edit task:", props.selectedTask.text))
        }
      >
        Edit
      </button>
      <button
        className="btn btn-secondary"
        onClick={validateAndChangePriority}
      >
        Change Priority
      </button>
      <button
        className="btn btn-secondary"
        onClick={() => {
          window.alert(
            `Press Sure Wan't Delete ${props.priority} Priority Task`
          );
          props.handleDeleteTask();
        }}
      >
        Delete
      </button>
    </div>
  );
};

export default Action;