const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const passport = require('passport');
const { spawn } = require('child_process');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');

// 1. Load Environment Variables
dotenv.config();

// 2. Connect to Database
connectDB();

// 3. Initialize Express App
const app = express();

// 4. Configure CORS
// This allows your Vite/React frontend to communicate with this backend
app.use(cors({
    origin: 'http://localhost:5173', // Your Vite/React URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// 5. Increase JSON limit for Base64 Images
// Must be set BEFORE routes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 6. Passport Middleware
// Important: Passport must be initialized before routes
app.use(passport.initialize());

// 7. Passport Config Injection
// This loads your JwtStrategy from the config folder
require('./config/passport')(passport);

// 8. Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/trips', require('./routes/tripRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Root Endpoint
app.get('/', (req, res) => {
    res.send('Smart Travel Planner AI API is running...');
});

// 9. Error Handler (Must be the last middleware)
app.use(errorHandler);

// 10. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server started in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);

    // 11. Auto-launch Python AI Service
    const pythonServiceDir = path.join(__dirname, 'python_service');
    const venvPython = path.join(pythonServiceDir, 'venv', 'Scripts', 'python.exe');
    const appScript = path.join(pythonServiceDir, 'app.py');

    // Set MONGO_URI env var for Python service
    const pythonEnv = { ...process.env, MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/' };

    console.log('🧠 Starting Python AI Service...');
    const pythonProcess = spawn(venvPython, [appScript], {
        cwd: pythonServiceDir,
        env: pythonEnv,
        stdio: ['pipe', 'pipe', 'pipe']
    });

    pythonProcess.stdout.on('data', (data) => {
        console.log(`🐍 AI: ${data.toString().trim()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        const msg = data.toString().trim();
        // Filter out Flask dev server warning noise
        if (msg && !msg.includes('WARNING: This is a development server')) {
            console.log(`🐍 AI: ${msg}`);
        }
    });

    pythonProcess.on('error', (err) => {
        console.error('❌ Failed to start Python AI Service:', err.message);
        console.error('   Make sure venv is set up: cd python_service && python -m venv venv && .\\venv\\Scripts\\pip install -r requirements.txt');
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) console.error(`⚠️ Python AI Service exited with code ${code}`);
    });

    // Cleanup on Node exit
    const cleanup = () => {
        if (pythonProcess) {
            console.log('🛑 Killing Python AI Service...');
            pythonProcess.kill('SIGTERM');
        }
    };

    process.on('SIGINT', () => { cleanup(); process.exit(); });
    process.on('SIGTERM', () => { cleanup(); process.exit(); });
    process.on('SIGUSR2', () => { cleanup(); process.exit(); }); // Nodemon restart
    process.on('exit', cleanup);
});
