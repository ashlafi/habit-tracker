import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment-jalaali';
import { Plus, Trash2, Check, Moon, Sun, LayoutGrid, BarChart2, X, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';

moment.loadPersian({ usePersianDigits: true });

const DEFAULT_CATEGORIES = [
  { id: 'health', label: 'سلامتی 🏃‍♂️', color: 'bg-green-100 text-green-700' },
  { id: 'work', label: 'کاری 💼', color: 'bg-blue-100 text-blue-700' },
  { id: 'edu', label: 'آموزشی 📚', color: 'bg-purple-100 text-purple-700' },
  { id: 'daily', label: 'روزمره ☕️', color: 'bg-orange-100 text-orange-700' },
];

const EXTRA_COLORS = [
  'bg-teal-100 text-teal-700',
  'bg-pink-100 text-pink-700',
  'bg-indigo-100 text-indigo-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700'
];

export default function App() {
  // Calendar navigation state
  const [selectedDate, setSelectedDate] = useState(() => moment());
  
  const currentJYear = selectedDate.jYear();
  const currentJMonth = selectedDate.jMonth();
  const monthName = selectedDate.format('jMMMM jYYYY');
  const daysInMonth = moment.jDaysInMonth(currentJYear, currentJMonth);
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);
  const monthKey = selectedDate.format('jYYYY-jMM');

  // UI & Theme state
  const [activeTab, setActiveTab] = useState('grid');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('habit-theme');
    return savedTheme !== null ? JSON.parse(savedTheme) : true;
  });

  // Data persistence states
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('habit-categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('habit-tasks');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    const defaultCat = DEFAULT_CATEGORIES[0];
    return parsed.map(t => ({
      ...t,
      category: t.category || defaultCat
    }));
  });
  
  const [completions, setCompletions] = useState(() => {
    const saved = localStorage.getItem('habit-completions');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Form and modal local states
  const [newTaskName, setNewTaskName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(() => categories[0]?.id || 'health');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Dynamic theme styling mapping
  const theme = useMemo(() => ({
    bodyBg: isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-100 text-slate-900',
    cardBg: isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-gray-200/80 text-slate-900',
    subCardBg: isDarkMode ? 'bg-slate-950/60 border-slate-800 text-slate-200' : 'bg-gray-50/80 border-gray-200/60 text-gray-800',
    inputBg: isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-slate-900 placeholder-gray-400',
    tableHeaderBg: isDarkMode ? 'bg-slate-900 text-slate-200 border-slate-800' : 'bg-white text-gray-700 border-gray-200',
    rowHover: isDarkMode ? 'hover:bg-slate-800/70' : 'hover:bg-blue-50/40',
    cellBorder: isDarkMode ? 'border-slate-800/80' : 'border-gray-100',
    textMuted: isDarkMode ? 'text-slate-400' : 'text-gray-500',
    buttonBg: isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200',
    progressBar: isDarkMode ? 'bg-slate-800' : 'bg-gray-200',
  }), [isDarkMode]);

  // Sync theme and local data changes to localStorage
  useEffect(() => {
    document.body.className = `${theme.bodyBg} transition-colors duration-300 min-h-screen`;
    localStorage.setItem('habit-theme', JSON.stringify(isDarkMode));
  }, [isDarkMode, theme.bodyBg]);

  useEffect(() => localStorage.setItem('habit-categories', JSON.stringify(categories)), [categories]);
  useEffect(() => localStorage.setItem('habit-tasks', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('habit-completions', JSON.stringify(completions)), [completions]);

  // Month navigation handlers
  const prevMonth = () => setSelectedDate(prev => prev.clone().subtract(1, 'jMonth'));
  const nextMonth = () => setSelectedDate(prev => prev.clone().add(1, 'jMonth'));
  const goToCurrentMonth = () => setSelectedDate(moment());

  // Category management handlers
  const handleAddNewCategory = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    const randomColor = EXTRA_COLORS[Math.floor(Math.random() * EXTRA_COLORS.length)];
    const newCat = {
      id: `cat-${Date.now()}`,
      label: newCategoryName.trim(),
      color: randomColor
    };
    
    setCategories([...categories, newCat]);
    setSelectedCategoryId(newCat.id);
    setNewCategoryName('');
    setIsAddingNewCategory(false);
  };

  const initiateDeleteCategory = (cat, e) => {
    e.stopPropagation();
    if (categories.length <= 1) {
      alert('حداقل یک دسته‌بندی باید وجود داشته باشد.');
      return;
    }
    
    const connectedTasks = tasks.filter(t => t.category?.id === cat.id);
    if (connectedTasks.length > 0) {
      setCategoryToDelete({ ...cat, count: connectedTasks.length });
    } else {
      executeDeleteCategory(cat.id, false);
    }
    setIsCategoryDropdownOpen(false);
  };

  const executeDeleteCategory = (catId, deleteTasksAlso) => {
    setCategories(prev => prev.filter(c => c.id !== catId));

    if (deleteTasksAlso) {
      const taskIdsToRemove = new Set(tasks.filter(t => t.category?.id === catId).map(t => t.id));
      setTasks(prev => prev.filter(t => !taskIdsToRemove.has(t.id)));
      
      setCompletions(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          for (const tid of taskIdsToRemove) {
            if (key.startsWith(`${tid}-`)) delete updated[key];
          }
        });
        return updated;
      });
    } else {
      const fallbackCat = categories.find(c => c.id !== catId) || DEFAULT_CATEGORIES[0];
      setTasks(prev => prev.map(t => t.category?.id === catId ? { ...t, category: fallbackCat } : t));
    }

    if (selectedCategoryId === catId) {
      const remaining = categories.filter(c => c.id !== catId);
      setSelectedCategoryId(remaining[0]?.id || DEFAULT_CATEGORIES[0].id);
    }

    setCategoryToDelete(null);
  };

  // Task management handlers
  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    const taskCat = categories.find(c => c.id === selectedCategoryId) || categories[0];
    
    const newTask = {
      id: crypto.randomUUID(),
      name: newTaskName.trim(),
      category: taskCat,
      createdAt: Date.now()
    };
    setTasks([...tasks, newTask]);
    setNewTaskName('');
  };

  const removeTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    setCompletions(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (key.startsWith(`${taskId}-`)) delete updated[key];
      });
      return updated;
    });
  };

  const toggleCompletion = (taskId, day) => {
    const key = `${taskId}-${monthKey}-${day}`;
    setCompletions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Statistical calculations with memoization for performance
  const getTaskProgress = (taskId) => {
    let done = 0;
    for (let i = 1; i <= daysInMonth; i++) {
      if (completions[`${taskId}-${monthKey}-${i}`]) done++;
    }
    return { done, total: daysInMonth, percent: Math.round((done / daysInMonth) * 100) };
  };

  const categoryStats = useMemo(() => {
    return categories.map(cat => {
      const catTasks = tasks.filter(t => t.category?.id === cat.id);
      if (catTasks.length === 0) return { ...cat, hasTasks: false, percent: 0, tasksData: [] };
      
      let totalCatDone = 0;
      const tasksData = catTasks.map(t => {
        const progress = getTaskProgress(t.id);
        totalCatDone += progress.done;
        return { ...t, progress };
      });
      
      const totalCatPossible = catTasks.length * daysInMonth;
      return {
        ...cat,
        hasTasks: true,
        percent: Math.round((totalCatDone / totalCatPossible) * 100),
        tasksData
      };
    }).filter(cat => cat.hasTasks);
  }, [categories, tasks, completions, monthKey, daysInMonth]);

  const selectedCategoryObj = useMemo(() => {
    return categories.find(c => c.id === selectedCategoryId) || categories[0];
  }, [categories, selectedCategoryId]);

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center relative font-sans" dir="rtl">
      
      {/* Category deletion confirmation modal */}
      <AnimatePresence>
        {categoryToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${theme.cardBg}`}
            >
              <h3 className="text-lg font-bold mb-3 text-red-500 flex items-center gap-2">
                <Trash2 size={22} />
                حذف دسته‌بندی «{categoryToDelete.label}»
              </h3>
              <p className={`text-sm mb-6 leading-relaxed ${theme.textMuted}`}>
                این دسته‌بندی دارای <span className="font-bold text-blue-500">{categoryToDelete.count}</span> تسک متصل است. آیا می‌خواهید تسک‌های آن نیز همراه با دسته‌بندی حذف شوند یا فقط دسته‌بندی حذف شود و تسک‌ها حفظ گردند؟
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => executeDeleteCategory(categoryToDelete.id, true)}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-red-500/20 text-sm"
                >
                  بله، دسته‌بندی و تمام تسک‌های آن حذف شوند
                </button>
                <button
                  onClick={() => executeDeleteCategory(categoryToDelete.id, false)}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-blue-500/20 text-sm"
                >
                  خیر، فقط دسته‌بندی حذف شود (تسک‌ها حفظ شوند)
                </button>
                <button
                  onClick={() => setCategoryToDelete(null)}
                  className={`w-full py-2.5 px-4 rounded-xl border font-medium transition-colors text-sm ${theme.buttonBg}`}
                >
                  انصراف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation tabs */}
      <div className="w-full max-w-7xl flex gap-2 mb-4">
        <button onClick={() => setActiveTab('grid')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm ${activeTab === 'grid' ? 'bg-blue-600 text-white shadow-blue-500/20' : `${theme.cardBg} ${theme.textMuted} hover:opacity-80 border`}`}>
          <LayoutGrid size={20} />
          جدول روزانه
        </button>
        <button onClick={() => setActiveTab('stats')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm ${activeTab === 'stats' ? 'bg-blue-600 text-white shadow-blue-500/20' : `${theme.cardBg} ${theme.textMuted} hover:opacity-80 border`}`}>
          <BarChart2 size={20} />
          آمار و عملکرد
        </button>
      </div>

      <div className={`w-full max-w-7xl rounded-3xl shadow-xl overflow-hidden flex flex-col border transition-colors duration-300 ${theme.cardBg}`}>
        
        {/* Header and controls section */}
        {activeTab === 'grid' && (
          <div className={`p-6 md:p-8 border-b flex flex-col xl:flex-row justify-between items-center gap-6 ${theme.cardBg}`}>
            
            <div className="flex flex-col md:flex-row justify-between w-full xl:w-auto items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">مدیریت عادات</h1>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={prevMonth} className={`p-2 rounded-xl border transition-colors ${theme.buttonBg}`} title="ماه قبل">
                    <ChevronRight size={18} />
                  </button>
                  <button onClick={goToCurrentMonth} className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${theme.buttonBg}`}>
                    ماه جاری
                  </button>
                  <button onClick={nextMonth} className={`p-2 rounded-xl border transition-colors ${theme.buttonBg}`} title="ماه بعد">
                    <ChevronLeft size={18} />
                  </button>
                  <span className={`text-sm font-bold px-2 ${theme.textMuted}`}>{monthName}</span>
                </div>
              </div>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`xl:hidden p-2.5 rounded-xl border ${theme.buttonBg}`}>
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
            
            <div className="flex items-center gap-4 w-full xl:w-auto">
              {isAddingNewCategory ? (
                <form onSubmit={handleAddNewCategory} className="flex w-full gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="نام دسته‌بندی جدید..."
                    className={`flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner ${theme.inputBg}`}
                  />
                  <button type="submit" disabled={!newCategoryName.trim()} className="px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50">
                    <Check size={20} />
                  </button>
                  <button type="button" onClick={() => setIsAddingNewCategory(false)} className="px-4 py-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20">
                    <X size={20} />
                  </button>
                </form>
              ) : (
                <form onSubmit={addTask} className="flex flex-col md:flex-row w-full gap-3 relative">
                  <input
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="تسک جدید (مثلاً: دویدن)..."
                    className={`w-full md:w-64 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner ${theme.inputBg}`}
                  />
                  
                  {/* Category selection custom dropdown */}
                  <div className="relative w-full md:w-52">
                    <button
                      type="button"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className={`w-full px-4 py-3 border rounded-xl flex items-center justify-between shadow-inner cursor-pointer transition-colors ${theme.inputBg}`}
                    >
                      <span className="truncate">{selectedCategoryObj?.label}</span>
                      <ChevronDown size={16} className={`transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''} ${theme.textMuted}`} />
                    </button>

                    <AnimatePresence>
                      {isCategoryDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className={`absolute top-full left-0 right-0 mt-2 border rounded-2xl shadow-2xl z-50 overflow-hidden py-1.5 ${theme.cardBg}`}
                        >
                          {categories.map(cat => (
                            <div
                              key={cat.id}
                              className={`w-full text-right px-3 py-2 text-sm flex items-center justify-between transition-colors ${selectedCategoryId === cat.id ? 'bg-blue-500/10 font-semibold text-blue-500' : 'hover:opacity-75'}`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCategoryId(cat.id);
                                  setIsCategoryDropdownOpen(false);
                                }}
                                className="flex-1 text-right truncate flex items-center justify-between"
                              >
                                <span>{cat.label}</span>
                                {selectedCategoryId === cat.id && <Check size={16} className="text-blue-500 mr-2" />}
                              </button>
                              
                              {categories.length > 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => initiateDeleteCategory(cat, e)}
                                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors ml-2"
                                  title="حذف دسته‌بندی"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                          <div className={`border-t my-1 ${theme.cellBorder}`}></div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCategoryDropdownOpen(false);
                              setIsAddingNewCategory(true);
                            }}
                            className="w-full text-right px-4 py-2.5 text-sm font-bold text-blue-500 hover:bg-blue-500/10 transition-colors flex items-center gap-2"
                          >
                            <span>➕ ایجاد دسته جدید...</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button type="submit" disabled={!newTaskName.trim()} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-500/20">
                    <Plus size={20} />
                    <span className="md:hidden">افزودن</span>
                  </button>
                </form>
              )}
              
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`hidden xl:flex p-3 rounded-xl border transition-colors ${theme.buttonBg}`}>
                {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
              </button>
            </div>
          </div>
        )}

        {/* Daily habit matrix grid */}
        {activeTab === 'grid' && (
          <div className={`flex-1 overflow-y-auto relative min-h-[500px] ${isDarkMode ? 'bg-slate-950/60' : 'bg-gray-50/50'}`}>
            <table className="w-full text-xs text-center border-collapse table-fixed">
              <colgroup>
                <col className="w-[180px] md:w-[220px]" />
                {days.map(d => (
                  <col key={d} />
                ))}
              </colgroup>
              <thead className={`sticky top-0 z-20 shadow-sm ${theme.tableHeaderBg}`}>
                <tr>
                  <th className={`sticky right-0 z-30 p-3 border-b text-right shadow-sm ${theme.tableHeaderBg}`}>
                    عنوان تسک
                  </th>
                  {days.map(day => (
                    <th key={day} className={`p-1.5 md:p-2 border-b font-medium text-[11px] ${theme.textMuted} ${theme.cellBorder}`}>{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan={daysInMonth + 1} className={`p-12 text-center ${theme.textMuted} text-sm`}>
                        هیچ تسکی ثبت نشده است. اولین تسک خود را اضافه کنید.
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => (
                      <motion.tr key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className={`group transition-colors ${theme.cardBg} ${theme.rowHover}`}>
                        <td className={`sticky right-0 z-10 p-2 md:p-3 border-b text-right shadow-sm transition-colors flex items-center justify-between ${theme.cardBg}`}>
                          <div className="flex flex-col gap-0.5 overflow-hidden">
                            <span className="font-medium text-xs md:text-sm truncate pl-1">{task.name}</span>
                            <span className={`text-[9px] w-max px-1.5 py-0.2 rounded-full ml-1 ${task.category?.color || DEFAULT_CATEGORIES[0].color}`}>
                              {task.category?.label || 'عمومی'}
                            </span>
                          </div>
                          <button onClick={() => removeTask(task.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                            <Trash2 size={16} />
                          </button>
                        </td>
                        
                        {days.map(day => {
                          const isCompleted = completions[`${task.id}-${monthKey}-${day}`];
                          return (
                            <td key={day} className={`p-1 border-b ${theme.cellBorder}`}>
                              <div className="flex justify-center items-center">
                                <motion.button
                                  whileTap={{ scale: 0.8 }}
                                  onClick={() => toggleCompletion(task.id, day)}
                                  className={`w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center transition-colors shadow-sm ${isCompleted ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/30' : `${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-200'} text-transparent hover:opacity-80 border`}`}
                                >
                                  <AnimatePresence>
                                    {isCompleted && (
                                      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                                        <Check size={14} strokeWidth={3} />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.button>
                              </div>
                            </td>
                          );
                        })}
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Statistics and performance analysis section */}
        {activeTab === 'stats' && (
          <div className={`p-6 md:p-10 min-h-[500px] ${theme.cardBg}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
              <div>
                <h2 className="text-2xl font-bold">تحلیل عملکرد</h2>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={prevMonth} className={`p-2 rounded-xl border transition-colors ${theme.buttonBg}`} title="ماه قبل">
                    <ChevronRight size={18} />
                  </button>
                  <button onClick={goToCurrentMonth} className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${theme.buttonBg}`}>
                    ماه جاری
                  </button>
                  <button onClick={nextMonth} className={`p-2 rounded-xl border transition-colors ${theme.buttonBg}`} title="ماه بعد">
                    <ChevronLeft size={18} />
                  </button>
                  <span className={`text-sm font-bold px-2 ${theme.textMuted}`}>{monthName}</span>
                </div>
              </div>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 rounded-xl border ${theme.buttonBg}`}>
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>

            {categoryStats.length === 0 ? (
              <div className={`text-center py-20 ${theme.textMuted}`}>
                <BarChart2 size={48} className="mx-auto mb-4 opacity-50" />
                <p>هنوز اطلاعاتی برای نمایش آمار در این ماه وجود ندارد.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                <div className={`p-6 rounded-3xl border shadow-sm ${theme.subCardBg}`}>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                    نمای کلی دسته‌بندی‌ها
                  </h3>
                  <div className="space-y-6">
                    {categoryStats.map(cat => (
                      <div key={cat.id}>
                        <div className="flex justify-between text-sm mb-2 font-medium">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cat.color}`}>{cat.label}</span>
                          <span>{cat.percent}%</span>
                        </div>
                        <div className={`w-full rounded-full h-3 overflow-hidden ${theme.progressBar}`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${cat.percent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="bg-gradient-to-l from-blue-500 to-indigo-600 h-3 rounded-full"
                          ></motion.div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
                    تحلیل ریز تسک‌ها
                  </h3>
                  
                  {categoryStats.map(cat => (
                    <div key={`detail-${cat.id}`} className={`p-5 rounded-2xl border shadow-sm ${theme.subCardBg}`}>
                      <h4 className={`text-sm font-bold mb-4 pb-2 border-b ${theme.textMuted} ${theme.cellBorder}`}>
                        {cat.label}
                      </h4>
                      <div className="space-y-4">
                        {cat.tasksData.map(task => (
                          <div key={task.id}>
                            <div className="flex justify-between text-sm mb-1.5">
                              <span>{task.name}</span>
                              <span className={`text-xs ${theme.textMuted}`}>{task.progress.done} از {task.progress.total} روز ({task.progress.percent}%)</span>
                            </div>
                            <div className={`w-full rounded-full h-1.5 overflow-hidden ${theme.progressBar}`}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${task.progress.percent}%` }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className={`h-1.5 rounded-full ${task.progress.percent >= 80 ? 'bg-green-500' : task.progress.percent >= 40 ? 'bg-amber-500' : 'bg-red-400'}`}
                              ></motion.div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}