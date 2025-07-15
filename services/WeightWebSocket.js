class WeightWebSocket {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.listeners = new Map();
    this.raspberryPiIP = '192.168.0.168'; // IP deines Raspberry Pi
    this.port = 8765;
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `ws://${this.raspberryPiIP}:${this.port}`;
        console.log(`Verbinde zu WebSocket: ${wsUrl}`);
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log('WebSocket verbunden');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Fehler beim Parsen der WebSocket-Nachricht:', error);
          }
        };
        
        this.ws.onclose = (event) => {
          console.log('WebSocket Verbindung geschlossen:', event.code, event.reason);
          this.isConnected = false;
          this.emit('disconnected');
          
          // Automatische Wiederverbindung
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
              this.reconnectAttempts++;
              console.log(`Wiederverbindungsversuch ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
              this.connect();
            }, this.reconnectInterval);
          }
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket Fehler:', error);
          this.emit('error', error);
          reject(error);
        };
        
      } catch (error) {
        console.error('Fehler beim Erstellen der WebSocket-Verbindung:', error);
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  handleMessage(data) {
  switch (data.type) {
    case 'connection':
      console.log('Verbindungsbestätigung:', data.message);
      this.emit('connectionConfirmed', data);
      break;
      
    case 'weight_data':
      this.emit('weightData', {
        waage1: data.waage1 || 0,
        waage2: data.waage2 || 0,
        drucksensoren: {
          sensor1: data.drucksensoren?.sensor1 || 0,
          sensor2: data.drucksensoren?.sensor2 || 0,
          sensor3: data.drucksensoren?.sensor3 || 0
        },
        timestamp: data.timestamp
      });
      break;
      
    case 'response':
      this.emit('commandResponse', data);
      break;
      
    case 'error':
      console.error('Server Fehler:', data.message);
      this.emit('serverError', data);
      break;
      
    default:
      console.log('Unbekannter Nachrichtentyp:', data);
  }
  }

  sendCommand(command, additionalData = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.ws) {
        reject(new Error('WebSocket nicht verbunden'));
        return;
      }

      const message = {
        command,
        timestamp: Date.now(),
        ...additionalData
      };

      try {
        this.ws.send(JSON.stringify(message));
        
        // Auf Antwort warten
        const responseHandler = (response) => {
          if (response.command === command) {
            this.off('commandResponse', responseHandler);
            if (response.status === 'success') {
              resolve(response);
            } else {
              reject(new Error(response.message || 'Befehl fehlgeschlagen'));
            }
          }
        };
        
        this.on('commandResponse', responseHandler);
        
        // Timeout nach 5 Sekunden
        setTimeout(() => {
          this.off('commandResponse', responseHandler);
          reject(new Error('Timeout: Keine Antwort vom Server'));
        }, 5000);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  // Event-System
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Fehler in Event-Callback für ${event}:`, error);
        }
      });
    }
  }

  // Convenience-Methoden
  async startMeasuring() {
    return await this.sendCommand('start_measuring');
  }

  async stopMeasuring() {
    return await this.sendCommand('stop_measuring');
  }

  async tareScale() {
    return await this.sendCommand('tare_scale');
  }

  async getCurrentWeight() {
    return await this.sendCommand('get_current_weight');
  }

  async getWeightHistory(limit = 50) {
    return await this.sendCommand('get_history', { limit });
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }
}

export default new WeightWebSocket();
