/**
 * Funkcje do obliczania polskich świąt narodowych i kościelnych
 */

/**
 * Oblicza datę Wielkanocy dla danego roku (algorytm Gaussa)
 */
function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Zwraca datę Wielkanocy dla danego roku
 */
function getEaster(year: number): Date {
  return calculateEaster(year);
}

/**
 * Zwraca datę Poniedziałku Wielkanocnego dla danego roku
 */
function getEasterMonday(year: number): Date {
  const easter = getEaster(year);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  return easterMonday;
}

/**
 * Zwraca datę Zielonych Świątek (50 dni po Wielkanocy)
 */
function getPentecost(year: number): Date {
  const easter = getEaster(year);
  const pentecost = new Date(easter);
  pentecost.setDate(easter.getDate() + 49); // 49 dni = 7 tygodni
  return pentecost;
}

/**
 * Zwraca datę Bożego Ciała (60 dni po Wielkanocy)
 */
function getCorpusChristi(year: number): Date {
  const easter = getEaster(year);
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60); // 60 dni po Wielkanocy
  return corpusChristi;
}

/**
 * Zwraca tablicę wszystkich polskich świąt dla danego roku
 * Format: Date[]
 */
export function getPolishHolidays(year: number): Date[] {
  const holidays: Date[] = [];

  // Święta stałe
  holidays.push(new Date(year, 0, 1, 0, 0, 0, 0)); // 1 stycznia - Nowy Rok
  holidays.push(new Date(year, 0, 6, 0, 0, 0, 0)); // 6 stycznia - Trzech Króli
  holidays.push(new Date(year, 4, 1, 0, 0, 0, 0)); // 1 maja - Święto Pracy
  holidays.push(new Date(year, 4, 3, 0, 0, 0, 0)); // 3 maja - Święto Narodowe Trzeciego Maja
  holidays.push(new Date(year, 7, 15, 0, 0, 0, 0)); // 15 sierpnia - Wniebowzięcie NMP
  holidays.push(new Date(year, 10, 1, 0, 0, 0, 0)); // 1 listopada - Wszystkich Świętych
  holidays.push(new Date(year, 10, 11, 0, 0, 0, 0)); // 11 listopada - Święto Niepodległości
  holidays.push(new Date(year, 11, 24, 0, 0, 0, 0)); // 24 grudnia - Boże Narodzenie (wigilia) 
  holidays.push(new Date(year, 11, 25, 0, 0, 0, 0)); // 25 grudnia - Boże Narodzenie (pierwszy dzień)
  holidays.push(new Date(year, 11, 26, 0, 0, 0, 0)); // 26 grudnia - Boże Narodzenie (drugi dzień)

  // Święta ruchome (zależne od Wielkanocy)
  holidays.push(getEasterMonday(year)); // Poniedziałek Wielkanocny
  holidays.push(getPentecost(year)); // Zielone Świątki (7 tygodni po Wielkanocy)
  holidays.push(getCorpusChristi(year)); // Boże Ciało (60 dni po Wielkanocy)

  return holidays;
}

/**
 * Sprawdza czy podana data to polskie święto
 */
export function isPolishHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const holidays = getPolishHolidays(year);
  
  // Normalizuj datę do północy dla porównania
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  
  return holidays.some(holiday => {
    const normalizedHoliday = new Date(holiday.getFullYear(), holiday.getMonth(), holiday.getDate(), 0, 0, 0, 0);
    return normalizedDate.getTime() === normalizedHoliday.getTime();
  });
}

/**
 * Zwraca nazwę święta dla danej daty lub null jeśli to nie jest święto
 */
export function getHolidayName(date: Date): string | null {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Święta stałe
  const fixedHolidays: { [key: string]: string } = {
    '1-1': 'Nowy Rok',
    '0-6': 'Trzech Króli',
    '4-1': 'Święto Pracy',
    '4-3': 'Święto Narodowe Trzeciego Maja',
    '7-15': 'Wniebowzięcie Najświętszej Maryi Panny',
    '10-1': 'Wszystkich Świętych',
    '10-11': 'Narodowe Święto Niepodległości',
    '11-25': 'Boże Narodzenie (pierwszy dzień)',
    '11-26': 'Boże Narodzenie (drugi dzień)',
  };

  const key = `${month}-${day}`;
  if (fixedHolidays[key]) {
    return fixedHolidays[key];
  }

  // Święta ruchome
  const easterMonday = getEasterMonday(year);
  if (date.getTime() === easterMonday.getTime()) {
    return 'Poniedziałek Wielkanocny';
  }

  const pentecost = getPentecost(year);
  if (date.getTime() === pentecost.getTime()) {
    return 'Zielone Świątki';
  }

  const corpusChristi = getCorpusChristi(year);
  if (date.getTime() === corpusChristi.getTime()) {
    return 'Boże Ciało';
  }

  return null;
}
