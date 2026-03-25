const UTC8_OFFSET_MS = 8 * 60 * 60 * 1000;

function normalizeDate(dateInput) {
  const source = dateInput ? new Date(dateInput) : new Date();
  return Number.isNaN(source.getTime()) ? new Date() : source;
}

export function toUtc8Date(dateInput) {
  const source = normalizeDate(dateInput);
  return new Date(source.getTime() + UTC8_OFFSET_MS);
}

export const formatDate = (dateString) => {
  const date = toUtc8Date(dateString);
  return `${date.getUTCFullYear()}年${String(date.getUTCMonth() + 1).padStart(2, '0')}月${String(date.getUTCDate()).padStart(2, '0')}日`;
};

export const formatDateTime = (dateString) => {
  const date = toUtc8Date(dateString);
  return `${date.getUTCFullYear()}年${String(date.getUTCMonth() + 1).padStart(2, '0')}月${String(date.getUTCDate()).padStart(2, '0')}日 ${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
};

export const formatMonthDay = (dateString) => {
  const date = toUtc8Date(dateString);
  return `${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};

export const formatInputDate = (dateString) => {
  if (!dateString) return '';
  const date = toUtc8Date(dateString);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};

export const formatDateKey = (dateString) => {
  if (!dateString) return '';
  const date = toUtc8Date(dateString);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};

export const toPickerDate = (dateString) => {
  if (!dateString) return new Date();
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

export const toUtc8IsoString = (dateInput) => {
  const source = normalizeDate(dateInput);
  return source.toISOString();
};

export const parseDateRangeToUtc = (dateText, endOfDay = false) => {
  if (!dateText) return null;
  const match = String(dateText).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, y, m, d] = match;
  const hour = endOfDay ? 23 : 0;
  const minute = endOfDay ? 59 : 0;
  const second = endOfDay ? 59 : 0;
  return new Date(`${y}-${m}-${d}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}+08:00`).toISOString();
};

export const getDaysDiffFromNow = (dateString) => {
  if (!dateString) return null;
  const diff = Date.now() - new Date(dateString).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};
