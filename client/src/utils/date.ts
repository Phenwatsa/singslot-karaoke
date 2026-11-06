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
