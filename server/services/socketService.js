const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    console.log('✅ Socket.io initialized');

    io.on('connection', (socket) => {
        console.log(`📡 New client connected: ${socket.id}`);

        // Join a room based on userId if provided in handshake
        const userId = socket.handshake.query.userId;
        if (userId) {
            socket.join(userId.toString());
            console.log(`👤 User ${userId} joined their security room`);
        }

        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });

    // Start simulation loop
    startSimulation();

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

// Simulation logic for Demo/Testing
const startSimulation = () => {
    console.log('🧪 Starting Fraud/Transaction simulation loop...');
    
    // Simulate a new transaction every 8-15 seconds
    const transactionLoop = () => {
        const delay = Math.floor(Math.random() * 7000) + 8000;
        setTimeout(() => {
            const isFraud = Math.random() < 0.15; // 15% chance of fraud
            const amount = Math.floor(Math.random() * 5000) + 100;
            const merchants = ['Amazon', 'Flipkart', 'Swiggy', 'Zomato', 'Netflix', 'Uber', 'Unknown Entity', 'Global Tech'];
            const merchant = merchants[Math.floor(Math.random() * merchants.length)];
            
            const transaction = {
                id: `TXN${Date.now()}`,
                amount: amount,
                merchant: merchant,
                timestamp: new Date().toISOString(),
                type: 'debit', // Most interesting for fraud
                status: isFraud ? 'flagged' : 'success',
                riskScore: isFraud ? (Math.random() * 30 + 70).toFixed(1) : (Math.random() * 10 + 2).toFixed(1),
                location: ['Mumbai', 'Delhi', 'Bangalore', 'London', 'Unknown', 'Dubai'][Math.floor(Math.random() * 6)]
            };

            console.log(`📡 Emitting new_transaction: ${transaction.id} (${transaction.status})`);
            io.emit('new_transaction', transaction);

            if (isFraud) {
                const alert = {
                    id: `ALT${Date.now()}`,
                    txnId: transaction.id,
                    type: 'FRAUD_SUSPECTED',
                    severity: 'high',
                    message: `Suspicious activity detected at ${merchant}`,
                    amount: amount,
                    timestamp: new Date().toISOString()
                };
                console.log(`🚨 Emitting fraud-alert: ${alert.id}`);
                io.emit('fraud-alert', alert);
                io.emit('new_alert', alert); // Compatibility with user spec
            }

            transactionLoop();
        }, delay);
    };

    transactionLoop();
};

module.exports = { initSocket, getIO };
