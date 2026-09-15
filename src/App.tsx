import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Layers, 
  FileSpreadsheet, 
  Settings, 
  Calendar, 
  Sparkles, 
  Download,
  GraduationCap,
  Users
} from 'lucide-react';
import { ScheduleData } from './types';
import { getSampleScheduleData } from './data/sampleSchedule';
import { TelegramSimulator } from './components/TelegramSimulator';
import { ScheduleMatrix } from './components/ScheduleMatrix';
import { ExcelManager } from './components/ExcelManager';
import { TelegramBotConfig } from './components/TelegramBotConfig';

export default function App() {
  const [scheduleData, setScheduleData] = useState<ScheduleData>(getSampleScheduleData());
  const [activeTab, setActiveTab] = useState<'bot' | 'matrix' | 'excel' | 'config'>('bot');
  const [selectedQueryForBot, setSelectedQueryForBot] = useState<string | null>(null);

  // Fetch current schedule from server
  const loadSchedule = async () => {
    try {
      const res = await fetch('/api/schedule');
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setScheduleData(data.data);
        }
      }
    } catch (e) {
      console.log('Using local sample schedule');
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const handleQuerySelect = (query: string) => {
    setSelectedQueryForBot(query);
    setActiveTab('bot');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2481cc] to-sky-400 text-white flex items-center justify-center shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  Расписание Колледжа
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  Telegram Bot
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{scheduleData.dateRange}</span>
                <span className="hidden md:inline">• {scheduleData.lessons.length} пар</span>
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('bot')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'bot'
                  ? 'bg-white dark:bg-slate-900 text-[#2481cc] dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Чат-бот</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'matrix'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Матрица</span>
            </button>

            <button
              onClick={() => setActiveTab('excel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'excel'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={() => setActiveTab('config')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'config'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Настройки Telegram Bot API"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </nav>
        </div>

        {/* Quick Testing Bar with Teacher and Group Chips */}
        <div className="bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-200/60 dark:border-slate-800/80 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto text-xs scrollbar-none">
            {/* Teachers section */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-sky-500" />
                Преподаватели:
              </span>
              {scheduleData.teacherSurnames.slice(0, 5).map((surname) => (
                <button
                  key={surname}
                  onClick={() => handleQuerySelect(surname)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-sky-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-[#2481cc] dark:text-slate-300 dark:hover:text-sky-300 border border-slate-200 dark:border-slate-700 transition-colors font-medium shadow-2xs cursor-pointer"
                >
                  {surname}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 shrink-0" />

            {/* Groups section */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-500" />
                Группы:
              </span>
              {scheduleData.groups.map((group) => (
                <button
                  key={group}
                  onClick={() => handleQuerySelect(group)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors font-medium shadow-2xs cursor-pointer"
                >
                  {group}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {activeTab === 'bot' && (
          <div className="space-y-4">
            <TelegramSimulator
              scheduleData={scheduleData}
              onRefreshSchedule={loadSchedule}
              externalQuery={selectedQueryForBot}
              onClearExternalQuery={() => setSelectedQueryForBot(null)}
            />
          </div>
        )}

        {activeTab === 'matrix' && (
          <ScheduleMatrix
            scheduleData={scheduleData}
            onSelectTeacherForBot={handleQuerySelect}
            onSelectGroupForBot={handleQuerySelect}
          />
        )}

        {activeTab === 'excel' && (
          <ExcelManager
            scheduleData={scheduleData}
            onScheduleUpdated={(newData) => setScheduleData(newData)}
          />
        )}

        {activeTab === 'config' && (
          <TelegramBotConfig />
        )}
      </main>
    </div>
  );
}
