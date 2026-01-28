export const getDaysInMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

export const getFirstDayOfMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

export const formatDateISO = (date: Date): string => {
  const offset = date.getTimezoneOffset();
  const d = new Date(date.getTime() - offset * 60 * 1000);
  return d.toISOString().split('T')[0];
};

export const getMonthName = (date: Date): string => {
  return date.toLocaleString('default', { month: 'long' });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  if (!isFinite(value) || isNaN(value)) return '0.00%';
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
};

export const generateCalendarDays = (currentDate: Date): { day: number | null; dateStr: string | null }[] => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfWeek = getFirstDayOfMonth(currentDate);

  const days: { day: number | null; dateStr: string | null }[] = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push({ day: null, dateStr: null });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    days.push({ day: i, dateStr: formatDateISO(d) });
  }

  const totalSlots = days.length;
  const remainingSlots = 42 - totalSlots; 
  if (remainingSlots < 7) { 
      for (let i = 0; i < remainingSlots; i++) {
          days.push({ day: null, dateStr: null });
      }
  }

  return days;
};