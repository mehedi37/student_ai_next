import { v4 as uuidv4 } from 'uuid';

class WebSocketManager {
  constructor() {
    this.socket = null;
    this.clientId = uuidv4(); // Generate a UUID on initialization
    this.isConnected = false;
    this.eventListeners = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.intentionalDisconnect = false;
    this.autoReconnect = true;
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve(this.clientId);
        return;
      }

      // Ensure we have a client ID before connecting
      if (!this.clientId) {
        this.clientId = uuidv4();
      }

      const host = process.env.NEXT_PUBLIC_WS_URL || `wss://${window.location.hostname}`;

      try {
        console.log(`Connecting to WebSocket with client ID: ${this.clientId}`);
        this.socket = new WebSocket(`${host}/client/${this.clientId}`);

        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          resolve(this.clientId);
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.socket.onclose = this.handleClose.bind(this);
      } catch (error) {
        console.error('WebSocket connection error:', error);
        reject(error);
      }
    });
  }

  handleClose(event) {
    console.log('WebSocket closed:', event);
    this.isConnected = false;

    // Attempt to reconnect after brief delay if not intentionally disconnected
    if (!this.intentionalDisconnect && this.autoReconnect) {
      setTimeout(() => {
        this.connect().catch(err => {
          console.error('Failed to reconnect WebSocket:', err);
        });
      }, 3000);
    }
  }

  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);

      // Handle embedding progress updates specially
      if (data.type === 'upload_progress') {
        // Extract additional embedding information if available
        if (data.stage === 'embedding' && data.metadata) {
          data.embeddingDetails = {
            chunksEmbedded: data.metadata.chunks_embedded || 0,
            totalChunks: data.metadata.total_chunks || data.total || 0,
            currentFile: data.metadata.current_file,
            remainingFiles: data.metadata.remaining_files
          };
        }
      }

      // Emit the event to all registered listeners
      const listeners = this.eventListeners[data.type] || [];
      listeners.forEach(callback => callback(data));

      // Also emit to wildcard listeners
      const wildcardListeners = this.eventListeners['*'] || [];
      wildcardListeners.forEach(callback => callback(data));
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
        // Add timestamp to all messages
        const messageWithTimestamp = {
          ...data,
          timestamp: new Date().toISOString()
        };

        this.socket.send(JSON.stringify(messageWithTimestamp));
        resolve();
      } catch (error) {
        console.error('Error sending message:', error);
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
