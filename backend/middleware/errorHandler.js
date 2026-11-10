export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const fail = (status, message) => { throw new ApiError(status, message); };
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const databaseErrors = {
    '23001': [409, 'This record is still referenced and cannot be changed.'],
    '23505': [409, 'A record already exists or an active assignment conflicts.'],
    '23503': [409, 'A referenced record is missing or still in use.'],
    '23514': [400, 'The supplied values violate a database rule.'],
    '23502': [400, 'A required value is missing.'],
    '22P02': [400, 'Invalid value format.'],
    '22007': [400, 'Invalid date or time.'],
    '22008': [400, 'Date or time is out of range.'],
    '40001': [409, 'Concurrent change detected. Retry the request.'],
    '40P01': [409, 'Concurrent change detected. Retry the request.']
  };
  const mapped = databaseErrors[error.code];
  const status = mapped?.[0] || error.status || 500;
  if (status >= 500) console.error('Request failed:', error.code || error.name);
  res.status(status).json({ error: mapped?.[1] || (status < 500 ? error.message : 'Service unavailable. Try again later.') });
}
