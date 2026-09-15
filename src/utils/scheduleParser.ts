import * as XLSX from 'xlsx';
import { ScheduleData, ScheduleLesson, BotQueryResult, TelegramKeyboardButton } from '../types';

// Standard college bell schedule fallback
export const DEFAULT_TIMES: Record<number, string> = {
  1: '09.00-10.20',
  2: '10.30-11.50',
  3: '12.10-13.30',
  4: '13.40-15.00',
  5: '15.20-16.40',
  6: '16.50-18.10',
  7: '18.20-19.40',
};

export const RUSSIAN_DAYS = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
];

/**
 * Extracts teacher name, surname, initials, and subject from a multi-line cell.
 */
export function extractSubjectAndTeacher(rawText: string): {
  subject: string;
  teacher: string;
  teacherSurname: string;
  subgroup?: string;
} {
  if (!rawText || !rawText.trim()) {
    return { subject: '', teacher: '', teacherSurname: '' };
  }

  const cleanText = rawText.trim();
  const rawLines = cleanText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let subgroup = '';
  // Check for subgroup notations like "1 п/г", "2 п/г", "1+2 п/г"
  const subMatch = cleanText.match(/(\d\s*п\/г|\d\+\d\s*п\/г)/i);
  if (subMatch) {
    subgroup = subMatch[1];
  }

  // Teacher pattern in Russian: Surname + Initials (e.g., "Евсеева А.Е." or "Евсеева А. Е." or "А.Е. Евсеева")
  const teacherRegex = /([А-ЯЁ][а-яё\-]+)\s+([А-ЯЁ]\s*\.\s*[А-ЯЁ]\s*\.?)/;
  const reverseTeacherRegex = /([А-ЯЁ]\s*\.\s*[А-ЯЁ]\s*\.?)\s+([А-ЯЁ][а-яё\-]+)/;

  let foundTeacher = '';
  let foundSurname = '';
  const remainingLines: string[] = [];

  // Check lines from bottom up for teacher name
  for (let i = rawLines.length - 1; i >= 0; i--) {
    const line = rawLines[i];
    const match1 = line.match(teacherRegex);
    const match2 = line.match(reverseTeacherRegex);

    if (match1 && !foundTeacher) {
      foundSurname = match1[1];
      const initials = match1[2].replace(/\s+/g, '');
      foundTeacher = `${match1[1]} ${initials}`;
      const lineWithoutTeacher = line.replace(match1[0], '').trim();
      if (lineWithoutTeacher) {
        remainingLines.unshift(lineWithoutTeacher);
      }
    } else if (match2 && !foundTeacher) {
      foundSurname = match2[2];
      const initials = match2[1].replace(/\s+/g, '');
      foundTeacher = `${match2[2]} ${initials}`;
      const lineWithoutTeacher = line.replace(match2[0], '').trim();
      if (lineWithoutTeacher) {
        remainingLines.unshift(lineWithoutTeacher);
      }
    } else {
      remainingLines.unshift(line);
    }
  }

  // Fallback: If no initials found, but last line looks like a single surname
  if (!foundTeacher && remainingLines.length > 1) {
    const lastLine = remainingLines[remainingLines.length - 1];
    if (/^[А-ЯЁ][а-яё\-]+$/.test(lastLine)) {
      foundSurname = lastLine;
      foundTeacher = lastLine;
      remainingLines.pop();
    }
  }

  // Clean lines from subgroup tags (e.g. "1 п/г") to isolate the actual subject name
  const cleanedSubjectLines = remainingLines
    .map((l) => l.replace(/(\d\s*п\/г|\d\+\d\s*п\/г)/gi, '').trim())
    .filter(Boolean);

  let subject = cleanedSubjectLines.join(' ').replace(/\s+/g, ' ').trim();

  // If subject is still empty (e.g., cell was single line with teacher and subject),
  // strip teacher name from cleanText to get exact subject name
  if (!subject) {
    if (foundTeacher) {
      let stripped = cleanText;
      if (foundTeacher) {
        stripped = stripped.replace(foundTeacher, '');
      }
      if (foundSurname) {
        stripped = stripped.replace(new RegExp(foundSurname + '[^\\n]*', 'g'), '');
      }
      if (subgroup) {
        stripped = stripped.replace(subgroup, '');
      }
      stripped = stripped.replace(/[\r\n\t,;/]+/g, ' ').replace(/\s+/g, ' ').trim();
      if (stripped.length > 1) {
        subject = stripped;
      }
    } else {
      subject = cleanText;
    }
  }

  // If still completely empty, use whatever non-empty text existed in cell
  if (!subject) {
    subject = cleanText;
  }

  return {
    subject,
    teacher: foundTeacher,
    teacherSurname: foundSurname,
    subgroup,
  };
}

