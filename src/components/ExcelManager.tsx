import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Users, 
  GraduationCap, 
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { ScheduleData } from '../types';

interface ExcelManagerProps {
  scheduleData: ScheduleData;
  onScheduleUpdated: (newData: ScheduleData) => void;
}

export const ExcelManager: React.FC<ExcelManagerProps> = ({
  scheduleData,
  onScheduleUpdated,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setNotification({
        type: 'error',
        message: 'Пожалуйста, выберите файл в формате Excel (.xlsx или .xls)',
      });
      return;
    }

    setIsUploading(true);
    setNotification(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/schedule/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.data) {
        onScheduleUpdated(data.data);
        setNotification({
          type: 'success',
          message: data.message || `Файл ${file.name} успешно загружен и обработан!`,
        });
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Ошибка при чтении файла расписания',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `Ошибка соединения: ${err.message}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleResetSample = async () => {
    setIsUploading(true);
    setNotification(null);
    try {
      const res = await fetch('/api/schedule/reset-sample', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data) {
        onScheduleUpdated(data.data);
        setNotification({
          type: 'success',
          message: 'Расписание успешно сброшено на исходный образец из колледжа!',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `Не удалось сбросить: ${err.message}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const combinedLessons = scheduleData.lessons.filter((l) => l.isCombined);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Active File Summary Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {scheduleData.filename || 'Расписание колледжа'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  Активно
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Период: <span className="font-medium text-slate-700 dark:text-slate-300">{scheduleData.dateRange}</span> • 
                Синхронизировано: {new Date(scheduleData.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <a
              href="/api/schedule/download-sample"
              download
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              Скачать Excel (.xlsx)
            </a>
            <button
              onClick={handleResetSample}
              disabled={isUploading}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Сбросить на образец
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Дней в неделе</span>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {scheduleData.days.length}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <GraduationCap className="w-3.5 h-3.5 text-sky-500" />
              <span>Преподавателей</span>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {scheduleData.teachers.length}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              <span>Студ. групп</span>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {scheduleData.groups.length}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Совмещенных пар</span>
            </div>
            <div className="text-xl font-bold text-amber-800 dark:text-amber-300">
              {combinedLessons.length}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm flex items-start gap-3 border ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{notification.message}</div>
        </div>
      )}

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[0.99]'
            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-900/40'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileUpload(e.target.files[0]);
            }
          }}
          accept=".xlsx,.xls"
          className="hidden"
        />

        <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8" />
        </div>

        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          Загрузить новый Excel-файл расписания
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          Перетащите файл сюда или нажмите, чтобы выбрать с компьютера. Поддерживаются форматы <span className="font-semibold text-slate-700 dark:text-slate-300">.xlsx</span> и <span className="font-semibold text-slate-700 dark:text-slate-300">.xls</span>.
        </p>

        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 shadow-xs">
          <FileText className="w-4 h-4" />
          Выбрать файл расписания
        </div>
      </div>

      {/* Guide & Schema details */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-3">
        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
          <Layers className="w-4 h-4 text-indigo-500" />
          Как парсер распознает расписание колледжа:
        </h4>
        <ul className="space-y-1.5 list-disc list-inside">
          <li>
            <strong className="text-slate-800 dark:text-slate-200">Колонки дней и пар:</strong> Столбец А содержит день недели («Понедельник», «Вторник»...), столбец B — номер пары (1–7), столбец C — время (например, 09.00-10.20).
          </li>
          <li>
            <strong className="text-slate-800 dark:text-slate-200">Столбцы групп:</strong> Каждая группа занимает 2 колонки: дисциплина с преподавателем и аудитория («Ауд.»).
          </li>
          <li>
            <strong className="text-slate-800 dark:text-slate-200">Преподаватели:</strong> Автоматически извлекаются фамилии с инициалами (например: «Евсеева А.Е.», «Васильева О.О.», «Мартыненко А.И.») из текста ячейки.
          </li>
          <li>
            <strong className="text-amber-700 dark:text-amber-400">Совмещенные пары (потоковые занятия):</strong> Если у одного преподавателя назначено занятие одновременно для нескольких групп (или ячейка объединена по горизонтали), бот автоматически распознает это как совмещенную пару и перечислит все группы.
          </li>
        </ul>
      </div>
    </div>
  );
};
