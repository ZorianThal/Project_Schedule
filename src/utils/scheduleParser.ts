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

/**
 * Maps standard bell start times to lesson numbers (1 to 7)
 */
export function getLessonNumberFromTime(timeStr: string): number | null {
  if (!timeStr) return null;
  const clean = timeStr.replace(/\s+/g, '').replace(':', '.');
  const match = clean.match(/^(\d{1,2})[.:](\d{2})/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const totalMins = hours * 60 + minutes;

  // Approximate lesson starts:
  // 1st: ~08:30 - 09:15 (510 - 555 min) -> 1
  // 2nd: ~10:00 - 11:00 (600 - 660 min) -> 2
  // 3rd: ~11:45 - 12:45 (705 - 765 min) -> 3
  // 4th: ~13:20 - 14:15 (800 - 855 min) -> 4
  // 5th: ~15:00 - 15:45 (900 - 945 min) -> 5
  // 6th: ~16:30 - 17:15 (990 - 1035 min) -> 6
  // 7th: ~18:00 - 18:45 (1080 - 1125 min) -> 7
  if (totalMins >= 480 && totalMins <= 570) return 1;
  if (totalMins >= 580 && totalMins <= 675) return 2;
  if (totalMins >= 685 && totalMins <= 780) return 3;
  if (totalMins >= 790 && totalMins <= 885) return 4;
  if (totalMins >= 890 && totalMins <= 975) return 5;
  if (totalMins >= 980 && totalMins <= 1065) return 6;
  if (totalMins >= 1070 && totalMins <= 1160) return 7;
  return null;
}

/**
 * Extracts lesson number (1 to 7) from cell text, handling digits, spaces, dots,
 * suffixes like "-я пара", "1 пара", or Roman numerals ("I" to "VII").
 */
export function parseLessonNumberFromText(rawText: string): number | null {
  if (!rawText) return null;
  const t = rawText.trim();
  if (!t) return null;

  // 1. Check Roman numerals
  const romanMatch = t.match(/^(?:пара\s*)?(VII|VI|IV|V|III|II|I)(?:\s*пара)?$/i);
  if (romanMatch) {
    const rMap: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7 };
    const num = rMap[romanMatch[1].toUpperCase()];
    if (num) return num;
  }

  // 2. Strict / exact single digit 1-7 or with "пара" / "-я" / "."
  const singleMatch = t.match(/^(?:пара\s*)?([1-7])(?:[-–—.]?(?:я|ая|пара))?$/i);
  if (singleMatch) {
    return parseInt(singleMatch[1], 10);
  }

  // 3. Any occurrence of digit 1-7 followed by dot, suffix, or word 'пара'
  const wordMatch = t.match(/\b([1-7])\s*(?:[-–—.]?(?:я|ая)|пара|\.)/i);
  if (wordMatch) {
    return parseInt(wordMatch[1], 10);
  }

  // 4. Fallback: if entire string stripped of spaces is single digit 1-7
  const stripped = t.replace(/\s+/g, '');
  if (/^[1-7]$/.test(stripped)) {
    return parseInt(stripped, 10);
  }

  return null;
}

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
 * Extracts all teacher surnames from a string, supporting multiple teachers separated by semicolons.
 */
