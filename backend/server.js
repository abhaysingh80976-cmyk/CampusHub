require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('./config/firebase'); // env check + Admin SDK init
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', 1); // Vercel proxy ke peeche sahi IP milne ke liye

app.use(helmet());
app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(','), credentials: true }));
app.use(express.json({ limit: '1.5mb' })); // base64 file uploads ke liye
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false }));

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

// Local me server chalta hai; Vercel par app export hota hai (wahan listen nahi karna)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`CampusHub API running on http://localhost:${PORT}`));
}

module.exports = app;