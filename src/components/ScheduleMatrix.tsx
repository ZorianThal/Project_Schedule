import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Layers, 
  Calendar, 
  Clock, 
  BookOpen, 
  Users, 
  GraduationCap, 
  MapPin, 
  Sparkles,
  Download
} from 'lucide-react';
import { ScheduleData, ScheduleLesson } from '../types';

interface ScheduleMatrixProps {
  scheduleData: ScheduleData;
  onSelectTeacherForBot: (surname: string) => void;
  onSelectGroupForBot?: (group: string) => void;
}

export const ScheduleMatrix: React.FC<ScheduleMatrixProps> = ({
  scheduleData,
  onSelectTeacherForBot,
  onSelectGroupForBot,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [onlyCombined, setOnlyCombined] = useState(false);

  // Filter lessons
  const filteredLessons = useMemo(() => {
    return scheduleData.lessons.filter((l) => {
      // Day filter
      if (selectedDay !== 'all' && l.day.toLowerCase() !== selectedDay.toLowerCase()) {
        return false;
      }
      // Teacher filter
      if (selectedTeacher !== 'all' && l.teacherSurname !== selectedTeacher) {
        return false;
      }
      // Group filter
      if (selectedGroup !== 'all' && !l.groups.includes(selectedGroup)) {
        return false;
      }
      // Only combined
      if (onlyCombined && !l.isCombined) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSubject = l.subject.toLowerCase().includes(q);
        const matchTeacher = (l.teacher || '').toLowerCase().includes(q);
        const matchGroup = l.groups.some((g) => g.toLowerCase().includes(q));
        const matchAud = (l.classroom || '').toLowerCase().includes(q);
        const matchDay = l.day.toLowerCase().includes(q);
        if (!matchSubject && !matchTeacher && !matchGroup && !matchAud && !matchDay) {
          return false;
        }
      }
      return true;
    });
  }, [scheduleData.lessons, selectedDay, selectedTeacher, selectedGroup, onlyCombined, searchQuery]);

  // Group lessons by day
  const lessonsByDay = useMemo(() => {
    const map = new Map<string, ScheduleLesson[]>();
    for (const d of scheduleData.days) {
      map.set(d, []);
    }
    for (const l of filteredLessons) {
      if (!map.has(l.day)) {
        map.set(l.day, []);
      }
      map.get(l.day)!.push(l);
    }
    return map;
  }, [scheduleData.days, filteredLessons]);

  const combinedCount = useMemo(() => {
    return scheduleData.lessons.filter((l) => l.isCombined).length;
  }, [scheduleData.lessons]);

  return (
    <div className="space-y-6">
      {/* Top Controls & Metrics Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Матрица расписания занятий колледжа
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Период: <span className="font-semibold text-slate-700 dark:text-slate-300">{scheduleData.dateRange}</span> • 
              Всего уроков: <span className="font-semibold text-slate-700 dark:text-slate-300">{scheduleData.lessons.length}</span> • 
              Совмещенных потоков: <span className="font-semibold text-amber-600 dark:text-amber-400">{combinedCount}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setOnlyCombined(!onlyCombined)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                onlyCombined
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Только совмещенные пары ({combinedCount})
            </button>
            <a
              href="/api/schedule/download-sample"
              download
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Excel образец (.xlsx)
            </a>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по предмету, фамилии..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Day selector */}
          <div className="relative">
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Все дни недели</option>
              {scheduleData.days.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Teacher selector */}
          <div className="relative">
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Все преподаватели ({scheduleData.teacherSurnames.length})</option>
              {scheduleData.teacherSurnames.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Group selector */}
          <div className="relative">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Все группы ({scheduleData.groups.length})</option>
              {scheduleData.groups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Days */}
      <div className="space-y-6">
        {scheduleData.days.map((dayName) => {
          const dayLessons = lessonsByDay.get(dayName) || [];
          if (selectedDay !== 'all' && selectedDay.toLowerCase() !== dayName.toLowerCase()) {
            return null;
          }
          if (dayLessons.length === 0 && (searchQuery || onlyCombined || selectedTeacher !== 'all' || selectedGroup !== 'all')) {
            return null;
          }

          const dayDate = dayLessons[0]?.date || '';

          return (
            <div
              key={dayName}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Day Header */}
              <div className="bg-slate-50 dark:bg-slate-800/80 px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {dayName}
                  </h3>
                  {dayDate && (
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                      ({dayDate})
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {dayLessons.length} пар(ы)
                </span>
              </div>

              {/* Day Lessons List */}
              {dayLessons.length === 0 ? (
                <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">
                  Занятий по выбранным фильтрам не найдено.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dayLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        lesson.isCombined ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Period & Time info */}
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex flex-col items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                          <span>{lesson.lessonNumber}</span>
                          <span className="text-[8px] -mt-1 uppercase tracking-tighter">пара</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
                              {lesson.subject}
                            </span>
                            {lesson.subgroup && (
                              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300">
                                {lesson.subgroup}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {lesson.time}
                            </span>
                            {lesson.classroom && (
                              <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                                Ауд. {lesson.classroom}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Group & Teacher badges */}
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        {/* Group badge(s) */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {lesson.isCombined ? (
                            <>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                Совмещенная пара
                              </span>
                              {lesson.groups.map((g) => (
                                <button
                                  key={g}
                                  onClick={() => onSelectGroupForBot?.(g)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                                  title="Открыть расписание этой группы в боте"
                                >
                                  <Users className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                  {g}
                                </button>
                              ))}
                            </>
                          ) : (
                            <button
                              onClick={() => onSelectGroupForBot?.(lesson.group)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 hover:bg-sky-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-[#2481cc] dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                              title="Открыть расписание этой группы в боте"
                            >
                              <Users className="w-3 h-3 text-slate-400" />
                              {lesson.group}
                            </button>
                          )}
                        </div>

                        {/* Teacher button/badge */}
                        {lesson.teacher && (
                          <button
                            onClick={() => onSelectTeacherForBot(lesson.teacherSurname)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors"
                            title="Открыть расписание этого преподавателя в боте"
                          >
                            <GraduationCap className="w-3.5 h-3.5" />
                            {lesson.teacher}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