export function extractTeacherSurnames(teacherStr: string): string[] {
  if (!teacherStr || !teacherStr.trim()) return [];
  const clean = teacherStr.trim();
  const regex = /([А-ЯЁ][а-яё\-]+)(?:\s+[А-ЯЁ]\.\s*[А-ЯЁ]\.|\s+[А-ЯЁ]\.)?/g;
  const surnames: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(clean)) !== null) {
    const s = match[1];
    if (s && s.length >= 3 && !/^(Ауд|Пара|Урок|Группа|Лекция|Практ)/i.test(s)) {
      surnames.push(s);
    }
  }
  if (surnames.length > 0) {
    return Array.from(new Set(surnames));
  }
  return clean
    .split(/[;,]/)
    .map((s) => s.trim().split(/\s+/)[0])
    .filter((s) => s && s.length >= 3);
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
    if (!lesson.teacherSurname && !lesson.subject) {
      map.set(lesson.id, lesson);
      continue;
    }

    // Key by day, lessonNumber, and teacher surname or subject
    const teacherKey = lesson.teacherSurname ? normalizeSurname(lesson.teacherSurname) : '';
    const subjectKey = lesson.subject ? lesson.subject.toLowerCase().replace(/\s+/g, '') : '';
    const key = `${lesson.day}_${lesson.lessonNumber}_${teacherKey || subjectKey}`;

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
      if (lesson.teacher && !existing.teacher) {
        existing.teacher = lesson.teacher;
        existing.teacherSurname = lesson.teacherSurname;
      }
      if (lesson.teacherSurnames) {
        existing.teacherSurnames = Array.from(
          new Set([...(existing.teacherSurnames || []), ...lesson.teacherSurnames])
        );
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
      if (
        text &&
        (/\d+-[А-ЯЁа-яё]+(?:-\d+)+/i.test(text) ||
          /\d+-[А-ЯЁа-яё]+-\d+/i.test(text) ||
          /групп/i.test(text) ||
          /^\d+[А-ЯЁа-яё\-]+\d*/.test(text))
      ) {
        potentialGroups.push({ name: text.replace(/группа/i, '').trim(), col: c });
      }
    }
    if (potentialGroups.length >= 1) {
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
    const fallbackGroups = ['26-А-1', '26-АН-1', '26-Д-1', '26-ЗМ-1', '26-ИД-1', '26-ИИ-1'];
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

  // Parse lesson rows using 3-row slot awareness
  const rawLessons: ScheduleLesson[] = [];
  let currentDay = 'Понедельник';
  let currentDate = '14.09.2026';
  let currentLessonNum = 1;
  let currentTime = DEFAULT_TIMES[1];

  const startRow = groupRowIndex !== -1 ? groupRowIndex + 2 : 6;

  let r = startRow;
  while (r <= range.e.r) {
    // Check Day column (col 0, 1 or 2)
    const dayCellText = getCellText(r, 0) || getCellText(r, 1);
    let dayChanged = false;
    for (const d of RUSSIAN_DAYS) {
      if (new RegExp(d, 'i').test(dayCellText)) {
        if (currentDay !== d) {
          currentDay = d;
          dayChanged = true;
          // When day changes, reset lesson counter to 1 by default
          currentLessonNum = 1;
          currentTime = DEFAULT_TIMES[1];
        }
        const dateMatch = dayCellText.match(/(\d{2}\.\d{2}\.\d{4})/);
        if (dateMatch) {
          currentDate = dateMatch[1];
        }
        break;
      }
    }

    // Check Lesson Number column (col 0, 1, 2 or 3)
    const numTextCol0 = getCellText(r, 0);
    const numTextCol1 = getCellText(r, 1);
    const numTextCol2 = getCellText(r, 2);
    const numTextCol3 = getCellText(r, 3);

    const parsedNum =
      parseLessonNumberFromText(numTextCol1) ||
      parseLessonNumberFromText(numTextCol2) ||
      (parseLessonNumberFromText(numTextCol0) !== null && !RUSSIAN_DAYS.some(d => new RegExp(d, 'i').test(numTextCol0))
        ? parseLessonNumberFromText(numTextCol0)
        : null);

    // Check Time column (col 1, 2, 3 or 4)
    const candidateTimeTexts = [numTextCol2, numTextCol3, numTextCol1, getCellText(r, 4)];
    let foundTimeMatch: string | null = null;
    let timeDerivedLessonNum: number | null = null;

    for (const txt of candidateTimeTexts) {
      if (!txt) continue;
      const tMatch = txt.match(/(\d{1,2}[.:]\d{2}\s*[-–—]\s*\d{1,2}[.:]\d{2})/);
      if (tMatch) {
        foundTimeMatch = tMatch[1].replace(':', '.');
        timeDerivedLessonNum = getLessonNumberFromTime(foundTimeMatch);
        break;
      }
    }

    // Determine currentLessonNum:
    // 1. Explicit parsed number takes priority
    // 2. If explicit parsed number not found, try to infer from time
    // 3. If neither found, and day changed, reset to 1
    // 4. Otherwise keep currentLessonNum
    if (parsedNum !== null) {
      currentLessonNum = parsedNum;
    } else if (timeDerivedLessonNum !== null) {
      currentLessonNum = timeDerivedLessonNum;
    } else if (dayChanged) {
      currentLessonNum = 1;
    }

    // Determine currentTime
    if (foundTimeMatch) {
      currentTime = foundTimeMatch;
    } else if (DEFAULT_TIMES[currentLessonNum]) {
      currentTime = DEFAULT_TIMES[currentLessonNum];
    }

    // Determine slot height (number of rows in the schedule block for this lesson)
    // In college schedules (as in the screenshot), each lesson block consists of 3 rows:
    // 1st row (r): Subject name (+ optional subgroup)
    // 2nd row (r+1): Empty
    // 3rd row (r+2): Teacher name(s)
    let slotHeight = 3;

    // Check vertical merge in lesson number or time column
    const slotMerge = merges.find(
      (m) => m.s.r === r && (m.s.c === 0 || m.s.c === 1 || m.s.c === 2 || m.s.c === 3)
    );
    if (slotMerge) {
      slotHeight = Math.max(1, slotMerge.e.r - slotMerge.s.r + 1);
    } else {
      // Look ahead to check where the next lesson begins
      for (let nextR = r + 1; nextR <= Math.min(r + 6, range.e.r); nextR++) {
        const nextCol0 = getCellText(nextR, 0);
        const nextCol1 = getCellText(nextR, 1);
        const nextCol2 = getCellText(nextR, 2);
        const nextCol3 = getCellText(nextR, 3);

        const hasNextDay = RUSSIAN_DAYS.some(
          (d) => new RegExp(d, 'i').test(nextCol0) || new RegExp(d, 'i').test(nextCol1)
        );
        const hasNextNum =
          parseLessonNumberFromText(nextCol1) !== null ||
          parseLessonNumberFromText(nextCol2) !== null;
        const hasNextTime =
          /(\d{1,2}[.:]\d{2}\s*[-–—]\s*\d{1,2}[.:]\d{2})/.test(nextCol2) ||
          /(\d{1,2}[.:]\d{2}\s*[-–—]\s*\d{1,2}[.:]\d{2})/.test(nextCol3);

        if (hasNextDay || hasNextNum || hasNextTime) {
          slotHeight = nextR - r;
          break;
        }
      }
    }

    if (slotHeight < 1 || slotHeight > 6) {
      slotHeight = 3;
    }

    // Skip empty separator rows
    let hasAnyLessonContent = false;
    for (const g of groupCols) {
      if (
        getCellText(r, g.subjectCol) ||
        (slotHeight > 2 && getCellText(r + 2, g.subjectCol)) ||
        (slotHeight > 1 && getCellText(r + 1, g.subjectCol))
      ) {
        hasAnyLessonContent = true;
        break;
      }
    }

    if (parsedNum === null && !foundTimeMatch && !hasAnyLessonContent) {
      r++;
      continue;
    }

    // Parse each group column within this 3-row slot
    for (const g of groupCols) {
      // Check if this cell is part of a horizontal merge spanning multiple groups
      const hMerge = merges.find(
        (m) =>
          m.s.r <= r + slotHeight - 1 &&
          m.e.r >= r &&
          g.subjectCol >= m.s.c &&
          g.subjectCol <= m.e.c
      );

      let coveredGroups: string[] = [g.groupName];
      let querySubjectCol = g.subjectCol;
      let queryAudCol = g.audCol;

      if (hMerge && hMerge.e.c > hMerge.s.c) {
        querySubjectCol = hMerge.s.c;
        coveredGroups = groupCols
          .filter((grp) => grp.subjectCol >= hMerge.s.c && grp.subjectCol <= hMerge.e.c)
          .map((grp) => grp.groupName);
      }

      // Read text from 3 lines of this lesson:
      // Line 0 (1st line): Subject name
      // Line 1 (2nd line): Empty / note
      // Line 2 (3rd line): Teacher name(s)
      const line0 = getCellText(r, querySubjectCol);
      const line1 = slotHeight > 1 ? getCellText(r + 1, querySubjectCol) : '';
      const line2 = slotHeight > 2 ? getCellText(r + 2, querySubjectCol) : '';

      // Read classroom from audCol across the slot
      let audText = '';
      for (let offset = 0; offset < slotHeight; offset++) {
        const a = getCellText(r + offset, queryAudCol);
        if (a) {
          audText = audText ? `${audText}; ${a}` : a;
        }
      }

      // Check if aud is in a vertical or horizontal merge
      if (!audText) {
        const audMerge = merges.find(
          (m) =>
            m.s.r <= r + slotHeight - 1 &&
            m.e.r >= r &&
            queryAudCol >= m.s.c &&
            queryAudCol <= m.e.c
        );
        if (audMerge) {
          audText = getCellText(audMerge.s.r, audMerge.s.c);
        }
      }

      // If all lines are empty, no class for this group
      if (!line0 && !line1 && !line2) {
        continue;
      }

      let subject = '';
      let teacher = '';
      let teacherSurname = '';
      let teacherSurnames: string[] = [];
      let subgroup: string | undefined = undefined;

      // 3-line format:
      if (line2) {
        // Line 2 has teacher (e.g. "Романенкова О.Л." or "Романенкова О.Л.; Карнюшина Е.Е.")
        teacher = line2.trim();
        teacherSurnames = extractTeacherSurnames(teacher);
        teacherSurname = teacherSurnames[0] || '';

        // Extract subject and subgroup from line 0 (or line 1)
        const rawSubject = (line0 || line1).trim();
        const subMatch = rawSubject.match(/(\d\s*п\/г|\d\+\d\s*п\/г|\d\s*подгруппа)/i);
        if (subMatch) {
          subgroup = subMatch[1].trim();
        }
        subject = rawSubject
          .replace(/(\d\s*п\/г|\d\+\d\s*п\/г|\d\s*подгруппа)/gi, '')
          .trim();
        if (!subject && rawSubject) {
          subject = rawSubject;
        }
      } else if (line0) {
        // Fallback for single-cell formatted entries (subject and teacher combined in one cell)
        const parsed = extractSubjectAndTeacher(line0);
        subject = parsed.subject;
        teacher = parsed.teacher;
        teacherSurname = parsed.teacherSurname;
        subgroup = parsed.subgroup;
        if (teacher) {
          teacherSurnames = extractTeacherSurnames(teacher);
        }
      } else if (line1) {
        const parsed = extractSubjectAndTeacher(line1);
        subject = parsed.subject;
        teacher = parsed.teacher;
        teacherSurname = parsed.teacherSurname;
        subgroup = parsed.subgroup;
        if (teacher) {
          teacherSurnames = extractTeacherSurnames(teacher);
        }
      }

      if (!subject && !teacher) {
        continue;
      }

      const isCombined = coveredGroups.length > 1;

      rawLessons.push({
        id: `lesson_${r}_${g.subjectCol}`,
        day: currentDay,
        date: currentDate,
        lessonNumber: currentLessonNum,
        time: currentTime,
        subject: subject || (teacher ? '' : 'Занятие'),
        teacher: teacher || '',
        teacherSurname: teacherSurname || '',
        teacherSurnames: teacherSurnames.length > 0 ? teacherSurnames : undefined,
        group: isCombined ? coveredGroups.join(', ') : g.groupName,
        groups: coveredGroups,
        classroom: audText,
        isCombined,
        subgroup,
      });
    }

    // Step to the next lesson slot
    r += slotHeight;
  }

  // Consolidate identical classes into combined streams
  const lessons = consolidateCombinedClasses(rawLessons);

  // Extract unique teachers and groups
  const teachersSet = new Set<string>();
  const surnamesSet = new Set<string>();
  const groupsSet = new Set<string>();
  const daysSet = new Set<string>();

  for (const l of lessons) {
    if (l.teacher) {
      const parts = l.teacher.split(';').map((p) => p.trim()).filter(Boolean);
      for (const p of parts) {
        teachersSet.add(p);
      }
    }
    if (l.teacherSurnames && l.teacherSurnames.length > 0) {
      for (const s of l.teacherSurnames) {
        surnamesSet.add(s);
      }
    } else if (l.teacherSurname) {
      surnamesSet.add(l.teacherSurname);
    }
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
  let lessons = data.lessons.filter((l) => {
    if (normalizeSurname(l.teacherSurname) === targetSurnameNorm) return true;
    if (l.teacherSurnames && l.teacherSurnames.some((s) => normalizeSurname(s) === targetSurnameNorm)) return true;
    if (l.teacher && normalizeSurname(l.teacher).includes(targetSurnameNorm)) return true;
    return false;
  });

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
      if (l.subject) {
        responseText += `Предмет: ${l.subject}${subgroupInfo}\n`;
      }
      responseText += `Группа: ${l.groups.join(', ')}${combinedBadge}\n`;
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
      if (l.subject) {
        const subgroupInfo = l.subgroup ? ` (${l.subgroup})` : '';
        responseText += `Предмет: ${l.subject}${subgroupInfo}\n`;
      }
      if (l.teacher) {
        responseText += `Преподаватель: ${l.teacher}\n`;
      }
      const groupSubgroup = !l.subject && l.subgroup ? ` (${l.subgroup})` : '';
      responseText += `Группа: ${matchedGroup}${groupSubgroup}\n`;
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
