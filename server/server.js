const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const http = require('http');
const { initSocket } = require('./services/socketService');

require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const securityRoutes = require('./routes/securityRoutes');
const paymentSettingsRoutes = require('./routes/paymentSettingsRoutes');
const { errorHandler } = require('./middlewares/errorMiddleware');

const app = express();
const server = http.createServer(app);
                                                     
// Initialize Socket.io
initSocket(server);


// Security Middlewares
app.use(helmet());
app.use(cors({ 
    origin: '*', // Allow all origins in development for easier debugging
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Routes
// Health Check for Network Debugging
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        success: true, 
        message: 'Server is reachable!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/payment-settings', paymentSettingsRoutes);

// Unhandled Routes
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Can't find ${req.originalUrl} on this server`
    });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Successfully connected to MongoDB');
        // IMPORTANT: Bind to 0.0.0.0 to allow connections from your phone
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server is listening on ALL interfaces (0.0.0.0:${PORT})`);
            console.log(`📡 Local check: http://localhost:${PORT}/api/health`);
            console.log(`🔌 WebSockets: Ready for connections`);
        });

    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    });
