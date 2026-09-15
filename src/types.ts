export interface ScheduleLesson {
  id: string;
  day: string; // e.g. "Понедельник"
  date?: string; // e.g. "14.09.2026"
  lessonNumber: number; // 1 to 7
  time: string; // e.g. "09.00-10.20"
  subject: string; // e.g. "Информатика"
  teacher: string; // e.g. "Евсеева А.Е."
  teacherSurname: string; // e.g. "Евсеева"
  group: string; // e.g. "26-А-1"
  groups: string[]; // e.g. ["26-А-1", "26-Д-1"] when combined
  classroom: string; // e.g. "216"
  isCombined: boolean; // true if shared across multiple groups
  subgroup?: string; // e.g. "2 п/г"
  note?: string;
}

export interface ScheduleData {
  title: string;
  dateRange: string;
  lessons: ScheduleLesson[];
  teachers: string[]; // unique formatted names
  teacherSurnames: string[]; // unique surnames
  groups: string[]; // unique group identifiers
  days: string[];
  filename?: string;
  uploadedAt: string;
}

export interface TelegramKeyboardButton {
  text: string;
  callback_data?: string;
}

export interface TelegramMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  keyboard?: TelegramKeyboardButton[][];
  formattedHtml?: string;
}

export interface BotQueryResult {
  replyText: string;
  matchedTeacher?: string;
  matchedGroup?: string;
  lessonsFound: number;
  keyboard?: TelegramKeyboardButton[][];
}

export interface TelegramBotStatus {
  configured: boolean;
  active: boolean;
  botInfo?: {
    id: number;
    username: string;
    first_name: string;
  };
  totalQueriesHandled: number;
  lastActive?: string;
  error?: string;
}
