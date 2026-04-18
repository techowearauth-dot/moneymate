import io from 'socket.io-client/dist/socket.io.js';
import { Platform } from 'react-native';

// Polyfill for socket.io-client if needed
if (!global.navigator.userAgent) {
    global.navigator.userAgent = 'react-native';
}

// Use standard IP for Android/iOS or localhost
const SOCKET_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
        console.log('[SocketService] Initialized');
    }

    /**
     * Connect to the server.
     */
    connect() {
        if (this.socket) {
            console.log('[SocketService] Already connected or connecting');
            return;
        }

        console.log('[SocketService] Connecting to:', SOCKET_URL);
        this.socket = io(SOCKET_URL, {
            transports: ['websocket'], // Faster and more reliable for RN
            autoConnect: true,
        });

        this.socket.on('connect', () => {
            console.log('[SocketService] ✅ Connected to server');
        });

        this.socket.on('disconnect', () => {
            console.log('[SocketService] ❌ Disconnected from server');
        });

        this.socket.on('connect_error', (error) => {
            console.error('[SocketService] Connection Error:', error);
        });

        // Re-attach all existing listeners if reconnected
        this.listeners.forEach((callbacks, event) => {
            callbacks.forEach(callback => {
                this.socket.on(event, callback);
            });
        });
    }

    /**
     * Listen for an event.
     * @param {string} event 
     * @param {Function} callback 
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);

        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    /**
     * Stop listening for an event.
     * @param {string} event 
     * @param {Function} callback 
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const filtered = this.listeners.get(event).filter(cb => cb !== callback);
            this.listeners.set(event, filtered);
        }

        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    /**
     * Disconnect from server.
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            console.log('[SocketService] Manually disconnected');
        }
    }
}

// Singleton instance
const socketService = new SocketService();
export default socketService;
