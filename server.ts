import express from 'express';
import path from 'path';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { createServer as createViteServer } from 'vite';
import { getSampleScheduleData, generateSampleExcelWorkbook } from './src/data/sampleSchedule';
import { parseExcelWorkbook, queryScheduleBySurname, queryScheduleByGroup, findMatchingGroup } from './src/utils/scheduleParser';
import { ScheduleData, TelegramBotStatus } from './src/types';

// In-memory active schedule
let currentSchedule: ScheduleData = getSampleScheduleData();

// Telegram Bot State
const telegramBotStatus: TelegramBotStatus = {
  configured: false,
  active: false,
  totalQueriesHandled: 0,
};

let pollingController: AbortController | null = null;
let lastUpdateId = 0;

// Multer memory storage for Excel files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // ================= API ROUTES =================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get current schedule metadata and parsed lessons
  app.get('/api/schedule', (req, res) => {
    res.json({
      success: true,
      data: currentSchedule,
    });
  });

  // Reset to sample schedule from screenshot
  app.post('/api/schedule/reset-sample', (req, res) => {
    currentSchedule = getSampleScheduleData();
    res.json({
      success: true,
      message: 'Расписание сброшено на образец из колледжа',
      data: currentSchedule,
    });
  });

  // Download sample .xlsx file matching user screenshot
  app.get('/api/schedule/download-sample', (req, res) => {
    try {
      const buffer = generateSampleExcelWorkbook();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="college_schedule_14.09.2026.xlsx"');
      res.send(Buffer.from(buffer));
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Upload custom .xlsx / .xls file
  app.post('/api/schedule/upload', upload.single('file'), (req, res) => {
    try {
      let fileBuffer: Buffer | null = null;
      let filename = 'custom_schedule.xlsx';

      if (req.file) {
        fileBuffer = req.file.buffer;
        filename = req.file.originalname;
      } else if (req.body && req.body.base64) {
        const rawBase64 = req.body.base64.replace(/^data:.*?;base64,/, '');
        fileBuffer = Buffer.from(rawBase64, 'base64');
        if (req.body.filename) filename = req.body.filename;
      }

      if (!fileBuffer) {
        return res.status(400).json({ success: false, error: 'Файл расписания не предоставлен' });
      }

      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const parsedData = parseExcelWorkbook(workbook, filename);

      currentSchedule = parsedData;

      res.json({
        success: true,
        message: `Файл "${filename}" успешно прочитан! Найдено ${parsedData.lessons.length} занятий, ${parsedData.teachers.length} преподавателей, ${parsedData.groups.length} групп.`,
        data: currentSchedule,
      });
    } catch (err: any) {
      console.error('Error parsing uploaded Excel:', err);
      res.status(400).json({
        success: false,
        error: `Не удалось прочитать файл: ${err.message}. Убедитесь, что это корректный Excel-файл (.xlsx или .xls).`,
      });
    }
  });

  // Bot Query endpoint (handles text, surname, group, or day callback)
  app.post('/api/bot/query', (req, res) => {
    const { text, day } = req.body;
    telegramBotStatus.totalQueriesHandled++;
    const result = handleBotQuery(text || '', day);
    res.json(result);
  });

  // Telegram bot configuration & status
  app.get('/api/telegram/status', (req, res) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    telegramBotStatus.configured = Boolean(token && token.trim().length > 10);
    res.json(telegramBotStatus);
  });

  // Start background Telegram bot polling if token provided
  initTelegramBot();

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

/**
 * Universal bot query handler for both web simulator and live Telegram bot
 */
function handleBotQuery(rawText: string, dayParam?: string): { replyText: string; lessonsFound: number; keyboard?: any[] } {
  const cleanText = (rawText || '').trim();

  if (!cleanText) {
    return {
      replyText: 'Пожалуйста, введите фамилию преподавателя (например: Васильева, Евсеева) или название группы (например: 26-А-1).',
      lessonsFound: 0,
    };
  }

  // 1. Check for command /start or /help
  if (cleanText === '/start' || cleanText === '/help') {
    const topTeachers = currentSchedule.teacherSurnames.slice(0, 3);
    const topGroups = currentSchedule.groups.slice(0, 3);
    let welcome = `Здравствуйте! Я бот расписания занятий колледжа.\n\n`;
    welcome += `Период: ${currentSchedule.dateRange}\n`;
    welcome += `Загружено групп: ${currentSchedule.groups.length} | Преподавателей: ${currentSchedule.teachers.length}\n\n`;
    welcome += `Как пользоваться:\n`;
    welcome += `- Введите фамилию преподавателя (например: ${topTeachers[0] || 'Васильева'})\n`;
    welcome += `- Или введите название группы (например: ${topGroups[0] || '26-А-1'})\n\n`;
    welcome += `Совмещенные пары выделяются автоматически.\n\n`;
    welcome += `Выберите преподавателя или группу из списка ниже:`;

    const keyboard = [
      topTeachers.map((t) => ({ text: t, callback_data: `teacher_${t}` })),
      topGroups.map((g) => ({ text: g, callback_data: `group_${g}` })),
      [
        { text: 'Все группы', callback_data: 'list_groups' },
        { text: 'Все преподаватели', callback_data: 'list_teachers' },
      ],
    ];

    return {
      replyText: welcome,
      lessonsFound: 0,
      keyboard,
    };
  }

  // 2. Check for list of groups command
  if (
    cleanText === 'list_groups' ||
    cleanText === '/groups' ||
    cleanText.toLowerCase() === 'группы' ||
    cleanText.toLowerCase() === 'группа'
  ) {
    let reply = `Список учебных групп в расписании (${currentSchedule.groups.length}):\n\nВыберите группу, чтобы получить расписание:`;
    const keyboard = [];
    for (let i = 0; i < currentSchedule.groups.length; i += 3) {
      keyboard.push(
        currentSchedule.groups.slice(i, i + 3).map((g) => ({
          text: g,
          callback_data: `group_${g}`,
        }))
      );
    }
    keyboard.push([{ text: 'Поиск по преподавателям', callback_data: 'list_teachers' }]);
    return {
      replyText: reply,
      lessonsFound: currentSchedule.groups.length,
      keyboard,
    };
  }

  // 3. Check for list of teachers command
  if (
    cleanText === 'list_teachers' ||
    cleanText === '/teachers' ||
    cleanText.toLowerCase().includes('преподавател')
  ) {
    let reply = `Список преподавателей в расписании (${currentSchedule.teachers.length}):\n\nВыберите преподавателя, чтобы получить расписание:`;
    const keyboard = [];
    for (let i = 0; i < currentSchedule.teacherSurnames.length; i += 3) {
      keyboard.push(
        currentSchedule.teacherSurnames.slice(i, i + 3).map((s) => ({
          text: s,
          callback_data: `teacher_${s}`,
        }))
      );
    }
    keyboard.push([{ text: 'Поиск по группам', callback_data: 'list_groups' }]);
    return {
      replyText: reply,
      lessonsFound: currentSchedule.teachers.length,
      keyboard,
    };
  }

  // 4. Group day filter callback: "groupday_<Day>_<GroupName>"
  if (cleanText.startsWith('groupday_')) {
    const parts = cleanText.split('_');
    const day = parts[1];
    const groupName = parts.slice(2).join('_');
    return queryScheduleByGroup(currentSchedule, groupName, day);
  }

  // 5. Group direct callback: "group_<GroupName>"
  if (cleanText.startsWith('group_')) {
    const groupName = cleanText.replace('group_', '');
    return queryScheduleByGroup(currentSchedule, groupName, dayParam);
  }

  // 6. Teacher day filter callback: "day_<Day>_<Surname>"
  if (cleanText.startsWith('day_')) {
    const parts = cleanText.split('_');
    const day = parts[1];
    const surname = parts.slice(2).join('_');
    return queryScheduleBySurname(currentSchedule, surname, day);
  }

  // 7. Teacher direct callback: "teacher_<Surname>"
  if (cleanText.startsWith('teacher_')) {
    const surname = cleanText.replace('teacher_', '');
    return queryScheduleBySurname(currentSchedule, surname, dayParam);
  }

  // 8. Try matching a group name first (exact or normalized like '26а1' or '26-ид-1')
  const matchedGroup = findMatchingGroup(currentSchedule.groups, cleanText);
  if (matchedGroup) {
    return queryScheduleByGroup(currentSchedule, matchedGroup, dayParam);
  }

  // 9. Try matching teacher surname
  const querySurname = cleanText.replace(/^teacher_/, '');
  const teacherResult = queryScheduleBySurname(currentSchedule, querySurname, dayParam);
  if (teacherResult.lessonsFound > 0) {
    return teacherResult;
  }

  // 10. Fallback: if not found, offer quick buttons for both teachers and groups
  const topTeachers = currentSchedule.teacherSurnames.slice(0, 4);
  const topGroups = currentSchedule.groups.slice(0, 4);

  return {
    replyText: `По запросу "${cleanText}" ничего не найдено.\n\nПожалуйста, укажите фамилию преподавателя или название группы:`,
    lessonsFound: 0,
    keyboard: [
      topTeachers.map((t) => ({ text: t, callback_data: `teacher_${t}` })),
      topGroups.map((g) => ({ text: g, callback_data: `group_${g}` })),
      [
        { text: 'Все группы', callback_data: 'list_groups' },
        { text: 'Все преподаватели', callback_data: 'list_teachers' },
      ],
    ],
  };
}

/**
 * Initializes Telegram bot long-polling if TELEGRAM_BOT_TOKEN is set.
 */
async function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.trim().length < 10) {
    console.log('Telegram bot token not configured in TELEGRAM_BOT_TOKEN env variable. Web simulator is active.');
    return;
  }

  try {
    // 1. Verify token with getMe
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await res.json() as any;

    if (!data.ok) {
      telegramBotStatus.error = `Telegram API error: ${data.description}`;
      console.error('Invalid Telegram bot token:', data.description);
      return;
    }

    telegramBotStatus.configured = true;
    telegramBotStatus.active = true;
    telegramBotStatus.botInfo = data.result;
    console.log(`Telegram bot connected: @${data.result.username} (${data.result.first_name})`);

    // 2. Start polling
    startTelegramPolling(token);
  } catch (err: any) {
    telegramBotStatus.error = err.message;
    console.error('Failed to init Telegram bot:', err);
  }
}

