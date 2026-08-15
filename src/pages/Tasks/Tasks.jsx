import React, { useState } from 'react';
import { Plus, CheckSquare, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import './Tasks.css';

const initialTasks = [
  { id: 1, title: 'Review monthly expenses', assignee: 'Admin', due: 'Today', priority: 'High', status: 'Todo' },
  { id: 2, title: 'Approve pending leave requests', assignee: 'Admin', due: 'Tomorrow', priority: 'Medium', status: 'In Progress' },
  { id: 3, title: 'Order printer ink', assignee: 'John Doe', due: 'Next Week', priority: 'Low', status: 'Completed' },
];

const Tasks = () => {
  const [tasks, setTasks] = useState(initialTasks);

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'High': return <AlertCircle size={16} className="text-danger" />;
      case 'Medium': return <Clock size={16} className="text-warning" />;
      default: return <CheckCircle2 size={16} className="text-success" />;
    }
  };

  const toggleStatus = (id) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'Todo' ? 'In Progress' : (t.status === 'In Progress' ? 'Completed' : 'Todo');
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Task Management</h1>
          <p className="text-secondary">Track internal tasks and assignments</p>
        </div>
        <Button icon={<Plus size={18} />}>New Task</Button>
      </div>

      <div className="tasks-board">
        {['Todo', 'In Progress', 'Completed'].map(column => (
          <div key={column} className="task-column">
            <h3 className="column-title">{column}</h3>
            <div className="task-list">
              {tasks.filter(t => t.status === column).map(task => (
                <Card key={task.id} className="task-card" onClick={() => toggleStatus(task.id)}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-sm">{task.title}</h4>
                      {getPriorityIcon(task.priority)}
                    </div>
                    <div className="flex justify-between items-center text-xs text-secondary mt-4">
                      <span>{task.assignee}</span>
                      <span className="task-due">{task.due}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {tasks.filter(t => t.status === column).length === 0 && (
                <div className="empty-column">No tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tasks;
