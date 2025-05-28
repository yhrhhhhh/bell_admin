import mqtt from 'mqtt'

class MQTTService {
  constructor() {
    this.client = null
    this.connected = false
    this.messageCallbacks = new Map()
  }

  connect(options = {}) {
    const defaultOptions = {
      host: process.env.VUE_APP_MQTT_BROKER || 'localhost',
      port: process.env.VUE_APP_MQTT_PORT || 1883,
      username: process.env.VUE_APP_MQTT_USERNAME,
      password: process.env.VUE_APP_MQTT_PASSWORD,
      clientId: 'bell_admin_' + Math.random().toString(16).substr(2, 8)
    }

    const mqttOptions = { ...defaultOptions, ...options }
    const url = `mqtt://${mqttOptions.host}:${mqttOptions.port}`

    return new Promise((resolve, reject) => {
      try {
        this.client = mqtt.connect(url, {
          username: mqttOptions.username,
          password: mqttOptions.password,
          clientId: mqttOptions.clientId
        })

        this.client.on('connect', () => {
          console.log('Connected to MQTT broker')
          this.connected = true
          resolve()
        })

        this.client.on('error', (error) => {
          console.error('MQTT connection error:', error)
          reject(error)
        })

        this.client.on('message', (topic, message) => {
          try {
            const payload = JSON.parse(message.toString())
            console.log('Received message:', topic, payload)
            
            // 调用对应主题的回调函数
            const callback = this.messageCallbacks.get(topic)
            if (callback) {
              callback(payload)
            }
          } catch (error) {
            console.error('Error parsing MQTT message:', error)
          }
        })
      } catch (error) {
        console.error('Failed to connect to MQTT broker:', error)
        reject(error)
      }
    })
  }

  subscribe(topic, callback) {
    if (!this.connected) {
      throw new Error('MQTT client not connected')
    }

    return new Promise((resolve, reject) => {
      this.client.subscribe(topic, (error) => {
        if (error) {
          console.error('Failed to subscribe to topic:', topic, error)
          reject(error)
        } else {
          console.log('Subscribed to topic:', topic)
          if (callback) {
            this.messageCallbacks.set(topic, callback)
          }
          resolve()
        }
      })
    })
  }

  publish(topic, message) {
    if (!this.connected) {
      throw new Error('MQTT client not connected')
    }

    return new Promise((resolve, reject) => {
      try {
        const payload = typeof message === 'string' ? message : JSON.stringify(message)
        this.client.publish(topic, payload, (error) => {
          if (error) {
            console.error('Failed to publish message:', error)
            reject(error)
          } else {
            console.log('Published message to topic:', topic)
            resolve()
          }
        })
      } catch (error) {
        console.error('Error publishing message:', error)
        reject(error)
      }
    })
  }

  disconnect() {
    if (this.client) {
      this.client.end()
      this.connected = false
      this.messageCallbacks.clear()
    }
  }
}

export const mqttService = new MQTTService() 