async function startTelegramPolling(token: string) {
  if (pollingController) {
    pollingController.abort();
  }
  pollingController = new AbortController();

  const poll = async () => {
    while (telegramBotStatus.active) {
      try {
        const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=20`;
        const res = await fetch(url, { signal: pollingController?.signal });
        const data = await res.json() as any;

        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            lastUpdateId = Math.max(lastUpdateId, update.update_id);
            await handleTelegramUpdate(token, update);
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') break;
        console.error('Telegram polling error, retrying in 3s:', err.message);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  };

  poll().catch((e) => console.error('Polling crashed:', e));
}

async function handleTelegramUpdate(token: string, update: any) {
  telegramBotStatus.totalQueriesHandled++;
  telegramBotStatus.lastActive = new Date().toISOString();

  let chatId: number | null = null;
  let text = '';
  let callbackData = '';

  if (update.message && update.message.text) {
    chatId = update.message.chat.id;
    text = update.message.text.trim();
  } else if (update.callback_query) {
    chatId = update.callback_query.message.chat.id;
    callbackData = update.callback_query.data;
    text = callbackData;

    // Acknowledge callback
    try {
      await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: update.callback_query.id }),
      });
    } catch (e) {
      // ignore
    }
  }

  if (!chatId) return;

  const result = handleBotQuery(text);
  const botReply = result.replyText;
  let inlineKeyboard: any[] = [];
  if (result.keyboard) {
    inlineKeyboard = result.keyboard.map((row) =>
      row.map((btn) => ({
        text: btn.text,
        callback_data: btn.callback_data || `teacher_${btn.text}`,
      }))
    );
  }

  // Send message via Telegram API
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: botReply,
        parse_mode: 'Markdown',
        reply_markup: inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined,
      }),
    });
  } catch (err: any) {
    console.error('Failed to send Telegram message:', err.message);
  }
}

startServer();
