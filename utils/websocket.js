import { v4 as uuidv4 } from 'uuid';

class WebSocketManager {
  constructor() {
    this.socket = null;
    this.clientId = null;
    this.isConnected = false;
    this.eventListeners = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1s delay
  }

  connect() {
    if (this.socket) {
      return Promise.resolve(this.clientId);
    }

    this.clientId = uuidv4();
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WS_URL ||
      `${wsProtocol}//${window.location.host}/api/ws`;

    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(`${host}/client/${this.clientId}`);

        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          resolve(this.clientId);
        };

        this.socket.onclose = this.handleClose.bind(this);
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.socket.onmessage = this.handleMessage.bind(this);
      } catch (error) {
        console.error('WebSocket connection error:', error);
        reject(error);
      }
    });
  }

  handleClose(event) {
    console.log('WebSocket closed:', event);
    this.isConnected = false;

    // Try to reconnect
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 10000);
      console.log(`Attempting to reconnect in ${delay/1000}s...`);

      setTimeout(() => {
        this.connect().catch(err => {
          console.error('Reconnect failed:', err);
        });
      }, delay);
    }
  }

  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      const eventType = data.type || 'message';

      // Dispatch event to listeners
      if (this.eventListeners[eventType]) {
        this.eventListeners[eventType].forEach(callback => callback(data));
      }

      // Also dispatch to 'all' listeners
      if (this.eventListeners['all']) {
        this.eventListeners['all'].forEach(callback => callback(data));
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  on(eventType, callback) {
    if (!this.eventListeners[eventType]) {
      this.eventListeners[eventType] = [];
    }
    this.eventListeners[eventType].push(callback);

    return () => this.off(eventType, callback);
  }

  off(eventType, callback) {
    if (this.eventListeners[eventType]) {
      this.eventListeners[eventType] = this.eventListeners[eventType]
        .filter(cb => cb !== callback);
    }
  }

  send(data) {
    if (!this.isConnected) {
      return Promise.reject(new Error('WebSocket not connected'));
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket.send(JSON.stringify(data));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners = {};
    }
  }

  getClientId() {
    return this.clientId;
  }
}

// Create a singleton instance
const websocketManager = typeof window !== 'undefined' ? new WebSocketManager() : null;

export default websocketManager;
