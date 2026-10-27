import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, Clock, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppContext } from '../../context/AppContext';
import { db } from '../../services/databaseService';
import './Tasks.css';

const DEFAULT_TASKS = [
  { id: 'task-1', title: 'Review monthly expenses', assignee: 'Admin', due: 'Today', priority: 'High', status: 'Todo' },
  { id: 'task-2', title: 'Approve pending leave requests', assignee: 'Admin', due: 'Tomorrow', priority: 'Medium', status: 'In Progress' },
  { id: 'task-3', title: 'Order printer ink', assignee: 'Store Staff', due: 'Next Week', priority: 'Low', status: 'Completed' },
];

const Tasks = () => {
  const { currentUser } = useAppContext();
  const businessId = currentUser?.activeBusinessId || 'demo-business-1';
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAssignee, setNewAssignee] = useState(currentUser?.name || 'Admin');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newDue, setNewDue] = useState('Today');

  const loadTasks = async () => {
    try {
      const records = await db.getCollection('tasks', businessId);
      if (!records || records.length === 0) {
        for (const t of DEFAULT_TASKS) {
          await db.add('tasks', t, businessId, t.id);
        }
        setTasks(DEFAULT_TASKS);
      } else {
        setTasks(records);
      }
    } catch (e) {
      setTasks(DEFAULT_TASKS);
    }
  };

  useEffect(() => {
    loadTasks();
    const handleSync = () => loadTasks();
    window.addEventListener('karobaar_data_synced', handleSync);
    return () => window.removeEventListener('karobaar_data_synced', handleSync);
  }, [businessId]);

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'High': return <AlertCircle size={16} className="text-danger" />;
      case 'Medium': return <Clock size={16} className="text-warning" />;
      default: return <CheckCircle2 size={16} className="text-success" />;
    }
  };

  const toggleStatus = async (id) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;
    const nextStatus = target.status === 'Todo' ? 'In Progress' : (target.status === 'In Progress' ? 'Completed' : 'Todo');
    
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t));
    try {
      await db.update('tasks', id, { status: nextStatus }, businessId);
    } catch (e) {
      console.warn('Error updating task status:', e);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask = {
      title: newTitle.trim(),
      assignee: newAssignee.trim() || 'Admin',
      priority: newPriority,
      due: newDue,
      status: 'Todo',
      createdAt: new Date().toISOString()
    };

    const saved = await db.add('tasks', newTask, businessId);
    setTasks(prev => [saved, ...prev]);
    setNewTitle('');
    setIsModalOpen(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Task Management</h1>
          <p className="text-secondary">Track internal tasks, assignments, and voice reminders</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>New Task</Button>
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

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="text-lg font-bold">Create New Task</h3>
              <button className="icon-button" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Task Title</label>
                <Input 
                  placeholder="e.g. Call supplier for cheese restock" 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)} 
                  required 
                  autoFocus 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Assignee</label>
                <Input 
                  placeholder="e.g. Rahul / Cashier" 
                  value={newAssignee} 
                  onChange={e => setNewAssignee(e.target.value)} 
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Priority</label>
                  <select 
                    value={newPriority} 
                    onChange={e => setNewPriority(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-main)' }}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Due</label>
                  <Input 
                    placeholder="e.g. Today / 5 PM" 
                    value={newDue} 
                    onChange={e => setNewDue(e.target.value)} 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Add Task</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;