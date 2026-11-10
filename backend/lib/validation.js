import { fail } from './errors.js';
export const uuid = value => {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) fail(400, 'Expected a UUID.');
  return value.toLowerCase();
};
export const id = value => {
  if (!/^[1-9]\d{0,18}$/.test(String(value)) || BigInt(value) > 9223372036854775807n) fail(400, 'Expected a positive database ID.');
  return String(value);
};
export const text = (max = 500) => value => {
  if (typeof value !== 'string' || !value.trim() || value.length > max) fail(400, `Expected nonempty text of at most ${max} characters.`);
  return value.trim();
};
export const boolean = value => { if (typeof value !== 'boolean') fail(400, 'Expected a boolean.'); return value; };
export const integer = value => { if (!Number.isInteger(value) || value < 0 || value > 2147483647) fail(400, 'Expected a nonnegative integer.'); return value; };
export const choice = options => value => { if (!options.includes(value)) fail(400, `Expected one of: ${options.join(', ')}.`); return value; };
export const nullable = validator => value => value === null ? null : validator(value);
export const date = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10) !== value) fail(400, 'Expected a valid YYYY-MM-DD date.');
  return value;
};
export const timestamp = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d(\.\d{1,6})?)?(Z|[+-]\d\d:\d\d)$/.test(value) || !Number.isFinite(Date.parse(value))) fail(400, 'Expected an ISO timestamp with Z or a UTC offset.');
  date(value.slice(0,10)); return value;
};
export const timezone = value => {
  text(100)(value);
  try { new Intl.DateTimeFormat('en', { timeZone: value }); } catch { fail(400, 'Invalid timezone.'); }
  return value;
};
export const times = value => {
  if (!Array.isArray(value) || !value.length || value.length > 24 || value.some(t => typeof t !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) || new Set(value).size !== value.length) fail(400, 'times must contain 1–24 distinct HH:MM values.');
  return value;
};
export function body(input, rules, required = []) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail(400, 'Expected a JSON object.');
  for (const key of Object.keys(input)) if (!Object.hasOwn(rules, key)) fail(400, `Unsupported field: ${key}`);
  for (const key of required) if (!Object.hasOwn(input, key)) fail(400, `Missing field: ${key}`);
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, rules[key](value)]));
}
export function page(query) {
  const limit = query.limit === undefined ? 50 : Number(query.limit);
  const offset = query.offset === undefined ? 0 : Number(query.offset);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(offset) || offset < 0) fail(400, 'limit must be 1–100; offset must be nonnegative.');
  return [limit, offset];
}
export const percentage = value => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) fail(400, 'Percentage must be a number between 0 and 100.');
  return value;
};
