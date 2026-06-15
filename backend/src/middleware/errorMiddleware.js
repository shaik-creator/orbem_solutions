function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function getLogMessage(error) {
  const parts = [];
  const visit = (item, depth = 0) => {
    if (!item || depth > 2) return;
    const code = item.code ? `${item.code}: ` : '';
    const message = item.message || String(item);
    parts.push(`${code}${message}`);
    if (Array.isArray(item.errors)) item.errors.forEach((nested) => visit(nested, depth + 1));
    if (item.cause) visit(item.cause, depth + 1);
  };
  visit(error);
  return parts.filter(Boolean).join(' | ') || 'Unknown error';
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Something went wrong. Please try again.' : error.message;

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[${new Date().toISOString()}]`, getLogMessage(error));
  }

  res.status(statusCode).json({
    message,
    details: error.details || undefined
  });
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = {
  notFound,
  errorHandler,
  asyncHandler
};
