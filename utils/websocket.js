import { v4 as uuidv4 } from 'uuid';

class WebSocketManager {
  constructor() {
    this.socket = null;
    this.clientId = null;
    this.eventHandlers = {};
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000; // Start with 2 seconds
    this.pingInterval = null;
  }

  // Connect to WebSocket server
  async connect(clientId = '') {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      this.isConnected = true;
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        // Format client ID correctly - ensure it has client_ prefix
        this.clientId = clientId || this.clientId || `client_${uuidv4().replace(/-/g, '')}`;

        // If clientId doesn't start with client_, add it
        if (!this.clientId.startsWith('client_')) {
          this.clientId = `client_${this.clientId}`;
        }

        // Use the proper WebSocket URL
        const host = process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
                    process.env.NEXT_PUBLIC_API_URL?.replace(/^http/, 'ws') ||
                    window.location.origin.replace(/^http/, 'ws');

        console.log(`Connecting to WebSocket with client ID: ${this.clientId}`);
        const wsUrl = `${host}/ws/client/${this.clientId}`;
        console.log(`WebSocket URL: ${wsUrl}`);

        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('WebSocket connected successfully');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.pingInterval = setInterval(() => this.ping(), 30000);
          this.emit('connected', { connected: true });
          resolve();
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnected = false;
          this.emit('disconnected', { connected: false, error });
          reject(error);
        };

        this.socket.onclose = this.handleClose.bind(this);
      } catch (error) {
        console.error('WebSocket connection error:', error);
        this.isConnected = false;
        this.emit('disconnected', { connected: false, error });
        reject(error);
      }
    });
  }

  handleClose(event) {
    console.log('WebSocket closed:', event);
    this.isConnected = false;
    clearInterval(this.pingInterval);
    this.emit('disconnected', { connected: false });

    // Attempt to reconnect
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts);
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

      setTimeout(async () => {
        try {
          await this.connect();
        } catch (err) {
          console.error('Failed to reconnect WebSocket:', err);
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached. WebSocket disconnected.');
    }
  }

  // Handle incoming WebSocket messages
  handleMessage(data) {
    try {
      const parsedData = JSON.parse(data);
      console.log('Received WebSocket message:', parsedData);

      // Handle different message types based on OpenAPI spec
      if (parsedData.type === 'upload_progress') {
        this.emit('upload_progress', parsedData);

        // Also emit a task-specific event if task_id is present
        if (parsedData.task_id) {
          this.emit(`task:${parsedData.task_id}`, parsedData);
        }
        return;
      }

      // Handle pong response to maintain connection
      if (parsedData.type === 'pong') {
        // Reset reconnect attempts as connection is healthy
        this.reconnectAttempts = 0;
        return;
      }

      // Handle different message types
      if (parsedData.type && this.eventHandlers[parsedData.type]) {
        this.emit(parsedData.type, parsedData);
      } else {
        // Generic message handler
        this.emit('message', parsedData);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error, data);
    }
  }

  // Register event handler
  on(event, callback) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  // Remove event handler
  off(event, callback) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(handler => handler !== callback);
    }
  }

  // Emit event to handlers
  emit(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler(data));
    }
  }

  // Send data through WebSocket
  async send(data) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      try {
        await this.connect();
      } catch (err) {
        return Promise.reject(new Error('WebSocket not connected'));
      }
    }

    return new Promise((resolve, reject) => {
      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        this.socket.send(message);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  // Send a ping to keep the connection alive
  ping() {
    if (this.isConnected) {
      this.send({ type: 'ping' }).catch(() => {
        // If ping fails, connection might be lost - try to reconnect
        this.isConnected = false;
        this.connect().catch(() => {}); // Silently catch as handleClose will handle reconnect
      });
    }
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.socket) {
      clearInterval(this.pingInterval);
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Force reconnection
  reconnect() {
    this.disconnect();
    return this.connect();
  }

  // Subscribe to updates for a specific task
  subscribeToTask(taskId, callback) {
    if (!taskId) return () => {};

    const eventName = `task:${taskId}`;
    return this.on(eventName, callback);
  }
}

// Singleton instance - only create in browser environment
const websocketManager = typeof window !== 'undefined' ? new WebSocketManager() : null;

export default websocketManager;
