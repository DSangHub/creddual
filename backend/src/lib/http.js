// backend/src/lib/http.js

// Wraps an async route handler so rejected promises reach the error middleware.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Error with an HTTP status that the error middleware reports to the client.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.expose = true;
  }
}

// Copies only the allowed keys that are present in the source object.
const pick = (source, keys) =>
  Object.fromEntries(keys.filter((key) => source?.[key] !== undefined).map((key) => [key, source[key]]));

// Parses a finite number, or returns undefined.
const toNumber = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

module.exports = { asyncHandler, HttpError, pick, toNumber };
