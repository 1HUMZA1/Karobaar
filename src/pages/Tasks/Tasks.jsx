import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Trash2, 
  ArrowRight, 
  User, 
  Calendar, 
  Tag, 
  Check, 
  ListTodo,
  Layers,
  Sparkles
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppContext } from '../../context/AppContext';
import { db } from '../../services/databaseService';
import './Tasks.css';

const DEFAULT_TASKS = [
  { id: 'task-1', title: 'Review monthly supplier expenses & reconcile GST', assignee: 'Humza (Admin)', category: 'Finance', due: 'Today', priority: 'High', status: 'Todo' },
  { id: 'task-2', title: 'Count register cash drawer and audit daily closure', assignee: 'Store Cashier 1', category: 'Operations', due: 'Today', priority: 'Medium', status: 'In Progress' },
  { id: 'task-3', title: 'Re-order cold drinks & dairy crates before weekend', assignee: 'Inventory Manager', category: 'Inventory', due: 'Tomorrow', priority: 'High', status: 'Todo' },
  { id: 'task-4', title: 'Update shelf price tags for new FMCG arrivals', assignee: 'Floor Staff', category: 'Operations', due: 'Next Week', priority: 'Low', status: 'Completed' },
];

const QUICK_SUGGESTIONS = [
  'Count cash register drawer',
  'Restock dairy & drinks inventory',
  'Call supplier for restock',
  'Reconcile pending customer invoices',
  'Audit store expiry dates',
];

const PRESET_ASSIGNEES = [
  'Humza (Admin)',
  'Store Cashier 1',
  'Store Cashier 2',
  'Inventory Manager',
  'Floor Staff',
  'Delivery & Dispatch'
];

const CATEGORIES = ['Operations', 'Inventory', 'Finance', 'Supplier', 'Customer'];

