import * as XLSX from 'xlsx';
import { ScheduleData, ScheduleLesson } from '../types';

export const SAMPLE_LESSONS: ScheduleLesson[] = [
  // ПОНЕДЕЛЬНИК (14.09.2026)
  {
    id: 'mon_1_1',
    day: 'Понедельник',
    date: '14.09.2026',
    lessonNumber: 1,
    time: '09.00-10.20',
    subject: 'Иностранный язык',
    teacher: 'Романенкова О.Л.',
    teacherSurname: 'Романенкова',
    group: '26-Д-1',
    groups: ['26-Д-1'],
    classroom: '112',
    isCombined: false,
    subgroup: '2 п/г',
  },
  {
    id: 'mon_2_1',
    day: 'Понедельник',
    date: '14.09.2026',
    lessonNumber: 2,
    time: '10.30-11.50',
    subject: 'Информатика',
    teacher: 'Евсеева А.Е.',
    teacherSurname: 'Евсеева',
    group: '26-А-1',
    groups: ['26-А-1'],
    classroom: '216',
    isCombined: false,
  },
  {
    id: 'mon_2_2',
    day: 'Понедельник',
    date: '14.09.2026',
    lessonNumber: 2,
    time: '10.30-11.50',
    subject: 'Русский язык',
    teacher: 'Мартыненко А.И.',
    teacherSurname: 'Мартыненко',
    group: '26-Д-1',
    groups: ['26-Д-1'],
    classroom: '111',
    isCombined: false,
  },
  {
    id: 'mon_2_3',
    day: 'Понедельник',
    date: '14.09.2026',
    lessonNumber: 2,
    time: '10.30-11.50',
    subject: 'Иностранный язык',
    teacher: 'Карнюшина Е.Е.',
    teacherSurname: 'Карнюшина',
    group: '26-ЗМ-1',
    groups: ['26-ЗМ-1'],
    classroom: '312',
    isCombined: false,
  },
  {
    id: 'mon_3_1',
    day: 'Понедельник',
    date: '14.09.2026',
    lessonNumber: 3,
    time: '12.10-13.30',
    subject: 'Разговоры о важном/ Россия- мои горизонты',
    teacher: 'Мягкова В.А.',
    teacherSurname: 'Мягкова',
    group: '26-А-1',
    groups: ['26-А-1'],
    classroom: '309',
    isCombined: false,
  },
  {
    id: 'mon_3_2',
    day: 'Понедельник',
    date: '14.09.2026',
    lessonNumber: 3,
    time: '12.10-13.30',
    subject: 'Информатика',
    teacher: 'Евсеева А.Е.',
    teacherSurname: 'Евсеева',
    group: '26-Д-1',
    groups: ['26-Д-1'],
    classroom: '216',
    isCombined: false,
  },
  {
    id: 'mon_3_3',
    day: 'Понедельник',
    date: '14.09.2026',
    lessonNumber: 3,
    time: '12.10-13.30',
    subject: 'Разговоры о важном/ Россия- мои горизонты',
    teacher: 'Жеребцова М.А.',
    teacherSurname: 'Жеребцова',
    group: '26-ЗМ-1',
    groups: ['26-ЗМ-1'],
    classroom: '110',
    isCombined: false,
  },
  {
    id: 'mon_4_1',
    day: 'Понедельник',
    date: '14.09.2026',
    lessonNumber: 4,
    time: '13.40-15.00',
    subject: 'Иностранный язык',
    teacher: 'Карнюшина Е.Е.',
    teacherSurname: 'Карнюшина',
    group: '26-А-1',
    groups: ['26-А-1'],
    classroom: '312',
    isCombined: false,
    subgroup: '2 п/г',
  },
  {
    id: 'mon_4_2',
    day: 'Понедельник',
    date: '14.09.2026',
    lessonNumber: 4,
    time: '13.40-15.00',
    subject: 'Русский язык',
    teacher: 'Сергеева М.В.',
    teacherSurname: 'Сергеева',
    group: '26-АН-1',
    groups: ['26-АН-1'],
    classroom: '306',
    isCombined: false,
  },
  {
    id: 'mon_4_3',
    day: 'Понедельник',
    date: '14.09.2026',
    lessonNumber: 4,
    time: '13.40-15.00',
    subject: 'Русский язык',
    teacher: 'Глущенко Н.Г.',
    teacherSurname: 'Глущенко',
    group: '26-ЗМ-1',
    groups: ['26-ЗМ-1'],
    classroom: '110',
    isCombined: false,
  },
  {
    id: 'mon_4_4',
    day: 'Понедельник',
    date: '14.09.2026',
    lessonNumber: 4,
    time: '13.40-15.00',
    subject: 'Русский язык',
    teacher: 'Мартыненко А.И.',
    teacherSurname: 'Мартыненко',
    group: '26-ИД-1',
    groups: ['26-ИД-1'],
    classroom: '111',
    isCombined: false,
  },
  {
    id: 'mon_5_1',
    day: 'Понедельник',
    date: '14.09.2026',
    lessonNumber: 5,
    time: '15.20-16.40',
    subject: 'Информатика',
    teacher: 'Парамонов Д.Д.',
    teacherSurname: 'Парамонов',
    group: '26-АН-1',
    groups: ['26-АН-1'],
    classroom: '216',
    isCombined: false,
  },
  {
    id: 'mon_5_2',
    day: 'Понедельник',
    date: '14.09.2026',
    lessonNumber: 5,
    time: '15.20-16.40',
    subject: 'Математика',
    teacher: 'Лысик П.В.',
    teacherSurname: 'Лысик',
    group: '26-ИД-1',
    groups: ['26-ИД-1'],
    classroom: '217',
    isCombined: false,
  },
  {
    id: 'mon_6_1',
    day: 'Понедельник',
    date: '14.09.2026',
    lessonNumber: 6,
    time: '16.50-18.10',
    subject: 'Иностранный язык',
    teacher: 'Романенкова О.Л.',
    teacherSurname: 'Романенкова',
    group: '26-АН-1',
    groups: ['26-АН-1'],
    classroom: '110',
    isCombined: false,
    subgroup: '1+2 п/г',
  },
  {
    id: 'mon_6_2',
    day: 'Понедельник',
    date: '14.09.2026',
    lessonNumber: 6,
    time: '16.50-18.10',
    subject: 'Введение в специальность',
    teacher: 'Мартыненко А.И.',
    teacherSurname: 'Мартыненко',
    group: '26-ИД-1',
    groups: ['26-ИД-1'],
    classroom: '111',
    isCombined: false,
  },

  // ВТОРНИК (15.09.2026)
  {
    id: 'tue_1_1',
    day: 'Вторник',
    date: '15.09.2026',
    lessonNumber: 1,
    time: '09.00-10.20',
    subject: 'История',
    teacher: 'Заболотный Е.П.',
    teacherSurname: 'Заболотный',
    group: '26-А-1',
    groups: ['26-А-1'],
    classroom: '110',
    isCombined: false,
  },
  {
    id: 'tue_1_2',
    day: 'Вторник',
    date: '15.09.2026',
    lessonNumber: 1,
    time: '09.00-10.20',
    subject: 'Физика',
    teacher: 'Васильева О.О.',
    teacherSurname: 'Васильева',
    group: '26-Д-1',
    groups: ['26-Д-1'],
    classroom: '208',
    isCombined: false,
  },
  {
    id: 'tue_2_1',
    day: 'Вторник',
    date: '15.09.2026',
    lessonNumber: 2,
    time: '10.30-11.50',
    subject: 'Биология',
    teacher: 'Картенко Д.А.',
    teacherSurname: 'Картенко',
    group: '26-А-1',
    groups: ['26-А-1'],
    classroom: '110',
    isCombined: false,
  },
  {
    id: 'tue_2_2',
    day: 'Вторник',
    date: '15.09.2026',
    lessonNumber: 2,
    time: '10.30-11.50',
    subject: 'Математика',
    teacher: 'Пикуля Е.И.',
    teacherSurname: 'Пикуля',
    group: '26-Д-1',
    groups: ['26-Д-1'],
    classroom: '111',
    isCombined: false,
  },
  {
    id: 'tue_3_1',
    day: 'Вторник',
    date: '15.09.2026',
    lessonNumber: 3,
    time: '12.10-13.30',
    subject: 'Физика',
    teacher: 'Васильева О.О.',
    teacherSurname: 'Васильева',
    group: '26-А-1',
    groups: ['26-А-1'],
    classroom: '208',
    isCombined: false,
  },
  {
    id: 'tue_3_2',
    day: 'Вторник',
    date: '15.09.2026',
    lessonNumber: 3,
    time: '12.10-13.30',
    subject: 'Информатика',
    teacher: 'Евсеева А.Е.',
    teacherSurname: 'Евсеева',
    group: '26-Д-1',
    groups: ['26-Д-1'],
    classroom: '215',
    isCombined: false,
  },
  {
    id: 'tue_3_3',
    day: 'Вторник',
    date: '15.09.2026',
    lessonNumber: 3,
    time: '12.10-13.30',
    subject: 'Разговоры о важном/ Россия- мои горизонты',
    teacher: 'Барбальс О.Н.',
    teacherSurname: 'Барбальс',
    group: '26-ИД-1',
    groups: ['26-ИД-1'],
    classroom: '117',
    isCombined: false,
  },
  {
    id: 'tue_4_1',
    day: 'Вторник',
    date: '15.09.2026',
    lessonNumber: 4,
    time: '13.40-15.00',
    subject: 'Биология',
    teacher: 'Картенко Д.А.',
    teacherSurname: 'Картенко',
    group: '26-АН-1',
    groups: ['26-АН-1'],
    classroom: '116',
    isCombined: false,
  },
  {
    id: 'tue_4_2',
    day: 'Вторник',
    date: '15.09.2026',
    lessonNumber: 4,
    time: '13.40-15.00',
    subject: 'Физика',
    teacher: 'Васильева О.О.',
    teacherSurname: 'Васильева',
    group: '26-ЗМ-1',
    groups: ['26-ЗМ-1'],
    classroom: '208',
    isCombined: false,
  },
  {
    id: 'tue_4_3',
    day: 'Вторник',
    date: '15.09.2026',
    lessonNumber: 4,
    time: '13.40-15.00',
    subject: 'История',
    teacher: 'Марченко Л.Е.',
    teacherSurname: 'Марченко',
    group: '26-ИД-1',
    groups: ['26-ИД-1'],
    classroom: '110',
    isCombined: false,
  },
  {
    id: 'tue_5_1',
    day: 'Вторник',
    date: '15.09.2026',
    lessonNumber: 5,
    time: '15.20-16.40',
    subject: 'Физика',
    teacher: 'Васильева О.О.',
    teacherSurname: 'Васильева',
    group: '26-АН-1',
    groups: ['26-АН-1'],
    classroom: '208',
    isCombined: false,
  },
  {
    id: 'tue_5_2',
    day: 'Вторник',
    date: '15.09.2026',
    lessonNumber: 5,
    time: '15.20-16.40',
    subject: 'История',
    teacher: 'Лысенко П.А.',
    teacherSurname: 'Лысенко',
    group: '26-ЗМ-1',
    groups: ['26-ЗМ-1'],
    classroom: '110',
    isCombined: false,
  },
  {
    id: 'tue_5_3',
    day: 'Вторник',
    date: '15.09.2026',
    lessonNumber: 5,
    time: '15.20-16.40',
    subject: 'Литература',
    teacher: 'Мартыненко А.И.',
    teacherSurname: 'Мартыненко',
    group: '26-ИД-1',
    groups: ['26-ИД-1'],
    classroom: '111',
    isCombined: false,
  },
  {
    id: 'tue_6_1',
    day: 'Вторник',
    date: '15.09.2026',
    lessonNumber: 6,
    time: '16.50-18.10',
    subject: 'Введение в специальность',
    teacher: 'Кравчук А.О.',
    teacherSurname: 'Кравчук',
    group: '26-АН-1',
    groups: ['26-АН-1'],
    classroom: '110',
    isCombined: false,
  },
  {
    id: 'tue_6_2',
    day: 'Вторник',
    date: '15.09.2026',
    lessonNumber: 6,
    time: '16.50-18.10',
    subject: 'Введение в специальность',
    teacher: 'Мисюнайте А.Т.',
    teacherSurname: 'Мисюнайте',
    group: '26-ЗМ-1',
    groups: ['26-ЗМ-1'],
    classroom: '111',
    isCombined: false,
  },
  {
    id: 'tue_6_3',
    day: 'Вторник',
    date: '15.09.2026',
    lessonNumber: 6,
    time: '16.50-18.10',
    subject: 'Информатика',
    teacher: 'Рыжова М.В.',
    teacherSurname: 'Рыжова',
    group: '26-ИД-1',
    groups: ['26-ИД-1'],
    classroom: '216',
    isCombined: false,
  },

  // СРЕДА (16.09.2026) - Совмещенные пары (Combined classes)
  {
    id: 'wed_1_combined',
    day: 'Среда',
    date: '16.09.2026',
    lessonNumber: 1,
    time: '09.00-10.20',
    subject: 'Физика (Потоковая лекция)',
    teacher: 'Васильева О.О.',
    teacherSurname: 'Васильева',
    group: '26-А-1, 26-АН-1, 26-Д-1',
    groups: ['26-А-1', '26-АН-1', '26-Д-1'],
    classroom: '208',
    isCombined: true,
    note: 'Совмещенная лекция на 3 группы',
  },
  {
    id: 'wed_2_combined',
    day: 'Среда',
    date: '16.09.2026',
    lessonNumber: 2,
    time: '10.30-11.50',
    subject: 'Введение в специальность',
    teacher: 'Мартыненко А.И.',
    teacherSurname: 'Мартыненко',
    group: '26-Д-1, 26-ЗМ-1, 26-ИД-1',
    groups: ['26-Д-1', '26-ЗМ-1', '26-ИД-1'],
    classroom: '111',
    isCombined: true,
    note: 'Совмещенный поток',
  },
  {
    id: 'wed_3_1',
    day: 'Среда',
    date: '16.09.2026',
    lessonNumber: 3,
    time: '12.10-13.30',
    subject: 'Информатика',
    teacher: 'Евсеева А.Е.',
    teacherSurname: 'Евсеева',
    group: '26-АН-1',
    groups: ['26-АН-1'],
    classroom: '216',
    isCombined: false,
  },
  {
    id: 'wed_4_1',
    day: 'Среда',
    date: '16.09.2026',
    lessonNumber: 4,
    time: '13.40-15.00',
    subject: 'Математика',
    teacher: 'Лысик П.В.',
    teacherSurname: 'Лысик',
    group: '26-А-1',
    groups: ['26-А-1'],
    classroom: '217',
    isCombined: false,
  },
  {
    id: 'wed_5_1',
    day: 'Среда',
    date: '16.09.2026',
    lessonNumber: 5,
    time: '15.20-16.40',
    subject: 'Иностранный язык',
    teacher: 'Романенкова О.Л.',
    teacherSurname: 'Романенкова',
    group: '26-ЗМ-1',
    groups: ['26-ЗМ-1'],
    classroom: '112',
    isCombined: false,
  },

  // ЧЕТВЕРГ (17.09.2026)
  {
    id: 'thu_2_1',
    day: 'Четверг',
    date: '17.09.2026',
    lessonNumber: 2,
    time: '10.30-11.50',
    subject: 'Физика',
    teacher: 'Васильева О.О.',
    teacherSurname: 'Васильева',
    group: '26-ИД-1',
    groups: ['26-ИД-1'],
    classroom: '208',
    isCombined: false,
  },
  {
    id: 'thu_3_combined',
    day: 'Четверг',
    date: '17.09.2026',
    lessonNumber: 3,
    time: '12.10-13.30',
    subject: 'Информатика',
    teacher: 'Евсеева А.Е.',
    teacherSurname: 'Евсеева',
    group: '26-А-1, 26-ЗМ-1',
    groups: ['26-А-1', '26-ЗМ-1'],
    classroom: '216',
    isCombined: true,
  },
  {
    id: 'thu_4_1',
    day: 'Четверг',
    date: '17.09.2026',
    lessonNumber: 4,
    time: '13.40-15.00',
    subject: 'Русский язык',
    teacher: 'Мартыненко А.И.',
    teacherSurname: 'Мартыненко',
    group: '26-АН-1',
    groups: ['26-АН-1'],
    classroom: '111',
    isCombined: false,
  },
  {
    id: 'thu_5_1',
    day: 'Четверг',
    date: '17.09.2026',
    lessonNumber: 5,
    time: '15.20-16.40',
    subject: 'История',
    teacher: 'Заболотный Е.П.',
    teacherSurname: 'Заболотный',
    group: '26-Д-1',
    groups: ['26-Д-1'],
    classroom: '110',
    isCombined: false,
  },

  // ПЯТНИЦА (18.09.2026)
  {
    id: 'fri_1_combined',
    day: 'Пятница',
    date: '18.09.2026',
    lessonNumber: 1,
    time: '09.00-10.20',
    subject: 'Введение в специальность',
    teacher: 'Мартыненко А.И.',
    teacherSurname: 'Мартыненко',
    group: '26-А-1, 26-АН-1',
    groups: ['26-А-1', '26-АН-1'],
    classroom: '111',
    isCombined: true,
  },
  {
    id: 'fri_2_1',
    day: 'Пятница',
    date: '18.09.2026',
    lessonNumber: 2,
    time: '10.30-11.50',
    subject: 'Физика',
    teacher: 'Васильева О.О.',
    teacherSurname: 'Васильева',
    group: '26-ЗМ-1',
    groups: ['26-ЗМ-1'],
    classroom: '208',
    isCombined: false,
  },
  {
    id: 'fri_3_1',
    day: 'Пятница',
    date: '18.09.2026',
    lessonNumber: 3,
    time: '12.10-13.30',
    subject: 'Информатика',
    teacher: 'Евсеева А.Е.',
    teacherSurname: 'Евсеева',
    group: '26-ИД-1',
    groups: ['26-ИД-1'],
    classroom: '216',
    isCombined: false,
  },
  {
    id: 'fri_4_1',
    day: 'Пятница',
    date: '18.09.2026',
    lessonNumber: 4,
    time: '13.40-15.00',
    subject: 'Биология',
    teacher: 'Картенко Д.А.',
    teacherSurname: 'Картенко',
    group: '26-Д-1',
    groups: ['26-Д-1'],
    classroom: '110',
    isCombined: false,
  },

  // СУББОТА (19.09.2026)
  {
    id: 'sat_1_combined',
    day: 'Суббота',
    date: '19.09.2026',
    lessonNumber: 1,
    time: '09.00-10.20',
    subject: 'Физика',
    teacher: 'Васильева О.О.',
    teacherSurname: 'Васильева',
    group: '26-А-1, 26-Д-1',
    groups: ['26-А-1', '26-Д-1'],
    classroom: '208',
    isCombined: true,
  },
  {
    id: 'sat_2_1',
    day: 'Суббота',
    date: '19.09.2026',
    lessonNumber: 2,
    time: '10.30-11.50',
    subject: 'Русский язык',
    teacher: 'Мартыненко А.И.',
    teacherSurname: 'Мартыненко',
    group: '26-ЗМ-1',
    groups: ['26-ЗМ-1'],
    classroom: '111',
    isCombined: false,
  },
  {
    id: 'sat_3_1',
    day: 'Суббота',
    date: '19.09.2026',
    lessonNumber: 3,
    time: '12.10-13.30',
    subject: 'Информатика',
    teacher: 'Евсеева А.Е.',
    teacherSurname: 'Евсеева',
    group: '26-А-1',
    groups: ['26-А-1'],
    classroom: '216',
    isCombined: false,
  },
];

