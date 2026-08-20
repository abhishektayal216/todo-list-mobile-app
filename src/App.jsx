import { useState, useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO, isToday } from 'date-fns';
import { 
  Search, Plus, Trash2, Edit2, Check, X, 
  ChevronLeft, Calendar, Clock, 
  Settings, Bell
} from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';

// Priority colors matching the design language
const priorityColors = {
  Low: 'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  High: 'bg-red-100 text-red-700',
};

function App() {
  const [tasks, setTasks] = useLocalStorage('todo-tasks', []);
  const [hasOnboarded, setHasOnboarded] = useLocalStorage('todo-onboarded', false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('home'); // home | search | add | edit
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '',
    endTime: '',
    priority: 'Medium',
  });

  // Generate week days (Mon-Sun)
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  // Tasks for selected day
  const tasksForDay = useMemo(() => {
    return tasks
      .filter(task => {
        try {
          return isSameDay(parseISO(task.date), selectedDate);
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const order = { High: 0, Medium: 1, Low: 2 };
        return (order[a.priority] || 1) - (order[b.priority] || 1);
      });
  }, [tasks, selectedDate]);

  // Weekly stats
  const weeklyStats = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const end = addDays(start, 6);
    const weekTasks = tasks.filter(t => {
      try {
        const d = parseISO(t.date);
        return d >= start && d <= end;
      } catch {
        return false;
      }
    });
    const completed = weekTasks.filter(t => t.completed).length;
    const pending = weekTasks.length - completed;
    const progress = weekTasks.length === 0 ? 0 : Math.round((completed / weekTasks.length) * 100);
    return { completed, pending, progress };
  }, [tasks, selectedDate]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  }, [tasks, searchQuery]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: '',
      endTime: '',
      priority: 'Medium',
    });
    setEditingTask(null);
  };

  const openAdd = () => {
    resetForm();
    setView('add');
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      date: task.date,
      startTime: task.startTime || '',
      endTime: task.endTime || '',
      priority: task.priority || 'Medium',
    });
    setView('edit');
  };

  const saveTask = () => {
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }
    if (!formData.date) {
      alert('Date is required');
      return;
    }

    if (editingTask) {
      setTasks(prev =>
        prev.map(t =>
          t.id === editingTask.id
            ? { ...t, ...formData, title: formData.title.trim() }
            : t
        )
      );
    } else {
      const newTask = {
        id: Date.now().toString(),
        ...formData,
        title: formData.title.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setTasks(prev => [...prev, newTask]);
    }
    setView('home');
    resetForm();
  };

  const toggleComplete = (id) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id) => {
    if (window.confirm('Delete this task?')) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  // ========== ONBOARDING ==========
  if (!hasOnboarded) {
    return (
      <div className="app-shell">
        <div className="relative h-[55vh] min-h-[280px] bg-[#3B82F6] overflow-hidden">
          <div className="absolute top-12 left-6 opacity-30">
            <svg width="80" height="40" viewBox="0 0 80 40" fill="none">
              <path d="M0 20 L15 5 L30 20 L45 5 L60 20 L75 5" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="absolute bottom-16 right-8 opacity-30">
            <svg width="100" height="50" viewBox="0 0 100 50" fill="none">
              <path d="M0 25 L20 5 L40 25 L60 5 L80 25 L100 5" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10"></div>
          <div className="absolute top-20 -left-8 w-24 h-24 rounded-full bg-white/10"></div>
        </div>

        <div className="flex-1 px-8 py-8 text-center flex flex-col justify-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Manage What To Do</h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            The best way to manage what you have to do, don't forget your plans
          </p>
          <button
            onClick={() => setHasOnboarded(true)}
            className="w-full bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold py-3.5 rounded-xl transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  // ========== SEARCH VIEW ==========
  if (view === 'search') {
    return (
      <div className="app-shell">
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <button
            onClick={() => {
              setView('home');
              setSearchQuery('');
            }}
            className="p-2 -ml-2"
          >
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
          <div className="flex-1 relative">
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search for a task"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {searchQuery && searchResults.length === 0 && (
            <p className="text-center text-gray-400 mt-12">No tasks found</p>
          )}
          {searchResults.map(task => (
            <div key={task.id} className="flex items-center gap-3 py-3 border-b border-gray-100">
              <button
                onClick={() => toggleComplete(task.id)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  task.completed
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'border-gray-300'
                }`}
              >
                {task.completed && <Check size={12} strokeWidth={3} />}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    task.completed ? 'line-through text-gray-400' : 'text-gray-800'
                  }`}
                >
                  {task.title}
                </p>
                {task.priority && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </span>
                )}
              </div>
              <button onClick={() => openEdit(task)} className="p-2 text-gray-400 hover:text-blue-500">
                <Edit2 size={16} />
              </button>
              <button onClick={() => deleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-500">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ========== ADD / EDIT VIEW ==========
  if (view === 'add' || view === 'edit') {
    return (
      <div className="app-shell">
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {view === 'edit' ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button
            onClick={() => {
              setView('home');
              resetForm();
            }}
            className="p-1"
          >
            <X size={22} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Task title</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Doing Homework"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Set Time</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
              <span>Start</span>
              <span>Ends</span>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Set Date</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
            <div className="flex gap-2">
              {['Low', 'Medium', 'High'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: p })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    formData.priority === p
                      ? p === 'High'
                        ? 'bg-red-500 text-white border-red-500'
                        : p === 'Medium'
                        ? 'bg-yellow-500 text-white border-yellow-500'
                        : 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add Description"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <button
            onClick={saveTask}
            className="w-full bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold py-3.5 rounded-xl transition-colors mt-2"
          >
            {view === 'edit' ? 'Update task' : 'Create task'}
          </button>
        </div>
      </div>
    );
  }

  // ========== HOME SCREEN ==========
  return (
    <div className="app-shell">
      {/* Top icons */}
      <div className="flex items-center justify-between px-5 pt-5">
        <button className="p-1.5 rounded-lg hover:bg-gray-100">
          <Settings size={20} className="text-gray-500" />
        </button>
        <div className="flex gap-3">
          <button onClick={() => setView('search')} className="p-1.5 rounded-lg hover:bg-gray-100">
            <Search size={20} className="text-gray-500" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-gray-100">
            <Bell size={20} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-5 mt-3">
        <button
          onClick={() => setView('search')}
          className="w-full flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-left"
        >
          <Search size={16} className="text-gray-400" />
          <span className="text-sm text-gray-400">Search for a task</span>
        </button>
      </div>

      {/* Calendar strip */}
      <div className="px-5 mt-5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {weekDays.map(day => {
            const isSelected = isSameDay(day, selectedDate);
            const dayTasks = tasks.filter(t => {
              try {
                return isSameDay(parseISO(t.date), day);
              } catch {
                return false;
              }
            });
            const hasTasks = dayTasks.length > 0;

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`flex flex-col items-center min-w-[48px] py-2 px-1 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-[#3B82F6] text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span
                  className={`text-[10px] font-medium uppercase ${
                    isSelected ? 'text-blue-100' : 'text-gray-400'
                  }`}
                >
                  {format(day, 'EEE')}
                </span>
                <span
                  className={`text-lg font-bold mt-0.5 ${
                    isSelected ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {hasTasks && !isSelected && (
                  <span className="w-1 h-1 rounded-full bg-blue-500 mt-1"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary cards */}
      <div className="px-5 mt-5 grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Check size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Task Complete</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{weeklyStats.completed}</p>
            <p className="text-[10px] text-gray-400">This Week</p>
          </div>
        </div>
        <div className="bg-red-50 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <X size={16} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Task Pending</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{weeklyStats.pending}</p>
            <p className="text-[10px] text-gray-400">This Week</p>
          </div>
        </div>
      </div>

      {/* Weekly Progress */}
      <div className="px-5 mt-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Weekly Progress</h3>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
            style={{ width: `${weeklyStats.progress}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-400 mt-1 text-right">{weeklyStats.progress}%</p>
      </div>

      {/* Tasks list */}
      <div className="px-5 mt-5 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">
            {isToday(selectedDate) ? 'Tasks Today' : `Tasks • ${format(selectedDate, 'MMM d')}`}
          </h3>
          <span className="text-xs text-blue-500 font-medium">View All</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pb-24">
          {tasksForDay.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">No tasks for this day</p>
              <button onClick={openAdd} className="mt-3 text-blue-500 text-sm font-medium">
                + Add a task
              </button>
            </div>
          ) : (
            tasksForDay.map(task => (
              <div
                key={task.id}
                className="task-item flex items-center gap-3 py-3 border-b border-gray-50"
              >
                <button
                  onClick={() => toggleComplete(task.id)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    task.completed
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {task.completed && <Check size={12} strokeWidth={3} />}
                </button>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      task.completed ? 'line-through text-gray-400' : 'text-gray-800'
                    }`}
                  >
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {task.startTime && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <Clock size={10} /> {task.startTime}
                        {task.endTime && ` - ${task.endTime}`}
                      </span>
                    )}
                    {task.priority && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          priorityColors[task.priority]
                        }`}
                      >
                        {task.priority}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(task)}
                    className="p-2 text-gray-400 hover:text-blue-500 rounded-lg"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-lg"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={openAdd}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 z-10"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>
    </div>
  );
}

export default App;
