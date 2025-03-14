import React, { useEffect, useState } from "react";
import Layout from "./Layout";

// Define API base URL - update this with your actual backend URL
// const API_URL = "http://localhost:5000/api";
const API_URL = process.env.REACT_APP_API_URL

const TaskDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [textInput, setTextInput] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("High");
  const [selectedTask, setSelectedTask] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Initialize from localStorage and then try to sync with API
  useEffect(() => {
    // First load from localStorage
    const storedTasks = localStorage.getItem("tasks");
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    }
    
    // Then try to fetch from API
    fetchTasks();
    
    // Setup offline detection
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const handleOnline = () => {
    setIsOffline(false);
    fetchTasks(); // Sync with server when back online
  };

  const handleOffline = () => {
    setIsOffline(true);
  };

  // API call to fetch all tasks using fetch instead of axios
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/tasks`);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      // If we can't fetch from API, we'll use what's in localStorage
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  };

  // With Help Of State Management We Handle Input Change
  const handleTextInputChange = (event) => {
    setTextInput(event.target.value);
  };
  
  // handlePriorityChange
  const handlePriorityChange = (event) => {
    setSelectedPriority(event.target.value);
  };

  // Handle Function When Click On Submit
  const handleTaskSubmit = async () => {
    if (textInput.trim() === "") {
      return;
    }
    
    // Create new task object
    const newTask = {
      text: textInput,
      priority: selectedPriority,
      _id: isOffline ? `local_${Date.now()}` : undefined // Generate local ID if offline
    };

    // Optimistically update UI
    setTasks([newTask, ...tasks]);
    setTextInput("");
    setSelectedPriority("High");

    // If online, sync with server
    if (!isOffline) {
      try {
        const response = await fetch(`${API_URL}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: newTask.text,
            priority: newTask.priority
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const savedTask = await response.json();
        
        // Replace the optimistic task with the one from server (with proper ID)
        setTasks(prevTasks => prevTasks.map(task => 
          task === newTask ? savedTask : task
        ));
      } catch (error) {
        console.error("Error adding task:", error);
        setIsOffline(true);
        // Task remains in localStorage even if API call fails
      }
    }
  };

  const getTasksByPriority = (priority) => {
    return tasks.filter((task) => task.priority === priority);
  };

  const handleEditTask = async (editedText) => {
    // Check if this is a local task (created while offline)
    const isLocalTask = selectedTask._id && selectedTask._id.startsWith('local_');
    
    // Optimistically update UI
    const updatedTasks = tasks.map((task) =>
      task === selectedTask ? { ...task, text: editedText } : task
    );
    setTasks(updatedTasks);
    setSelectedTask(null);
    
    // If online and not a local task, sync with server
    if (!isOffline && !isLocalTask) {
      try {
        const response = await fetch(`${API_URL}/tasks/${selectedTask._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: editedText })
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
      } catch (error) {
        console.error("Error updating task:", error);
        setIsOffline(true);
        // Changes remain in localStorage even if API call fails
      }
    }
  };

  const handleChangePriority = async (newPriority) => {
    // Check if this is a local task
    const isLocalTask = selectedTask._id && selectedTask._id.startsWith('local_');
    
    // Optimistically update UI
    const updatedTasks = tasks.map((task) =>
      task === selectedTask ? { ...task, priority: newPriority } : task
    );
    setTasks(updatedTasks);
    setSelectedTask(null);
    
    // If online and not a local task, sync with server
    if (!isOffline && !isLocalTask) {
      try {
        const response = await fetch(`${API_URL}/tasks/${selectedTask._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ priority: newPriority })
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
      } catch (error) {
        console.error("Error updating task priority:", error);
        setIsOffline(true);
        // Changes remain in localStorage even if API call fails
      }
    }
  };

  const handleDeleteTask = async () => {
    // Check if this is a local task
    const isLocalTask = selectedTask._id && selectedTask._id.startsWith('local_');
    
    // Optimistically update UI
    const updatedTasks = tasks.filter((task) => task !== selectedTask);
    setTasks(updatedTasks);
    setSelectedTask(null);
    
    // If online and not a local task, sync with server
    if (!isOffline && !isLocalTask) {
      try {
        const response = await fetch(`${API_URL}/tasks/${selectedTask._id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
      } catch (error) {
        console.error("Error deleting task:", error);
        setIsOffline(true);
        // Changes remain in localStorage even if API call fails
      }
    }
  };

  return (
    <div className="p-8">
      {isOffline && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <p>You're currently offline. Changes will be saved locally and synced when back online.</p>
        </div>
      )}
      
      <div className="lg:flex grid gap-2 items-center font-main">
        <div className="">
          <input
            type="text"
            value={textInput}
            onChange={handleTextInputChange}
            className="w-full lg:w-96 border rounded p-2"
            placeholder="Enter task"
          />
        </div>
        <div className="">
          <select
            value={selectedPriority}
            onChange={handlePriorityChange}
            className="w-full border rounded p-2"
          >
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
        <button onClick={handleTaskSubmit} className="btn btn-secondary">
          Add Task
        </button>
      </div>

      {isLoading ? (
        <div className="mt-8 text-center">Loading tasks...</div>
      ) : (
        <div className="mt-8 space-y-4 text-black">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* High Priority */}
            <Layout
              getTasksByPriority={getTasksByPriority}
              setSelectedTask={setSelectedTask}
              selectedTask={selectedTask}
              handleEditTask={handleEditTask}
              handleChangePriority={handleChangePriority}
              handleDeleteTask={handleDeleteTask}
              level="High"
            />
            {/* Medium Priority */}
            <Layout
              getTasksByPriority={getTasksByPriority}
              setSelectedTask={setSelectedTask}
              selectedTask={selectedTask}
              handleEditTask={handleEditTask}
              handleChangePriority={handleChangePriority}
              handleDeleteTask={handleDeleteTask}
              level="Medium"
            />
            {/* Low Priority */}
            <Layout
              getTasksByPriority={getTasksByPriority}
              setSelectedTask={setSelectedTask}
              selectedTask={selectedTask}
              handleEditTask={handleEditTask}
              handleChangePriority={handleChangePriority}
              handleDeleteTask={handleDeleteTask}
              level="Low"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDashboard;

// msqbmehmood
// uZXiVqPr3oFsDnQd