export function getSampleScheduleData(): ScheduleData {
  const teachersSet = new Set<string>();
  const surnamesSet = new Set<string>();
  const groupsSet = new Set<string>();
  const daysSet = new Set<string>();

  for (const l of SAMPLE_LESSONS) {
    if (l.teacher) teachersSet.add(l.teacher);
    if (l.teacherSurname) surnamesSet.add(l.teacherSurname);
    for (const g of l.groups) groupsSet.add(g);
    if (l.day) daysSet.add(l.day);
  }

  const daysOrder = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

  return {
    title: 'РАСПИСАНИЕ ЗАНЯТИЙ',
    dateRange: '14.09.2026 - 19.09.2026',
    lessons: SAMPLE_LESSONS,
    teachers: Array.from(teachersSet).sort((a, b) => a.localeCompare(b, 'ru')),
    teacherSurnames: Array.from(surnamesSet).sort((a, b) => a.localeCompare(b, 'ru')),
    groups: Array.from(groupsSet).sort((a, b) => a.localeCompare(b, 'ru')),
    days: Array.from(daysSet).sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b)),
    filename: 'Расписание_Колледж_14.09.2026.xlsx',
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Generates an actual XLSX workbook replicating the user's Excel schedule screenshot!
 */
export function generateSampleExcelWorkbook(): Uint8Array {
  const wb = XLSX.utils.book_new();

  // Create sheet cells
  const data: (string | number)[][] = [];

  // Row 0: empty
  data.push([]);
  // Row 1: Title
  const titleRow = new Array(14).fill('');
  titleRow[4] = 'РАСПИСАНИЕ ЗАНЯТИЙ';
  data.push(titleRow);
  // Row 2: empty
  data.push([]);
  // Row 3: Date range
  const dateRow = new Array(14).fill('');
  dateRow[4] = '14.09.2026 - 19.09.2026';
  data.push(dateRow);
  // Row 4: empty
  data.push([]);

  // Row 5: Group headers
  const headerRow = [
    'День',
    '№',
    'Время',
    '26-А-1',
    '',
    '26-АН-1',
    '',
    '26-Д-1',
    '',
    '26-ЗМ-1',
    '',
    '26-ИД-1',
    '',
    '26-ИИ-1',
    '',
  ];
  data.push(headerRow);

  // Row 6: Subheaders
  const subheaderRow = [
    '',
    '',
    '',
    'Дисциплина, вид занятия, преподаватель',
    'Ауд.',
    'Дисциплина, вид занятия, преподаватель',
    'Ауд.',
    'Дисциплина, вид занятия, преподаватель',
    'Ауд.',
    'Дисциплина, вид занятия, преподаватель',
    'Ауд.',
    'Дисциплина, вид занятия, преподаватель',
    'Ауд.',
    'Дисциплина, вид занятия, преподаватель',
    'Ауд.',
  ];
  data.push(subheaderRow);

  const mergesList: XLSX.Range[] = [
    // Title
    { s: { r: 1, c: 3 }, e: { r: 1, c: 12 } },
    // Date
    { s: { r: 3, c: 3 }, e: { r: 3, c: 12 } },
    // Group headers (span subject and aud)
    { s: { r: 5, c: 3 }, e: { r: 5, c: 4 } }, // 26-А-1
    { s: { r: 5, c: 5 }, e: { r: 5, c: 6 } }, // 26-АН-1
    { s: { r: 5, c: 7 }, e: { r: 5, c: 8 } }, // 26-Д-1
    { s: { r: 5, c: 9 }, e: { r: 5, c: 10 } }, // 26-ЗМ-1
    { s: { r: 5, c: 11 }, e: { r: 5, c: 12 } }, // 26-ИД-1
    { s: { r: 5, c: 13 }, e: { r: 5, c: 14 } }, // 26-ИИ-1
  ];

  interface CellData {
    subject: string;
    teacher: string;
    aud: string;
  }

  // Helper to add a 3-row lesson slot exactly as structured in the user's schedule:
  // Row 0: Subject (+ subgroup)
  // Row 1: Empty line
  // Row 2: Teacher name(s)
  const addLesson3Rows = (
    day: string,
    date: string,
    num: number,
    time: string,
    gA1: CellData,
    gAN1: CellData,
    gD1: CellData,
    gZM1: CellData,
    gID1: CellData,
    gII1: CellData
  ) => {
    const rStart = data.length;

    // Row 0 (Top line): Day/Date, Lesson Number, Time, Subjects, Aud
    data.push([
      `${day}\n${date}`,
      num,
      time,
      gA1.subject,
      gA1.aud,
      gAN1.subject,
      gAN1.aud,
      gD1.subject,
      gD1.aud,
      gZM1.subject,
      gZM1.aud,
      gID1.subject,
      gID1.aud,
      gII1.subject,
      gII1.aud,
    ]);

    // Row 1 (Middle line): Empty spacer row
    data.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);

    // Row 2 (Bottom line): Teacher names
    data.push([
      '',
      '',
      '',
      gA1.teacher,
      '',
      gAN1.teacher,
      '',
      gD1.teacher,
      '',
      gZM1.teacher,
      '',
      gID1.teacher,
      '',
      gII1.teacher,
      '',
    ]);

    // Vertical merges for Day, Num, Time and Aud across the 3 rows
    mergesList.push({ s: { r: rStart, c: 0 }, e: { r: rStart + 2, c: 0 } });
    mergesList.push({ s: { r: rStart, c: 1 }, e: { r: rStart + 2, c: 1 } });
    mergesList.push({ s: { r: rStart, c: 2 }, e: { r: rStart + 2, c: 2 } });

    // Aud column merges across the 3 rows
    [4, 6, 8, 10, 12, 14].forEach((audCol) => {
      mergesList.push({ s: { r: rStart, c: audCol }, e: { r: rStart + 2, c: audCol } });
    });
  };

  const emptyCell: CellData = { subject: '', teacher: '', aud: '' };

  // Понедельник 14.09.2026 (exact data from screenshot)
  // 1 пара (09.00-10.20)
  addLesson3Rows('Понедельник', '14.09.2026', 1, '09.00-10.20',
    emptyCell,
    emptyCell,
    { subject: 'Иностранный язык 2 п/г', teacher: 'Романенкова О.Л.', aud: '112' },
    emptyCell,
    emptyCell,
    emptyCell
  );

  // 2 пара (10.30-11.50)
  addLesson3Rows('Понедельник', '14.09.2026', 2, '10.30-11.50',
    { subject: 'Информатика', teacher: 'Евсеева А.Е.', aud: '216' },
    emptyCell,
    { subject: 'Русский язык', teacher: 'Мартыненко А.И.', aud: '111' },
    { subject: 'Иностранный язык', teacher: 'Карнюшина Е.Е.', aud: '312' },
    emptyCell,
    emptyCell
  );

  // 3 пара (12.10-13.30)
  addLesson3Rows('Понедельник', '14.09.2026', 3, '12.10-13.30',
    { subject: 'Разговоры о важном/ Россия- мои горизонты', teacher: 'Мягкова В.А.', aud: '309' },
    emptyCell,
    { subject: 'Информатика', teacher: 'Евсеева А.Е.', aud: '216' },
    { subject: 'Разговоры о важном/ Россия- мои горизонты', teacher: 'Жеребцова М.А.', aud: '110' },
    emptyCell,
    emptyCell
  );

  // 4 пара (13.40-15.00)
  addLesson3Rows('Понедельник', '14.09.2026', 4, '13.40-15.00',
    { subject: 'Иностранный язык 2 п/г', teacher: 'Карнюшина Е.Е.', aud: '312' },
    { subject: 'Русский язык', teacher: 'Сергеева М.В.', aud: '306' },
    emptyCell,
    { subject: 'Русский язык', teacher: 'Глущенко Н.Г.', aud: '110' },
    { subject: 'Русский язык', teacher: 'Мартыненко А.И.', aud: '111' },
    emptyCell
  );

  // 5 пара (15.20-16.40)
  addLesson3Rows('Понедельник', '14.09.2026', 5, '15.20-16.40',
    emptyCell,
    { subject: 'Информатика', teacher: 'Парамонов Д.Д.', aud: '216' },
    emptyCell,
    emptyCell,
    { subject: 'Математика', teacher: 'Лишик П.В.', aud: '217' },
    { subject: 'Иностранный язык', teacher: 'Романенкова О.Л.; Карнюшина Е.Е.', aud: '112; 312' }
  );

  // 6 пара (16.50-18.10)
  addLesson3Rows('Понедельник', '14.09.2026', 6, '16.50-18.10',
    emptyCell,
    { subject: 'Иностранный язык 1+2 п/г', teacher: 'Романенкова О.Л.', aud: '110' },
    emptyCell,
    emptyCell,
    { subject: 'Введение в специальность', teacher: 'Мартыненко А.И.', aud: '111' },
    emptyCell
  );

  // 7 пара (18.20-19.40)
  addLesson3Rows('Понедельник', '14.09.2026', 7, '18.20-19.40',
    emptyCell, emptyCell, emptyCell, emptyCell, emptyCell, emptyCell
  );

  // Вторник 15.09.2026
  addLesson3Rows('Вторник', '15.09.2026', 1, '09.00-10.20',
    { subject: 'История', teacher: 'Заболотный Е.П.', aud: '110' },
    emptyCell,
    { subject: 'Физика', teacher: 'Васильева О.О.', aud: '208' },
    emptyCell,
    emptyCell,
    emptyCell
  );

  addLesson3Rows('Вторник', '15.09.2026', 2, '10.30-11.50',
    { subject: 'Биология', teacher: 'Картенко Д.А.', aud: '110' },
    emptyCell,
    { subject: 'Математика', teacher: 'Пикуля Е.И.', aud: '111' },
    emptyCell,
    emptyCell,
    emptyCell
  );

  addLesson3Rows('Вторник', '15.09.2026', 3, '12.10-13.30',
    { subject: 'Физика', teacher: 'Васильева О.О.', aud: '208' },
    emptyCell,
    { subject: 'Информатика', teacher: 'Евсеева А.Е.', aud: '215' },
    emptyCell,
    { subject: 'Разговоры о важном/ Россия- мои горизонты', teacher: 'Барбальс О.Н.', aud: '117' },
    emptyCell
  );

  addLesson3Rows('Вторник', '15.09.2026', 4, '13.40-15.00',
    emptyCell,
    { subject: 'Биология', teacher: 'Картенко Д.А.', aud: '116' },
    emptyCell,
    { subject: 'Физика', teacher: 'Васильева О.О.', aud: '208' },
    { subject: 'История', teacher: 'Марченко Л.Е.', aud: '110' },
    emptyCell
  );

  addLesson3Rows('Вторник', '15.09.2026', 5, '15.20-16.40',
    emptyCell,
    { subject: 'Физика', teacher: 'Васильева О.О.', aud: '208' },
    emptyCell,
    { subject: 'История', teacher: 'Лысенко П.А.', aud: '110' },
    { subject: 'Литература', teacher: 'Мартыненко А.И.', aud: '111' },
    emptyCell
  );

  addLesson3Rows('Вторник', '15.09.2026', 6, '16.50-18.10',
    emptyCell,
    { subject: 'Введение в специальность', teacher: 'Кравчук А.О.', aud: '110' },
    emptyCell,
    { subject: 'Введение в специальность', teacher: 'Мисюнайте А.Т.', aud: '111' },
    { subject: 'Информатика', teacher: 'Рыжова М.В.', aud: '216' },
    emptyCell
  );

  // Среда 16.09.2026 (Потоковые лекции)
  addLesson3Rows('Среда', '16.09.2026', 1, '09.00-10.20',
    { subject: 'Физика (Потоковая лекция)', teacher: 'Васильева О.О.', aud: '208' },
    { subject: 'Физика (Потоковая лекция)', teacher: 'Васильева О.О.', aud: '208' },
    { subject: 'Физика (Потоковая лекция)', teacher: 'Васильева О.О.', aud: '208' },
    emptyCell,
    emptyCell,
    emptyCell
  );

  addLesson3Rows('Среда', '16.09.2026', 2, '10.30-11.50',
    emptyCell,
    emptyCell,
    { subject: 'Введение в специальность', teacher: 'Мартыненко А.И.', aud: '111' },
    { subject: 'Введение в специальность', teacher: 'Мартыненко А.И.', aud: '111' },
    { subject: 'Введение в специальность', teacher: 'Мартыненко А.И.', aud: '111' },
    emptyCell
  );

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!merges'] = mergesList;

  XLSX.utils.book_append_sheet(wb, ws, 'Расписание');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
