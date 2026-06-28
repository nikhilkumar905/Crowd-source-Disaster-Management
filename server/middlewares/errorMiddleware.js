export function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || res.statusCode || 500;
  const message = err.message || 'Server Error';

  res.status(statusCode).json({
    message,
    statusCode,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
}
