import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';

import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import disasterRoutes from './routes/disasterRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

function parseAllowedOrigins(rawValue) {
  const defaultOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
  const configuredOrigins = String(rawValue || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set([...defaultOrigins, ...configuredOrigins])];
}

const allowedOrigins = parseAllowedOrigins(process.env.CLIENT_URL);

const io = initSocket(httpServer, { corsOrigin: allowedOrigins });
app.set('io', io);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true); // allow Postman / curl

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

/* Body parsers */
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'ldarcp-server',
    time: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/disasters', disasterRoutes);
app.use('/api/requests', requestRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

await connectDB(process.env.MONGO_URI);

httpServer.listen(PORT, () => {
  console.log(`[server] running on http://localhost:${PORT}`);
});
