
// function errorMiddleware(err, req, res, next) {
//   // Log the full error stack to the console
//   console.error(err.stack);

//   // Set default status code and message
//   let statusCode = 500;
//   let message = 'Internal Server Error';

//   // Handle specific error types
//   if (err.name === 'ValidationError') {
//     // For example, Mongoose validation error
//     statusCode = 400;
//     message = err.message;
//   }

//   if (err.name === 'UnauthorizedError') {
//     // JWT auth error (from express-jwt or similar)
//     statusCode = 401;
//     message = 'Invalid or missing token';
//   }

//   if (err.code === 'LIMIT_FILE_SIZE') {
//     // File upload size limit error (from multer, for example)
//     statusCode = 413;
//     message = 'File too large';
//   }

//   // Send the error response as JSON
//   res.status(statusCode).json({ message });
// }

// module.exports = errorMiddleware;
