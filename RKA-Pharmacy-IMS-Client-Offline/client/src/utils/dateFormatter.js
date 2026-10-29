/**
 * Philippine Standard Date Formatting Utility
 *
 * Preserves ISO 8601 YYYY-MM-DD in SQLite, models, and comparisons.
 * Formats display presentation to Philippine standards:
 * - 'compact': MM/DD/YYYY (e.g., 10/24/2026)
 * - 'medium': MMM DD, YYYY (e.g., Oct 24, 2026)
 * - 'time': h:mm A (e.g., 2:30 PM)
 * - 'full': MMM DD, YYYY, h:mm A (e.g., Oct 24, 2026, 2:30 PM)
 */

export function formatDatePH(dateInput, format = 'compact') {
  if (!dateInput) return '';

  let year, month, day, hours = 0, minutes = 0;
  let hasTime = false;

  if (typeof dateInput === 'string') {
    const cleanStr = dateInput.trim();
    // Handle YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
    const matchDateOnly = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (matchDateOnly) {
      year = parseInt(matchDateOnly[1], 10);
      month = parseInt(matchDateOnly[2], 10);
      day = parseInt(matchDateOnly[3], 10);
    } else {
      const d = new Date(cleanStr);
      if (isNaN(d.getTime())) return dateInput;
      year = d.getFullYear();
      month = d.getMonth() + 1;
      day = d.getDate();
      hours = d.getHours();
      minutes = d.getMinutes();
      hasTime = cleanStr.includes('T') || cleanStr.includes(':');
    }
  } else if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return '';
    year = dateInput.getFullYear();
    month = dateInput.getMonth() + 1;
    day = dateInput.getDate();
    hours = dateInput.getHours();
    minutes = dateInput.getMinutes();
    hasTime = true;
  } else {
    return String(dateInput);
  }

  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const yyyy = String(year);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mmm = monthNames[month - 1] || mm;

  if (format === 'time') {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    const minStr = String(minutes).padStart(2, '0');
    return `${h12}:${minStr} ${ampm}`;
  }

  if (format === 'medium') {
    return `${mmm} ${dd}, ${yyyy}`;
  }

  if (format === 'full' && hasTime) {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    const minStr = String(minutes).padStart(2, '0');
    return `${mmm} ${dd}, ${yyyy} ${h12}:${minStr} ${ampm}`;
  }

  // Default compact: MM/DD/YYYY
  return `${mm}/${dd}/${yyyy}`;
}

/**
 * Returns YYYY-MM-DD string in local workstation timezone (not UTC).
 * Prevents early-morning day offset errors (e.g. in UTC+8 timezone).
 */
export function getLocalDateISO(d = new Date()) {
  if (typeof d === 'string') {
    const s = d.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const dateObj = new Date(s);
    if (isNaN(dateObj.getTime())) return '';
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  const dateObj = d instanceof Date ? d : new Date(d);
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Calculates calendar days difference to expiration date anchored to midnight local time.
 * Handles Date objects, YYYY-MM-DD strings, ISO strings, leap years, and invalid boundaries.
 */
export function calculateDaysToExpiry(expiryDateInput, currentDate = new Date()) {
  if (!expiryDateInput) return null;
  let cleanStr = '';
  if (expiryDateInput instanceof Date) {
    if (isNaN(expiryDateInput.getTime())) return null;
    const y = expiryDateInput.getFullYear();
    const m = String(expiryDateInput.getMonth() + 1).padStart(2, '0');
    const d = String(expiryDateInput.getDate()).padStart(2, '0');
    cleanStr = `${y}-${m}-${d}`;
  } else {
    cleanStr = String(expiryDateInput).trim().slice(0, 10);
  }
  const match = cleanStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) return null;

  const expDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (expDate.getFullYear() !== year || expDate.getMonth() !== (month - 1) || expDate.getDate() !== day) {
    return null; // Invalid calendar date
  }

  const curDateObj = currentDate instanceof Date ? currentDate : new Date(currentDate);
  if (isNaN(curDateObj.getTime())) return null;
  const curDate = new Date(curDateObj.getFullYear(), curDateObj.getMonth(), curDateObj.getDate(), 0, 0, 0, 0);
  return Math.round((expDate - curDate) / (1000 * 60 * 60 * 24));
}

/**
 * Returns clinical expiry tier for given days.
 */
export function getExpiryTier(days, thresholds = { warning: 31, monitor: 91, safe: 180 }) {
  if (days === null || days === undefined) return 'None';
  if (days <= 0) return 'Expired';
  const warn = thresholds.warning ?? 31;
  const mon = thresholds.monitor ?? 91;
  const safe = thresholds.safe ?? 180;
  if (days < warn) return 'Critical';
  if (days < mon) return 'Warning';
  if (days <= safe) return 'Monitor';
  return 'Safe';
}
