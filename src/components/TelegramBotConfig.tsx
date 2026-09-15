import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  Key, 
  Terminal, 
  Send,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { TelegramBotStatus } from '../types';

export const TelegramBotConfig: React.FC = () => {
  const [status, setStatus] = useState<TelegramBotStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/telegram/status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Status Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              status?.active 
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                : 'bg-sky-50 text-[#2481cc] dark:bg-sky-950/60 dark:text-sky-400 border border-sky-200 dark:border-sky-800'
            }`}>
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Интеграция с Telegram Bot API
                </h2>
                {status?.active ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                    Онлайн в Telegram
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300">
                    Веб-симулятор готов
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {status?.active && status.botInfo ? (
                  <span>Подключен к боту: <strong>@{status.botInfo.username}</strong></span>
                ) : (
                  <span>Бот полностью функционирует во встроенном веб-чате и готов к подключению в Telegram</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={fetchStatus}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors self-start sm:self-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Обновить статус
          </button>
        </div>

        {/* Status Details */}
        {status?.active && status.botInfo && (
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <div className="text-[11px] text-slate-500">Имя бота:</div>
              <div className="font-semibold text-sm text-slate-900 dark:text-white">{status.botInfo.first_name}</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <div className="text-[11px] text-slate-500">Юзернейм:</div>
              <div className="font-semibold text-sm text-sky-600 dark:text-sky-400">@{status.botInfo.username}</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <div className="text-[11px] text-slate-500">Запросов обработано:</div>
              <div className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">{status.totalQueriesHandled}</div>
            </div>
          </div>
        )}
      </div>

      {/* Step by Step Setup Guide */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Key className="w-5 h-5 text-indigo-500" />
          Как запустить этого бота в реальном Telegram
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Приложение уже содержит встроенный сервер Telegram Bot Polling. Чтобы ваши студенты и преподаватели могли пользоваться им прямо в Telegram:
        </p>

        <div className="space-y-3 pt-2">
          {/* Step 1 */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              1
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-sm text-slate-900 dark:text-white">
                Создайте бота в Telegram
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Откройте официального бота <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-[#2481cc] font-semibold underline inline-flex items-center gap-0.5">@BotFather <ExternalLink className="w-3 h-3" /></a> в Telegram и отправьте команду <code className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-800 dark:text-slate-200">/newbot</code>. Укажите название и юзернейм.
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              2
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-sm text-slate-900 dark:text-white">
                Скопируйте полученный HTTP API Token
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                @BotFather выдаст токен вида <code className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-800 dark:text-slate-200">7123456789:AAHk...</code>.
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              3
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-sm text-slate-900 dark:text-white">
                Добавьте токен в настройки проекта
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Укажите переменную <code className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-800 dark:text-slate-200">TELEGRAM_BOT_TOKEN="ВАШ_ТОКЕН"</code> в файле <code className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-800 dark:text-slate-200">.env</code> или панели Settings.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