const Tasks = () => {
  const { currentUser } = useAppContext();
  const businessId = currentUser?.activeBusinessId || 'demo-business-1';
  
  // Format user name cleanly
  const defaultAssigneeName = currentUser?.name 
    ? (currentUser.name.replace(/^[0-9_]+|[0-9_]+$/g, '').trim() || 'Admin') + ' (Admin)'
    : 'Admin';

  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetColumn, setTargetColumn] = useState('Todo');

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newAssignee, setNewAssignee] = useState(defaultAssigneeName);
  const [isCustomAssignee, setIsCustomAssignee] = useState(false);
  const [customAssigneeText, setCustomAssigneeText] = useState('');
  const [newCategory, setNewCategory] = useState('Operations');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newDue, setNewDue] = useState('Today');

  const loadTasks = async () => {
    try {
      const records = await db.getCollection('tasks', businessId);
      if (!records || records.length === 0) {
        await db.saveCollection('tasks', DEFAULT_TASKS, businessId);
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

  const openCreateModal = (column = 'Todo') => {
    setTargetColumn(column);
    setNewTitle('');
    setNewPriority('Medium');
    setNewDue('Today');
    setNewCategory('Operations');
    setIsCustomAssignee(false);
    setCustomAssigneeText('');
    setNewAssignee(defaultAssigneeName);
    setIsModalOpen(true);
  };

  const getPriorityBadge = (priority) => {
    return (
      <span className={`task-priority-tag ${priority}`}>
        {priority === 'High' && <AlertCircle size={12} />}
        {priority === 'Medium' && <Clock size={12} />}
        {priority === 'Low' && <CheckCircle2 size={12} />}
        {priority}
      </span>
    );
  };

  const handleNextStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Todo' ? 'In Progress' : (currentStatus === 'In Progress' ? 'Completed' : 'Todo');
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t));
    try {
      await db.update('tasks', id, { status: nextStatus }, businessId);
      window.dispatchEvent(new CustomEvent('karobaar_data_synced'));
    } catch (e) {
      console.warn('Error updating task status:', e);
    }
  };

  const handleDeleteTask = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this task?')) return;
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await db.delete('tasks', id, businessId);
      window.dispatchEvent(new CustomEvent('karobaar_data_synced'));
    } catch (e) {
      console.warn('Error deleting task:', e);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const finalAssignee = isCustomAssignee 
      ? (customAssigneeText.trim() || 'Admin') 
      : (newAssignee.trim() || 'Admin');

    const newTask = {
      id: 'task-' + Date.now(),
      title: newTitle.trim(),
      assignee: finalAssignee,
      category: newCategory,
      priority: newPriority,
      due: newDue,
      status: targetColumn || 'Todo',
      createdAt: new Date().toISOString()
    };

    // Immediate optimistic update for zero latency
    setTasks(prev => [newTask, ...prev]);
    setNewTitle('');
    setIsModalOpen(false);

    // Persist in background
    try {
      await db.add('tasks', newTask, businessId, newTask.id);
      window.dispatchEvent(new CustomEvent('karobaar_data_synced'));
    } catch (err) {
      console.warn('Background task save warning:', err);
    }
  };

  // Stats calculation
  const totalCount = tasks.length;
  const todoCount = tasks.filter(t => t.status === 'Todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const highPriorityCount = tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length;

  return (
    <div className="tasks-page-root">
      {/* Top Header */}
      <div className="tasks-top-header">
        <div className="tasks-title-group">
          <h1>Internal Task Management</h1>
          <p>Assign tasks, track store operations, and automate staff responsibilities</p>
        </div>
        <div className="tasks-action-bar">
          <Button 
            icon={<Plus size={16} />} 
            onClick={() => openCreateModal('Todo')}
          >
            Create Task
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="tasks-stats-row">
        <div className="tasks-stat-card">
          <div className="tasks-stat-icon">
            <ListTodo size={18} />
          </div>
          <div className="tasks-stat-info">
            <span className="tasks-stat-label">Total Tasks</span>
            <span className="tasks-stat-value">{totalCount}</span>
          </div>
        </div>

        <div className="tasks-stat-card">
          <div className="tasks-stat-icon">
            <Clock size={18} />
          </div>
          <div className="tasks-stat-info">
            <span className="tasks-stat-label">In Progress</span>
            <span className="tasks-stat-value">{inProgressCount}</span>
          </div>
        </div>

        <div className="tasks-stat-card">
          <div className="tasks-stat-icon">
            <CheckCircle2 size={18} />
          </div>
          <div className="tasks-stat-info">
            <span className="tasks-stat-label">Completed</span>
            <span className="tasks-stat-value">{completedCount}</span>
          </div>
        </div>

        <div className="tasks-stat-card">
          <div className="tasks-stat-icon" style={{ color: highPriorityCount > 0 ? '#ef4444' : 'inherit' }}>
            <AlertCircle size={18} />
          </div>
          <div className="tasks-stat-info">
            <span className="tasks-stat-label">Urgent / High</span>
            <span className="tasks-stat-value" style={{ color: highPriorityCount > 0 ? '#ef4444' : 'inherit' }}>
              {highPriorityCount}
            </span>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="tasks-board-grid">
        {[
          { key: 'Todo', title: 'To Do', dotClass: 'todo' },
          { key: 'In Progress', title: 'In Progress', dotClass: 'in-progress' },
          { key: 'Completed', title: 'Completed', dotClass: 'completed' },
        ].map(column => {
          const colTasks = tasks.filter(t => t.status === column.key);
          return (
            <div key={column.key} className="tasks-column-wrapper">
              <div className="tasks-column-header">
                <div className="tasks-col-title-left">
                  <span className={`tasks-col-dot ${column.dotClass}`}></span>
                  <span className="tasks-col-title">{column.title}</span>
                  <span className="tasks-col-badge">{colTasks.length}</span>
                </div>
                <button 
                  type="button"
                  className="tasks-col-add-btn" 
                  title={`Add task to ${column.title}`}
                  onClick={() => openCreateModal(column.key)}
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="tasks-card-list">
                {colTasks.map(task => {
                  const assigneeInitial = (task.assignee || 'A').charAt(0).toUpperCase();
                  return (
                    <div key={task.id} className="task-item-card">
                      <div className="task-card-top">
                        <div className="task-card-meta-tags">
                          {task.category && (
                            <span className="task-category-pill">{task.category}</span>
                          )}
                          {getPriorityBadge(task.priority)}
                        </div>
                        <button 
                          type="button"
                          className="task-card-delete-btn"
                          title="Delete task"
                          onClick={(e) => handleDeleteTask(task.id, e)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <h4 className="task-card-title">{task.title}</h4>

                      <div className="task-card-footer">
                        <div className="task-assignee-pill">
                          <span className="task-assignee-avatar">{assigneeInitial}</span>
                          <span>{task.assignee}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="task-due-badge">
                            <Calendar size={12} /> {task.due}
                          </span>

                          <button 
                            type="button" 
                            className="task-action-pill-btn"
                            title={
                              task.status === 'Todo' ? 'Move to In Progress' :
                              task.status === 'In Progress' ? 'Mark Completed' : 'Move back to Todo'
                            }
                            onClick={() => handleNextStatus(task.id, task.status)}
                          >
                            {task.status === 'Todo' && <>Start <ArrowRight size={11} /></>}
                            {task.status === 'In Progress' && <>Done <Check size={11} /></>}
                            {task.status === 'Completed' && <Check size={11} className="text-success" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className="empty-col-state">
                    No tasks in {column.title}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE NEW TASK MODAL */}
      {isModalOpen && (
        <div className="biz-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div 
            className="biz-modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: '480px' }}
          >
            <div className="biz-modal-header">
              <div>
                <h3 className="biz-modal-title">Create New Task</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Assign an operational task for your business
                </p>
              </div>
              <button 
                type="button" 
                className="modal-close" 
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '1.25rem' }}>
              {/* Task Title */}
              <div className="task-field-group">
                <label className="task-field-label">Task Title *</label>
                <Input 
                  placeholder="e.g. Call supplier for cheese restock" 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)} 
                  required 
                  autoFocus 
                />
                
                {/* Fast suggestion chips */}
                <div className="task-chips-row">
                  {QUICK_SUGGESTIONS.slice(0, 3).map((chip, idx) => (
                    <button 
                      key={idx} 
                      type="button" 
                      className="task-chip-btn"
                      onClick={() => setNewTitle(chip)}
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assignee & Category */}
              <div className="task-form-grid-2">
                <div className="task-field-group">
                  <label className="task-field-label">Assignee</label>
                  {!isCustomAssignee ? (
                    <select 
                      className="task-select-input"
                      value={newAssignee} 
                      onChange={e => {
                        if (e.target.value === '__custom__') {
                          setIsCustomAssignee(true);
                        } else {
                          setNewAssignee(e.target.value);
                        }
                      }}
                    >
                      {PRESET_ASSIGNEES.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                      <option value="__custom__">+ Custom Assignee...</option>
                    </select>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Input 
                        placeholder="Enter staff name" 
                        value={customAssigneeText} 
                        onChange={e => setCustomAssigneeText(e.target.value)}
                        autoFocus
                      />
                      <button 
                        type="button"
                        className="task-chip-btn" 
                        style={{ height: '42px', padding: '0 10px' }}
                        onClick={() => setIsCustomAssignee(false)}
                      >
                        Presets
                      </button>
                    </div>
                  )}
                </div>

                <div className="task-field-group">
                  <label className="task-field-label">Category</label>
                  <select 
                    className="task-select-input"
                    value={newCategory} 
                    onChange={e => setNewCategory(e.target.value)}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority & Due Date */}
              <div className="task-form-grid-2">
                <div className="task-field-group">
                  <label className="task-field-label">Priority</label>
                  <select 
                    className="task-select-input"
                    value={newPriority} 
                    onChange={e => setNewPriority(e.target.value)}
                  >
                    <option value="High">🔴 High Priority</option>
                    <option value="Medium">🟡 Medium Priority</option>
                    <option value="Low">🟢 Low Priority</option>
                  </select>
                </div>

                <div className="task-field-group">
                  <label className="task-field-label">Due Date / Time</label>
                  <select 
                    className="task-select-input"
                    value={newDue} 
                    onChange={e => setNewDue(e.target.value)}
                  >
                    <option value="Today">Today</option>
                    <option value="Tomorrow">Tomorrow</option>
                    <option value="This Friday">This Friday</option>
                    <option value="Next Week">Next Week</option>
                    <option value="End of Month">End of Month</option>
                  </select>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="biz-modal-footer" style={{ margin: '8px -1.25rem -1.25rem -1.25rem' }}>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" icon={<Plus size={16} />}>
                  Add Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
