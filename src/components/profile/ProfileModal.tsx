import React, { useState } from 'react';
import {
  X,
  User,
  GraduationCap,
  Sparkles,
  Save,
  Flame,
  BookOpen,
} from 'lucide-react';
import { StudentProfile, EducationLevel } from '../../types';
import { SUBJECTS_BY_LEVEL, NIGERIAN_EXAMS } from '../../data/curriculumData';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onSaveProfile: (profile: StudentProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [name, setName] = useState(profile.name);
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(profile.educationLevel);
  const [grade, setGrade] = useState(profile.grade);
  const [country, setCountry] = useState(profile.country);
  const [institution, setInstitution] = useState(profile.institution || '');
  const [course, setCourse] = useState(profile.course || '');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(profile.subjects || []);
  const [targetExams, setTargetExams] = useState<string[]>(profile.targetExams || []);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: StudentProfile = {
      ...profile,
      name: name.trim() || 'Scholar',
      educationLevel,
      grade,
      country,
      institution: educationLevel === 'university' ? institution : undefined,
      course: educationLevel === 'university' ? course : undefined,
      subjects: selectedSubjects,
      targetExams,
    };
    onSaveProfile(updated);
    onClose();
  };

  const toggleSubject = (sub: string) => {
    if (selectedSubjects.includes(sub)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== sub));
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black">
              {profile.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Student Academic Profile</h3>
              <p className="text-xs text-slate-300">Manage your educational stage and target exams</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Education Level
              </label>
              <select
                value={educationLevel}
                onChange={(e) => {
                  const lvl = e.target.value as EducationLevel;
                  setEducationLevel(lvl);
                  setSelectedSubjects((SUBJECTS_BY_LEVEL[lvl] || []).slice(0, 6));
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold outline-hidden bg-white"
              >
                <option value="primary">Primary School</option>
                <option value="junior_secondary">Junior Secondary (JSS)</option>
                <option value="senior_secondary">Senior Secondary (SS)</option>
                <option value="university">University / Tertiary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Grade / Class
              </label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g. SS 3"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold outline-hidden"
              />
            </div>
          </div>

          {educationLevel === 'university' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institution
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. UNILAG"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course
                </label>
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. Medicine"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Subjects selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Subjects ({selectedSubjects.length} selected)
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {(SUBJECTS_BY_LEVEL[educationLevel] || []).map((sub) => {
                const isSelected = selectedSubjects.includes(sub);
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleSubject(sub)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
