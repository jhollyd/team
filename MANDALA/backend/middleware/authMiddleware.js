// const jwt = require('jsonwebtoken');
// const SECRET_KEY = process.env.JWT_SECRET || 'Need to create secret key here';

// function authMiddleware(req, res, next) {
//   const authHeader = req.headers['authorization'];

//   if (!authHeader) {
//     return res.status(401).json({ message: 'Token wasn't provided' });
//   }

//   const token = authHeader.split(' ')[1];

//   if (!token) {
//     return res.status(401).json({ message: 'Invalid format of Token' });
//   }

//   try {
//     const decoded = jwt.verify(token, SECRET_KEY);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     return res.status(403).json({ message: 'Illegal Token' });
//   }
// }

// module.exports = authMiddleware;
