/**
 * Date Utility Module (Asia/Bangkok Timezone)
 * Ensures consistent Bangkok calendar calculations across the frontend client.
 */

/**
 * Returns today's date formatted as YYYY-MM-DD in the Asia/Bangkok timezone.
 */
export const getBangkokTodayString = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
};

/**
 * Checks whether a given YYYY-MM-DD date string is strictly prior to today's date in Bangkok.
 */
export const isPastBangkokDate = (dateString: string): boolean => {
  const todayInBangkok = getBangkokTodayString();
  return dateString < todayInBangkok;
};

/**
 * Checks whether a specific slot on a given date has already started or elapsed in Asia/Bangkok (UTC+7).
 * Per BR-04: currentServerTime >= slotStartTime
 */
export const isPastBangkokSlot = (
  dateString: string,
  slotIndex: number,
  referenceDate: Date = new Date()
): boolean => {
  if (isPastBangkokDate(dateString)) return true;
  const todayInBangkok = getBangkokTodayString();
  if (dateString > todayInBangkok) return false;

  const slotHour = 10 + slotIndex;
  const slotIso = `${dateString}T${String(slotHour).padStart(2, '0')}:00:00+07:00`;
  const slotStartTime = new Date(slotIso).getTime();
  return referenceDate.getTime() >= slotStartTime;
};