/**
 * Normalizes surname for searching (lowercase, trimmed, Cyrillic ё -> е).
 */
export function normalizeSurname(name: string): string {
  return (name || '')
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^а-яa-z0-9\-]/gi, '');
}

/**
 * Merges duplicated classes into combined classes when multiple groups
 * share the same teacher at the same day & lesson period.
 */
export function consolidateCombinedClasses(lessons: ScheduleLesson[]): ScheduleLesson[] {
  const map = new Map<string, ScheduleLesson>();

  for (const lesson of lessons) {
    if (!lesson.teacherSurname) {
      map.set(lesson.id, lesson);
      continue;
    }

    // Key by day, lessonNumber, normalized teacher surname
    const key = `${lesson.day}_${lesson.lessonNumber}_${normalizeSurname(lesson.teacherSurname)}`;

    if (map.has(key)) {
      const existing = map.get(key)!;
      // Combine groups
      const allGroups = Array.from(new Set([...existing.groups, ...lesson.groups, lesson.group]));
      existing.groups = allGroups;
      existing.isCombined = allGroups.length > 1;
      existing.group = allGroups.join(', ');
      // Combine classrooms if different
      if (lesson.classroom && !existing.classroom.includes(lesson.classroom)) {
        existing.classroom = existing.classroom
          ? `${existing.classroom}, ${lesson.classroom}`
          : lesson.classroom;
      }
      // If subject was missing in one, take the richer one
      if (lesson.subject && lesson.subject.length > existing.subject.length) {
        existing.subject = lesson.subject;
      }
    } else {
      map.set(key, {
        ...lesson,
        groups: lesson.groups && lesson.groups.length > 0 ? lesson.groups : [lesson.group],
        isCombined: (lesson.groups && lesson.groups.length > 1) || lesson.isCombined,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const dayOrderA = RUSSIAN_DAYS.indexOf(a.day);
    const dayOrderB = RUSSIAN_DAYS.indexOf(b.day);
    if (dayOrderA !== dayOrderB) return dayOrderA - dayOrderB;
    return a.lessonNumber - b.lessonNumber;
  });
}

/**
 * Parses an Excel file workbook into structured ScheduleData.
 */
export function parseExcelWorkbook(workbook: XLSX.WorkBook, filename = 'schedule.xlsx'): ScheduleData {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error('Лист расписания не найден в файле');
  }

  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z100');
  const merges = sheet['!merges'] || [];

  // Helper to safely get cell text
  const getCellText = (r: number, c: number): string => {
    const cellAddress = XLSX.utils.encode_cell({ r, c });
    const cell = sheet[cellAddress];
    if (!cell || cell.v === undefined || cell.v === null) return '';
    return String(cell.v).trim();
  };

  // Find date range title
  let dateRange = '14.09.2026 - 19.09.2026';
  let title = 'РАСПИСАНИЕ ЗАНЯТИЙ';

  for (let r = 0; r < Math.min(6, range.e.r); r++) {
    for (let c = 0; c <= range.e.c; c++) {
      const text = getCellText(r, c);
      if (/РАСПИСАНИЕ/i.test(text)) {
        title = text;
      }
      const dateMatch = text.match(/(\d{2}\.\d{2}\.\d{4}\s*-\s*\d{2}\.\d{2}\.\d{4})/);
      if (dateMatch) {
        dateRange = dateMatch[1];
      }
    }
  }

  // Find group header row. Groups typically look like "26-А-1", "26-АН-1", "ИС-201", etc.
  let groupRowIndex = -1;
  interface GroupCol {
    groupName: string;
    subjectCol: number;
    audCol: number;
    spanEndCol?: number;
  }
  const groupCols: GroupCol[] = [];

  for (let r = 0; r < Math.min(10, range.e.r); r++) {
    const potentialGroups: { name: string; col: number }[] = [];
    for (let c = 3; c <= range.e.c; c++) {
      const text = getCellText(r, c);
      if (text && (/\d+-[А-ЯЁа-яё]+-\d+/i.test(text) || /групп/i.test(text) || /^\d+[А-ЯЁа-яё\-]+\d*/.test(text))) {
        potentialGroups.push({ name: text.replace(/группа/i, '').trim(), col: c });
      }
    }
    if (potentialGroups.length >= 2) {
      groupRowIndex = r;
      break;
    }
  }

  // If group row was found, identify columns
  if (groupRowIndex !== -1) {
    let col = 3;
    while (col <= range.e.c) {
      const headerText = getCellText(groupRowIndex, col);
      if (headerText) {
        // Find if this cell is merged horizontally
        const merge = merges.find((m) => m.s.r === groupRowIndex && m.s.c === col);
        const nextCol = col + 1;
        const subheader1 = getCellText(groupRowIndex + 1, col);
        const subheader2 = getCellText(groupRowIndex + 1, nextCol);

        let audCol = nextCol;
        if (/ауд/i.test(subheader2)) {
          audCol = nextCol;
        }

        groupCols.push({
          groupName: headerText,
          subjectCol: col,
          audCol: audCol,
          spanEndCol: merge ? merge.e.c : nextCol,
        });

        col = merge ? merge.e.c + 1 : col + 2;
      } else {
        col++;
      }
    }
  }

  // If no group row detected with standard pattern, build default columns matching screenshot
  if (groupCols.length === 0) {
    const fallbackGroups = ['26-А-1', '26-АН-1', '26-Д-1', '26-ЗМ-1', '26-ИД-1'];
    let startCol = 3;
    for (const g of fallbackGroups) {
      groupCols.push({
        groupName: g,
        subjectCol: startCol,
        audCol: startCol + 1,
      });
      startCol += 2;
    }
  }

  // Parse lesson rows
  const rawLessons: ScheduleLesson[] = [];
  let currentDay = 'Понедельник';
  let currentDate = '14.09.2026';
  let currentLessonNum = 1;
  let currentTime = DEFAULT_TIMES[1];

  const startRow = groupRowIndex !== -1 ? groupRowIndex + 2 : 6;

  for (let r = startRow; r <= range.e.r; r++) {
    // Check Day column (col 0 or 1)
    const dayCellText = getCellText(r, 0) || getCellText(r, 1);
    for (const d of RUSSIAN_DAYS) {
      if (new RegExp(d, 'i').test(dayCellText)) {
        currentDay = d;
        const dateMatch = dayCellText.match(/(\d{2}\.\d{2}\.\d{4})/);
        if (dateMatch) {
          currentDate = dateMatch[1];
        }
        break;
      }
    }

    // Check Lesson Number column (col 1 or 2)
    const numText = getCellText(r, 1) || getCellText(r, 2);
    const numMatch = numText.match(/^([1-7])$/);
    if (numMatch) {
      currentLessonNum = parseInt(numMatch[1], 10);
    }

    // Check Time column (col 2 or 3)
    const timeText = getCellText(r, 2) || getCellText(r, 3);
    const timeMatch = timeText.match(/(\d{2}[.:]\d{2}\s*-\s*\d{2}[.:]\d{2})/);
    if (timeMatch) {
      currentTime = timeMatch[1].replace(':', '.');
    } else if (DEFAULT_TIMES[currentLessonNum]) {
      currentTime = DEFAULT_TIMES[currentLessonNum];
    }

    // Check each group column
    for (const g of groupCols) {
      // Check if this cell is part of a horizontal merge spanning multiple groups
      const merge = merges.find(
        (m) => r >= m.s.r && r <= m.e.r && g.subjectCol >= m.s.c && g.subjectCol <= m.e.c
      );

      let cellText = getCellText(r, g.subjectCol);
      let audText = getCellText(r, g.audCol);

      // If merged, fetch from the top-left of merge
      let coveredGroups: string[] = [g.groupName];
      if (merge && (merge.e.c - merge.s.c > 1)) {
        cellText = getCellText(merge.s.r, merge.s.c);
        // Find which groups are spanned by this merge
        coveredGroups = groupCols
          .filter((grp) => grp.subjectCol >= merge.s.c && grp.subjectCol <= merge.e.c)
          .map((grp) => grp.groupName);
      }

      if (!cellText || cellText.length < 2) continue;

      const { subject, teacher, teacherSurname, subgroup } = extractSubjectAndTeacher(cellText);
      if (!subject && !teacher) continue;

      const isCombined = coveredGroups.length > 1;

      rawLessons.push({
        id: `lesson_${r}_${g.subjectCol}`,
        day: currentDay,
        date: currentDate,
        lessonNumber: currentLessonNum,
        time: currentTime,
        subject: subject || cellText,
        teacher: teacher || '',
        teacherSurname: teacherSurname || '',
        group: isCombined ? coveredGroups.join(', ') : g.groupName,
        groups: coveredGroups,
        classroom: audText,
        isCombined,
        subgroup,
      });
    }
  }

  // Consolidate identical classes into combined streams
  const lessons = consolidateCombinedClasses(rawLessons);

  // Extract unique teachers and groups
  const teachersSet = new Set<string>();
  const surnamesSet = new Set<string>();
  const groupsSet = new Set<string>();
  const daysSet = new Set<string>();

  for (const l of lessons) {
    if (l.teacher) teachersSet.add(l.teacher);
    if (l.teacherSurname) surnamesSet.add(l.teacherSurname);
    for (const grp of l.groups) groupsSet.add(grp);
    if (l.day) daysSet.add(l.day);
  }

  return {
    title,
    dateRange,
    lessons,
    teachers: Array.from(teachersSet).sort((a, b) => a.localeCompare(b, 'ru')),
    teacherSurnames: Array.from(surnamesSet).sort((a, b) => a.localeCompare(b, 'ru')),
    groups: Array.from(groupsSet).sort((a, b) => a.localeCompare(b, 'ru')),
    days: Array.from(daysSet).sort((a, b) => RUSSIAN_DAYS.indexOf(a) - RUSSIAN_DAYS.indexOf(b)),
    filename,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Helper to normalize group strings (stripping dashes, spaces, slashes)
 */
export function normalizeGroupQuery(str: string): string {
  return str.replace(/[\s\-_/.,]/g, '').toLowerCase().replace(/ё/g, 'е');
}

/**
 * Finds group in data by exact, normalized or partial query
 */
export function findMatchingGroup(groups: string[], query: string): string | undefined {
  const normQuery = normalizeGroupQuery(query);
  if (!normQuery) return undefined;

  // 1. Exact match (case-insensitive)
  const exact = groups.find((g) => g.toLowerCase() === query.trim().toLowerCase());
  if (exact) return exact;

  // 2. Normalized match (e.g. '26а1' matches '26-А-1')
  const normMatch = groups.find((g) => normalizeGroupQuery(g) === normQuery);
  if (normMatch) return normMatch;

  // 3. Normalized substring match (e.g. 'ид-1' or '26-ан')
  const partial = groups.find((g) => {
    const ng = normalizeGroupQuery(g);
    return ng.includes(normQuery) || normQuery.includes(ng);
  });
  if (partial) return partial;

  return undefined;
}

/**
 * Filters schedule by surname and optional day, formatting bot response.
 */
export function queryScheduleBySurname(
  data: ScheduleData,
  rawQuery: string,
  targetDay?: string
): BotQueryResult {
  const normQuery = normalizeSurname(rawQuery);

  if (!normQuery) {
    return {
      replyText: 'Пожалуйста, укажите фамилию преподавателя (например: Евсеева, Васильева, Мартыненко) или группу (например: 26-А-1).',
      lessonsFound: 0,
    };
  }

  // Match teacher
  let matchedTeacherSurname = data.teacherSurnames.find(
    (s) => normalizeSurname(s) === normQuery
  );

  // Partial match fallback if exact match wasn't found
  if (!matchedTeacherSurname) {
    matchedTeacherSurname = data.teacherSurnames.find(
      (s) => normalizeSurname(s).startsWith(normQuery) || normQuery.startsWith(normalizeSurname(s))
    );
  }

  // If still not found, check full teacher names
  let fullTeacherName = '';
  if (matchedTeacherSurname) {
    fullTeacherName =
      data.teachers.find((t) => t.includes(matchedTeacherSurname!)) || matchedTeacherSurname;
  } else {
    const byFullName = data.teachers.find((t) => normalizeSurname(t).includes(normQuery));
    if (byFullName) {
      fullTeacherName = byFullName;
      matchedTeacherSurname = byFullName.split(' ')[0];
    }
  }

  if (!matchedTeacherSurname) {
    // Suggest available teachers
    const suggestions = data.teacherSurnames.slice(0, 8);
    const keyboard: TelegramKeyboardButton[][] = [];
    for (let i = 0; i < suggestions.length; i += 2) {
      keyboard.push(
        suggestions.slice(i, i + 2).map((s) => ({
          text: s,
          callback_data: `teacher_${s}`,
        }))
      );
    }
    keyboard.push([{ text: 'Поиск по учебным группам', callback_data: 'list_groups' }]);

    return {
      replyText: `Преподаватель с фамилией "${rawQuery}" не найден в расписании.\n\nВыберите преподавателя из списка или воспользуйтесь поиском по группам:`,
      lessonsFound: 0,
      keyboard,
    };
  }

  // Filter lessons
  const targetSurnameNorm = normalizeSurname(matchedTeacherSurname);
  let lessons = data.lessons.filter(
    (l) => normalizeSurname(l.teacherSurname) === targetSurnameNorm
  );

  if (targetDay && targetDay !== 'all') {
    lessons = lessons.filter((l) => l.day.toLowerCase() === targetDay.toLowerCase());
  }

  const daysToDisplay = targetDay && targetDay !== 'all' ? [targetDay] : data.days;

  let responseText = `Расписание для: ${fullTeacherName || matchedTeacherSurname}\n`;
  responseText += `Период: ${data.dateRange}\n`;
  responseText += `Всего занятий найдено: ${lessons.length}\n\n`;

  let totalCount = 0;

  for (const day of daysToDisplay) {
    const dayLessons = lessons.filter((l) => l.day.toLowerCase() === day.toLowerCase());
    const dayDate = dayLessons[0]?.date ? ` (${dayLessons[0].date})` : '';

    responseText += `━━━━━━━━━━━━━━━━━━━━\n`;
    responseText += `${day.toUpperCase()}${dayDate}\n`;

    if (dayLessons.length === 0) {
      responseText += `Занятий нет\n\n`;
      continue;
    }

    dayLessons.sort((a, b) => a.lessonNumber - b.lessonNumber);

    for (const l of dayLessons) {
      totalCount++;
      const combinedBadge = l.isCombined ? ' [Совмещенная пара / Поток]' : '';
      const subgroupInfo = l.subgroup ? ` (${l.subgroup})` : '';

      responseText += `\n${l.lessonNumber}-я пара - ${l.time}\n`;
      responseText += `Группа: ${l.groups.join(', ')}${subgroupInfo}${combinedBadge}\n`;
      if (l.classroom) {
        responseText += `Аудитория: ${l.classroom}\n`;
      }
    }
    responseText += `\n`;
  }

  // Generate inline quick buttons for day filtering
  const dayButtons: TelegramKeyboardButton[] = [
    { text: 'Вся неделя', callback_data: `day_all_${matchedTeacherSurname}` },
  ];

  const individualDays = data.days.map((d) => ({
    text: d.slice(0, 3),
    callback_data: `day_${d}_${matchedTeacherSurname}`,
  }));

  const keyboard: TelegramKeyboardButton[][] = [
    dayButtons,
    individualDays.slice(0, 3),
    individualDays.slice(3),
    [
      { text: 'Выбрать другого преподавателя', callback_data: 'list_teachers' },
      { text: 'Поиск по группе', callback_data: 'list_groups' },
    ],
  ];

  return {
    replyText: responseText.trim(),
    matchedTeacher: fullTeacherName || matchedTeacherSurname,
    lessonsFound: totalCount,
    keyboard,
  };
}

/**
 * Query schedule by Student Group.
 */
export function queryScheduleByGroup(
  data: ScheduleData,
  groupQuery: string,
  targetDay?: string
): BotQueryResult {
  const matchedGroup = findMatchingGroup(data.groups, groupQuery);

  if (!matchedGroup) {
    const groupButtons: TelegramKeyboardButton[][] = [];
    for (let i = 0; i < data.groups.length; i += 2) {
      groupButtons.push(
        data.groups.slice(i, i + 2).map((g) => ({
          text: g,
          callback_data: `group_${g}`,
        }))
      );
    }
    groupButtons.push([{ text: 'Поиск по преподавателям', callback_data: 'list_teachers' }]);

    return {
      replyText: `Группа "${groupQuery}" не найдена в расписании.\n\nВыберите группу из доступных:`,
      lessonsFound: 0,
      keyboard: groupButtons,
    };
  }

  let lessons = data.lessons.filter((l) =>
    l.groups.some((g) => g.toUpperCase() === matchedGroup.toUpperCase())
  );

  if (targetDay && targetDay !== 'all') {
    lessons = lessons.filter((l) => l.day.toLowerCase() === targetDay.toLowerCase());
  }

  const daysToDisplay = targetDay && targetDay !== 'all' ? [targetDay] : data.days;

  let responseText = `Расписание для группы: ${matchedGroup}\n`;
  responseText += `Период: ${data.dateRange}\n`;
  responseText += `Всего занятий найдено: ${lessons.length}\n\n`;

  let totalCount = 0;

  for (const day of daysToDisplay) {
    const dayLessons = lessons.filter((l) => l.day.toLowerCase() === day.toLowerCase());
    const dayDate = dayLessons[0]?.date ? ` (${dayLessons[0].date})` : '';

    responseText += `━━━━━━━━━━━━━━━━━━━━\n`;
    responseText += `${day.toUpperCase()}${dayDate}\n`;

    if (dayLessons.length === 0) {
      responseText += `Занятий нет\n\n`;
      continue;
    }

    dayLessons.sort((a, b) => a.lessonNumber - b.lessonNumber);

    for (const l of dayLessons) {
      totalCount++;
      const otherGroups = l.groups.filter((g) => g.toUpperCase() !== matchedGroup.toUpperCase());
      const combinedInfo =
        l.isCombined && otherGroups.length > 0
          ? ` [Совмещенная пара с группой: ${otherGroups.join(', ')}]`
          : '';

      responseText += `\n${l.lessonNumber}-я пара - ${l.time}\n`;
      if (l.teacher) {
        responseText += `Преподаватель: ${l.teacher}\n`;
      }
      const subgroupInfo = l.subgroup ? ` (${l.subgroup})` : '';
      responseText += `Группа: ${matchedGroup}${subgroupInfo}\n`;
      if (l.classroom) {
        responseText += `Аудитория: ${l.classroom}\n`;
      }
      if (combinedInfo) {
        responseText += `${combinedInfo}\n`;
      }
    }
    responseText += `\n`;
  }

  // Generate inline day buttons for group schedule
  const dayButtons: TelegramKeyboardButton[] = [
    { text: 'Вся неделя', callback_data: `groupday_all_${matchedGroup}` },
  ];

  const individualDays = data.days.map((d) => ({
    text: d.slice(0, 3),
    callback_data: `groupday_${d}_${matchedGroup}`,
  }));

  const keyboard: TelegramKeyboardButton[][] = [
    dayButtons,
    individualDays.slice(0, 3),
    individualDays.slice(3),
    [
      { text: 'Выбрать другую группу', callback_data: 'list_groups' },
      { text: 'Поиск по преподавателям', callback_data: 'list_teachers' },
    ],
  ];

  return {
    replyText: responseText.trim(),
    matchedGroup,
    lessonsFound: totalCount,
    keyboard,
  };
}
