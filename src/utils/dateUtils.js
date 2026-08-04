// Compares only the calendar date (ignores time-of-day) against the viewer's local "today".
export function isDueToday(dateValue) {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

// Moves records whose nextVisitDate is today to the top, keeping the existing
// relative order within each group (records are expected to already be sorted,
// e.g. by visitDate desc, from the API).
export function sortDueTodayFirst(records) {
  const due = [];
  const rest = [];
  for (const r of records) {
    (isDueToday(r.nextVisitDate) ? due : rest).push(r);
  }
  return [...due, ...rest];
}
