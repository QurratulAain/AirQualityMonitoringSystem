#  Air Quality Monitoring System (ESP32 + Firebase)

##  Live Demo
 https://air-quality-monitoring-system-hazel.vercel.app/


##  Overview
This project implements a **real-time air quality monitoring system** using the ESP32 microcontroller. It collects environmental data (air quality, temperature, and humidity) and uploads it to a cloud database for remote monitoring and visualization.

The system also supports **OTA (Over-the-Air) updates** and **email alerts** when environmental conditions exceed defined thresholds.

##  Features
-  Temperature & humidity monitoring (DHT22)
-  Air quality detection (MQ135 – CO₂ estimation)
- Real-time data storage using Firebase
-  Live dashboard with graphs (Vercel deployment)
-  Email alerts for critical conditions
-  OTA firmware updates
-  Wi-Fi enabled remote monitoring

##  System Architecture
1. **ESP32** collects sensor data  
2. Data is processed and converted (ADC → Voltage → Resistance → PPM)  
3. Data is sent to **Firebase Realtime Database**  
4. Web dashboard fetches and displays live data  
5. Alerts are triggered when thresholds are exceeded  

##  Hardware Components
- ESP32 Microcontroller  
- MQ135 Gas Sensor (Air Quality)  
- DHT22 Sensor (Temperature & Humidity)  

##  Software & Tools
- Arduino IDE  
- Firebase Realtime Database  
- HTML, CSS, JavaScript (Dashboard)  
- Vercel (Deployment)  
- GitHub (Version Control & OTA updates)  

##  Working Principle
- MQ135 sensor outputs analog values → converted using ESP32 ADC  
- Voltage → Resistance → CO₂ concentration (ppm) calculated  
- DHT22 provides temperature & humidity  
- Data is uploaded to Firebase in real-time  
- Dashboard visualizes latest readings and trends  
- Alerts are triggered when thresholds are exceeded  

