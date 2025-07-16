import {
  format,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  parseISO,
  isValid,
  differenceInDays,
  formatDistanceToNow,
} from 'date-fns';

export const formatTransactionDate = (date: Date): string => {
  return format(date, 'PPpp');
};

export const getDateRange = (months: number = 1) => {
  const now = new Date();
  return {
    start: startOfMonth(subDays(now, months * 30)),
    end: endOfMonth(addDays(now, 7)),
  };
};

export const parseDate = (dateString: string) => {
  const parsed = parseISO(dateString);
  return isValid(parsed) ? parsed : new Date();
};

export const getRelativeTime = (date: Date): string => {
  return formatDistanceToNow(date, { addSuffix: true });
};

export const daysBetween = (start: Date, end: Date): number => {
  return differenceInDays(end, start);
};

export const generateDateArray = (start: Date, end: Date): Date[] => {
  const dates: Date[] = [];
  let current = start;

  while (current <= end) {
    dates.push(current);
    current = addDays(current, 1);
  }

  return dates;
};

export const formatCurrency = (amount: number, locale: string = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (num: number, locale: string = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};
