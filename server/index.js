//swarupplay/server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import got from 'got';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';


const app = express();
const PORT = process.env.PORT || 7001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });


const FFMPEG_BIN  = process.env.FFMPEG_PATH  || 'ffmpeg';
const FFPROBE_BIN = process.env.FFPROBE_PATH || 'ffprobe';

// resolve relative paths
const ffmpegPath  = path.resolve(__dirname, FFMPEG_BIN);
const ffprobePath = path.resolve(__dirname, FFPROBE_BIN);

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);


console.log('Using ffmpeg:', ffmpegPath);
console.log('Using ffprobe:', ffprobePath);



const PRIVATE_KEY = fs.readFileSync(
  path.resolve(__dirname, process.env.PRIVATE_KEY_PATH),
  'utf8'
);
const PUBLIC_KEY = fs.readFileSync(
  path.resolve(__dirname, process.env.PUBLIC_KEY_PATH),
  'utf8'
);


// Create storage directories if they don't exist
const STORAGE_DIR = path.join(__dirname, 'storage');
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}






// Configure CORS with specific origin
app.use(cors({
  origin: ['http://localhost:8001', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Type']
}));

app.use(express.json());

// Serve static files from the client build directory
app.use(express.static(path.join(__dirname, '../dist')));

// Create PostgreSQL pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Simpleindians@localhost:5432/securedrive'
});








const JWT_EXPIRES_IN = '7d';




// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] }, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Hash password
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Login endpoint with bcrypt and RS256 JWT
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Check if user exists
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      PRIVATE_KEY,
      { algorithm: 'RS256', expiresIn: JWT_EXPIRES_IN }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
    },
  });
});

// Register endpoint with bcrypt and RS256 JWT
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );
    
    const user = result.rows[0];
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      PRIVATE_KEY,
      { algorithm: 'RS256', expiresIn: JWT_EXPIRES_IN }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
    },
  });
});












// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});




// Proxy /api/files?type=video → SwarupDrive
app.get('/api/files', authenticateToken, async (req, res) => {
  try {
    // forward query as-is (e.g. ?type=video)
    const query = req.url.split('?')[1] || '';
    const driveUrl = `http://localhost:3001/api/files${query ? '?' + query : ''}`;

    // forward the user's JWT so Drive can return that user's files:
    const driveRes = await fetch(driveUrl, {
      headers: { Authorization: req.headers['authorization'] }
    });

    // if drive returned error status, mirror it
    if (!driveRes.ok) {
      return res.status(driveRes.status).send(await driveRes.text());
    }

    const data = await driveRes.json();
   // build a stream URL for each MP4
   if (Array.isArray(data.files)) {
     data.files = data.files
       .filter(f => f.type === 'video/mp4')
       .map(f => ({
         ...f,
         streamUrl: `http://localhost:${PORT}/api/stream/${f.id}`
       }));
   }
    res.json(data);
  } catch (err) {
    console.error('Error proxying /api/files:', err);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});




// API to get video metadata
app.get('/api/video/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const metadataQuery = `
      SELECT
        v.*,
        f.storage_path,
        f.size,
        f.name AS file_name,
        f.type AS mime_type,
        f.created_at,
        v.thumbnail
      FROM video_metadata v
      RIGHT JOIN files f
        ON v.file_id = f.id
      WHERE f.id = $1 AND f.type LIKE 'video/%'
    `;
    
    const result = await pool.query(metadataQuery, [fileId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video file not found' });
    }
    
    // Build a stream URL for the front-end
    const meta = result.rows[0];
    meta.streamUrl = `http://localhost:${PORT}/api/stream/${fileId}`;
    
    // Add thumbnail URL if available
    if (meta.thumbnail_path) {
      meta.thumbnail = `http://localhost:3001/api/files/${fileId}/thumbnail`;
    }
    
    res.json(meta);
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// API to stream video file
app.get('/api/stream/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const driveUrl = `http://localhost:3001/api/files/${fileId}/download`;
    const driveHeaders = {
      Authorization: `Bearer ${process.env.DRIVE_JWT_RS256}`,
    };
    
    if (req.headers.range) {
      driveHeaders.Range = req.headers.range;
    }

    console.log('Proxying stream request to Drive:', {
      driveUrl,
      driveHeaders,
      clientRange: req.headers.range
    });

    const upstream = got.stream(driveUrl, { headers: driveHeaders });
    upstream.on('response', upstreamRes => {
      res.writeHead(upstreamRes.statusCode, upstreamRes.headers);
    });
    upstream.on('error', err => {
      console.error('❗️ Upstream proxy error:', {
        message: err.message,
        stack: err.stack,
        upstreamStatus: err.response?.statusCode,
        upstreamBody: err.response?.body?.toString().slice(0, 200)
      });
      res.status(502).json({
        error: 'Upstream streaming error',
        details: err.message
      });
    });
    return upstream.pipe(res);
  } catch (error) {
    console.error('Error streaming file:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



// Handle URL parameters
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});


//for youtube
app.get('/api/youtube', async (req, res) => {
  const { query } = req.query;
  const key = process.env.YOUTUBE_API_KEY;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=10&type=video&key=${key}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch YouTube videos' });
  }
});



// Start server
app.listen(PORT, () => {
  console.log(`SwarupPlay server running on port ${PORT}`);
});