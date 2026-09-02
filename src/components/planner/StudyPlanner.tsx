import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  Zap,
} from 'lucide-react';
import { StudentProfile, StudyPlannerTask } from '../../types';
import { SUBJECTS_BY_LEVEL } from '../../data/curriculumData';

interface StudyPlannerProps {
  profile: StudentProfile;
  tasks: StudyPlannerTask[];
  onSaveTasks: (tasks: StudyPlannerTask[]) => void;
  onNavigateToStudy: () => void;
  onNavigateToExamPrep: () => void;
}

export const StudyPlanner: React.FC<StudyPlannerProps> = ({
  profile,
  tasks,
  onSaveTasks,
  onNavigateToStudy,
  onNavigateToExamPrep,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState(profile.subjects[0] || 'Physics');
  const [newTopic, setNewTopic] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newEstimatedMinutes, setNewEstimatedMinutes] = useState(45);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newTopic.trim()) return;

    const newTask: StudyPlannerTask = {
      id: `task-${Date.now()}`,
      title: newTitle.trim() || `Study ${newSubject}: ${newTopic}`,
      subject: newSubject,
      topic: newTopic,
      dueDate: newDueDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      estimatedMinutes: newEstimatedMinutes,
      completed: false,
      priority: newPriority,
    };

    onSaveTasks([newTask, ...tasks]);
    setNewTitle('');
    setNewTopic('');
  };

  const handleToggleTask = (id: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    onSaveTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    onSaveTasks(updated);
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-indigo-600 font-bold px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md">
              Study Planner
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Daily Milestones & Timetable
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Personalized Study Schedule
          </h1>
        </div>

        <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-semibold text-indigo-900">
          {completedCount} / {tasks.length} tasks completed
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ADD TASK FORM (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              Add Planned Study Session
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Schedule target topics and allocate revision minutes.
            </p>
          </div>

          <form onSubmit={handleAddTask} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Subject
              </label>
              <select
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {(SUBJECTS_BY_LEVEL[profile.educationLevel] || []).map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Specific Topic *
              </label>
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="e.g. Chemical Bonding & Electronegativity"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Duration (mins)
                </label>
                <input
                  type="number"
                  min="15"
                  max="240"
                  value={newEstimatedMinutes}
                  onChange={(e) => setNewEstimatedMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['high', 'medium', 'low'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewPriority(p)}
                    className={`py-2 rounded-xl border text-xs font-semibold capitalize transition-all ${
                      newPriority === p
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all text-center"
            >
              Add to Study Timetable
            </button>
          </form>
        </div>

        {/* TASK LIST (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Active Study Tasks & Milestones
            </h3>

            {tasks.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No study tasks scheduled yet. Create your first task using the form.
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      task.completed ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200/90 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                          task.completed
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 hover:border-blue-500'
                        }`}
                      >
                        {task.completed && <CheckCircle2 className="w-4 h-4" />}
                      </button>

                      <div className="space-y-0.5">
                        <span
                          className={`text-xs font-bold block ${
                            task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="font-semibold text-blue-700">{task.subject}</span>
                          <span>•</span>
                          <span>{task.estimatedMinutes || 45} mins</span>
                          <span>•</span>
                          <span
                            className={`font-bold ${
                              task.priority === 'high'
                                ? 'text-rose-600'
                                : task.priority === 'low'
                                ? 'text-slate-500'
                                : 'text-amber-600'
                            }`}
                          >
                            {(task.priority || 'medium').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
