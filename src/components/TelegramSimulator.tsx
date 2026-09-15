import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  RotateCcw, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  GraduationCap
} from 'lucide-react';
import { ScheduleData, TelegramMessage, TelegramKeyboardButton } from '../types';
import { playTelegramTone } from '../utils/audio';

interface TelegramSimulatorProps {
  scheduleData: ScheduleData;
  onRefreshSchedule: () => void;
  externalQuery?: string | null;
  onClearExternalQuery?: () => void;
}

export const TelegramSimulator: React.FC<TelegramSimulatorProps> = ({
  scheduleData,
  onRefreshSchedule,
  externalQuery,
  onClearExternalQuery,
}) => {
  const [messages, setMessages] = useState<TelegramMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [drawerTab, setDrawerTab] = useState<'teachers' | 'groups'>('teachers');

  // Initial welcome message
  useEffect(() => {
    initializeChat();
  }, [scheduleData.filename]);

  // Handle external query (e.g. from quick chips or matrix)
  useEffect(() => {
    if (externalQuery && externalQuery.trim()) {
      handleSendMessage(externalQuery.trim());
      onClearExternalQuery?.();
    }
  }, [externalQuery]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const initializeChat = () => {
    const topTeachers = scheduleData.teacherSurnames.slice(0, 3);
    const topGroups = scheduleData.groups.slice(0, 3);
    const welcomeText = `Здравствуйте! Я бот расписания занятий колледжа.\n\n` +
      `Период расписания: ${scheduleData.dateRange}\n` +
      `Загружено групп: ${scheduleData.groups.length} | Преподавателей: ${scheduleData.teachers.length}\n\n` +
      `Как пользоваться поиском:\n` +
      `- Введите фамилию преподавателя (например: ${topTeachers[0] || 'Васильева'})\n` +
      `- Или введите название группы (например: ${topGroups[0] || '26-А-1'})\n\n` +
      `Совмещенные пары (когда несколько групп объединены в один поток) распознаются и отмечаются автоматически.\n\n` +
      `Выберите преподавателя или группу ниже, либо напишите запрос в строку ввода:`;

    const initialButtons: TelegramKeyboardButton[][] = [
      topTeachers.map((t) => ({ text: t, callback_data: `teacher_${t}` })),
      topGroups.map((g) => ({ text: g, callback_data: `group_${g}` })),
      [
        { text: 'Все группы', callback_data: 'list_groups' },
        { text: 'Все преподаватели', callback_data: 'list_teachers' },
      ],
    ];

    setMessages([
      {
        id: 'msg_welcome',
        sender: 'bot',
        text: welcomeText,
        timestamp: formatTime(new Date()),
        keyboard: initialButtons,
      },
    ]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    if (!textToSend) {
      setInputValue('');
    }

    const userMsgId = `user_${Date.now()}`;
    const newMessages: TelegramMessage[] = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        text: text,
        timestamp: formatTime(new Date()),
      },
    ];

    setMessages(newMessages);
    if (soundEnabled) playTelegramTone('outgoing');
    setIsTyping(true);

    try {
      // Send to backend API
      const res = await fetch('/api/bot/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      // Simulated micro-delay for realistic bot feel
      setTimeout(() => {
        setIsTyping(false);
        const botMsg: TelegramMessage = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: data.replyText,
          timestamp: formatTime(new Date()),
          keyboard: data.keyboard,
        };
        setMessages((prev) => [...prev, botMsg]);
        if (soundEnabled) playTelegramTone('incoming');
      }, 400);
    } catch (err) {
      setIsTyping(false);
      const errorMsg: TelegramMessage = {
        id: `bot_err_${Date.now()}`,
        sender: 'bot',
        text: 'Произошла ошибка при обработке запроса. Пожалуйста, попробуйте еще раз.',
        timestamp: formatTime(new Date()),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleButtonClick = (btn: TelegramKeyboardButton) => {
    const action = btn.callback_data || btn.text;
    handleSendMessage(action);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    initializeChat();
  };

  return (
    <div className="flex flex-col h-[740px] max-w-3xl mx-auto rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-50 dark:bg-slate-900 transition-all">
      {/* Telegram Chat Header */}
      <div className="bg-[#2481cc] text-white px-4 py-3 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg text-white ring-2 ring-white/30 backdrop-blur-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#2481cc] rounded-full"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base tracking-wide leading-tight">
                Расписание Колледжа Бот
              </h2>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/20 text-white tracking-wider">
                BOT
              </span>
            </div>
            <p className="text-xs text-sky-100 flex items-center gap-1.5">
              {isTyping ? (
                <span className="italic animate-pulse">печатает...</span>
              ) : (
                <span>бот • онлайн • Excel синхронизирован</span>
              )}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-full hover:bg-white/10 text-sky-100 hover:text-white transition-colors"
            title={soundEnabled ? 'Выключить звук' : 'Включить звук'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button
            onClick={handleClearChat}
            className="p-2 rounded-full hover:bg-white/10 text-sky-100 hover:text-white transition-colors"
            title="Очистить чат и начать сначала"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Thread Container */}
      <div 
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-slate-100 dark:bg-[#0e1621] relative"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(36, 129, 204, 0.03) 0%, transparent 100%)`
        }}
      >
        {/* Date bubble badge */}
        <div className="flex justify-center my-2">
          <div className="px-3 py-1 rounded-full text-xs font-medium bg-slate-200/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 backdrop-blur-sm border border-slate-300/40 dark:border-slate-700/50">
            {scheduleData.title} • {scheduleData.dateRange}
          </div>
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-full`}
          >
            <div
              className={`relative group max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all ${
                msg.sender === 'user'
                  ? 'bg-[#eef7e6] text-slate-900 dark:bg-[#2b5278] dark:text-white rounded-br-xs'
                  : 'bg-white text-slate-900 dark:bg-[#182533] dark:text-slate-100 rounded-bl-xs border border-slate-200/70 dark:border-slate-800'
              }`}
            >
              {/* Copy button for bot messages */}
              {msg.sender === 'bot' && (
                <button
                  onClick={() => copyToClipboard(msg.id, msg.text)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all"
                  title="Скопировать расписание"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Message text with rich markdown-like presentation */}
              <div className="whitespace-pre-wrap leading-relaxed break-words font-sans">
                {renderFormattedMessage(msg.text)}
              </div>

              {/* Timestamp and ticks */}
              <div
                className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${
                  msg.sender === 'user'
                    ? 'text-emerald-700/80 dark:text-sky-200/80'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <span>{msg.timestamp}</span>
                {msg.sender === 'user' && (
                  <span className="text-emerald-600 dark:text-sky-300 font-semibold text-[10px]">
                    ✓✓
                  </span>
                )}
              </div>
            </div>

            {/* Inline Keyboard (Buttons attached to message) */}
            {msg.keyboard && msg.keyboard.length > 0 && (
              <div className="mt-2 space-y-1.5 w-full max-w-[92%] sm:max-w-[85%]">
                {msg.keyboard.map((row, rIdx) => (
                  <div key={rIdx} className="flex gap-1.5 flex-wrap">
                    {row.map((btn, bIdx) => (
                      <button
                        key={bIdx}
                        onClick={() => handleButtonClick(btn)}
                        className="flex-1 min-w-[120px] py-1.5 px-3 bg-white hover:bg-sky-50 dark:bg-[#182533] dark:hover:bg-[#203245] active:scale-[0.98] text-[#2481cc] dark:text-[#4db2f8] text-xs font-medium rounded-lg border border-sky-200 dark:border-slate-700 shadow-xs transition-all text-center truncate"
                      >
                        {btn.text}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#182533] text-slate-500 dark:text-slate-400 px-4 py-2.5 rounded-2xl rounded-bl-xs w-fit border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#2481cc] animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 rounded-full bg-[#2481cc] animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 rounded-full bg-[#2481cc] animate-bounce"></span>
            <span className="text-xs ml-1.5 font-medium">бот формирует расписание...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Access Keyboard Drawer */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#17212b]">
        <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-[#151f28]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2481cc]" />
              Быстрый выбор:
            </span>
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
              <button
                onClick={() => setDrawerTab('teachers')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  drawerTab === 'teachers'
                    ? 'bg-white dark:bg-[#2481cc] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Преподаватели ({scheduleData.teacherSurnames.length})
              </button>
              <button
                onClick={() => setDrawerTab('groups')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  drawerTab === 'groups'
                    ? 'bg-white dark:bg-[#2481cc] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Группы ({scheduleData.groups.length})
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowKeyboard(!showKeyboard)}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 flex items-center gap-0.5"
          >
            {showKeyboard ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showKeyboard && (
          <div className="p-2.5 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {drawerTab === 'teachers' ? (
              scheduleData.teacherSurnames.map((surname) => (
                <button
                  key={surname}
                  onClick={() => handleSendMessage(surname)}
                  className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-sky-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-[#2481cc] dark:text-slate-300 dark:hover:text-[#4db2f8] rounded-md transition-colors"
                >
                  {surname}
                </button>
              ))
            ) : (
              scheduleData.groups.map((group) => (
                <button
                  key={group}
                  onClick={() => handleSendMessage(group)}
                  className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-sky-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-[#2481cc] dark:text-slate-300 dark:hover:text-[#4db2f8] rounded-md transition-colors"
                >
                  {group}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom Message Input Bar */}
      <div className="p-3 bg-white dark:bg-[#17212b] border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder="Введите фамилию (Васильева) или группу (26-А-1)..."
          className="flex-1 bg-slate-100 dark:bg-[#242f3d] text-slate-900 dark:text-white px-4 py-2.5 rounded-xl border border-transparent focus:border-[#2481cc] focus:bg-white dark:focus:bg-[#1f2936] text-sm outline-none transition-all placeholder:text-slate-400"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputValue.trim()}
          className="w-10 h-10 rounded-xl bg-[#2481cc] hover:bg-[#1b70b3] disabled:opacity-40 disabled:hover:bg-[#2481cc] text-white flex items-center justify-center transition-all shadow-xs active:scale-95"
          title="Отправить"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

/**
 * Custom highlighter for Telegram markdown patterns
 */
function renderFormattedMessage(text: string) {
  const daysList = ['ПОНЕДЕЛЬНИК', 'ВТОРНИК', 'СРЕДА', 'ЧЕТВЕРГ', 'ПЯТНИЦА', 'СУББОТА', 'ВОСКРЕСЕНЬЕ'];
  const lines = text.split('\n');

  return lines.map((line, idx) => {
    // Check for combined class tag
    const isCombined = line.includes('[Совмещенная пара') || line.includes('Совмещенная');
    // Check for day separator or day name
    const trimmedLine = line.trim();
    const isDayHeader = daysList.some((d) => trimmedLine.startsWith(d));
    // Check for separator bar
    const isSeparator = line.includes('━━━━━━') || line.includes('------');
    // Check for lesson period
    const isLessonHeader = /^\d-я пара/.test(trimmedLine);

    if (isSeparator) {
      return (
        <div key={idx} className="my-2 border-b border-dashed border-slate-300 dark:border-slate-700" />
      );
    }

    if (isDayHeader) {
      return (
        <div
          key={idx}
          className="font-bold text-slate-900 dark:text-sky-300 mt-2.5 mb-1 text-sm tracking-wide uppercase"
        >
          {line}
        </div>
      );
    }

    // Highlighting combined classes
    if (isCombined) {
      return (
        <div
          key={idx}
          className="bg-amber-500/10 border-l-2 border-amber-500 px-2 py-0.5 my-0.5 rounded-r text-amber-800 dark:text-amber-300 font-medium text-xs sm:text-sm"
        >
          {line}
        </div>
      );
    }

    // Bold tags replacement **text**
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <div key={idx} className={isLessonHeader ? 'font-semibold text-slate-900 dark:text-slate-100 mt-1.5' : ''}>
        {parts.map((p, pIdx) => {
          if (p.startsWith('**') && p.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-semibold text-slate-900 dark:text-white">
                {p.slice(2, -2)}
              </strong>
            );
          }
          if (p.startsWith('`') && p.endsWith('`')) {
            return (
              <code key={pIdx} className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 rounded text-xs">
                {p.slice(1, -1)}
              </code>
            );
          }
          return p;
        })}
      </div>
    );
  });
}
