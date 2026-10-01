/**
 * Philippine Standard Date Formatting Utility
 *
 * Preserves ISO 8601 YYYY-MM-DD in SQLite, models, and comparisons.
 * Formats display presentation to Philippine standards:
 * - 'compact': MM/DD/YYYY (e.g., 10/24/2026)
 * - 'medium': MMM DD, YYYY (e.g., Oct 24, 2026)
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
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
