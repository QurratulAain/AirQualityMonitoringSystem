let tempChartInstance = null;
let humidityChartInstance = null;
let airQualityChartInstance = null;
let adcChartInstance = null;


// Smooth Scroll to Graphs Section
function scrollToGraphs() {
    document.getElementById('graphs').scrollIntoView({ behavior: 'smooth' });
}

// Show and Hide Graphs
function showChart(type) {
    document.getElementById('tempChart').classList.add('hidden');
    document.getElementById('humidityChart').classList.add('hidden');
    document.getElementById('airQualityChart').classList.add('hidden');

    if (type === 'temp') {
        document.getElementById('tempChart').classList.remove('hidden');
    } else if (type === 'humidity') {
        document.getElementById('humidityChart').classList.remove('hidden');
    } else if (type === 'airQuality') {
        document.getElementById('airQualityChart').classList.remove('hidden');
    }
}

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyA2YlhCqM1uKxn3jw8KVkP9x9ONr3J3uxs",
    authDomain: "air-quality-monitoring-s-8d8c8.firebaseapp.com",
    databaseURL: "https://air-quality-monitoring-s-8d8c8-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "air-quality-monitoring-s-8d8c8",
    storageBucket: "air-quality-monitoring-s-8d8c8.appspot.com",
    messagingSenderId: "899854720338",
    appId: "1:899854720338:web:7fbddb85bc74b2d98cae8b",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Fetch Live Air Quality Sensor Readings
const mq135Ref = db.ref("MQ135_sensor_data");

mq135Ref.limitToLast(1).on("value", (snapshot) => {
    const data = snapshot.val();
    if (data) {
        const latest = Object.values(data)[0];
        if (latest) {
            document.getElementById("air-quality-status").textContent = latest.MQ135_air_quality_status || "--";
            document.getElementById("mq135-voltage").textContent = parseFloat(latest.MQ135_voltage || 0).toFixed(2);
            document.getElementById("mq135-adc").textContent = latest.MQ135_raw_ADC || "--";

            updateAQIBadge(latest.MQ135_air_quality_status);
            checkFireAlert(latest.MQ135_raw_ADC); // ✅ Fire alert checking
        }
        updateLastUpdated();
    }
});

// Fetch Live DHT22 Sensor Readings + Graphs
const dataRef = db.ref("DHT22_sensor_data");

dataRef.on("value", (snapshot) => {
    const history = snapshot.val();
    const labels = [];
    const tempData = [];
    const humidityData = [];

    if (history) {
        Object.keys(history).forEach((key) => {
            const entry = history[key];
            labels.push(new Date(entry.timestamp).toLocaleTimeString());
            tempData.push(entry["temperature(°C)"]);
            humidityData.push(entry.humidity);
        });

        const latest = history[Object.keys(history).pop()];
        if (latest) {
            const tempC = latest["temperature(°C)"];
            const tempF = (tempC * 9) / 5 + 32;

            document.getElementById("temp-c").textContent = tempC.toFixed(1);
            document.getElementById("temp-f").textContent = tempF.toFixed(1);
            document.getElementById("humidity").textContent = latest.humidity.toFixed(1);
        }

        updateTempChart(labels, tempData);
        updateHumidityChart(labels, humidityData);
        updateLastUpdated();
    }
});

// Update AQI Status Badge Color
function updateAQIBadge(status) {
    const badge = document.getElementById('air-quality-status');
    if (!badge) return;

    if (status === "GOOD") {
        badge.style.backgroundColor = "#10b981"; // green
    } else if (status === "MODERATE") {
        badge.style.backgroundColor = "#f59e0b"; // yellow
    } else if (status === "POOR") {
        badge.style.backgroundColor = "#ef4444"; // red
    } else {
        badge.style.backgroundColor = "#4b5563"; // neutral
    }
}

// Update Last Updated Time
function updateLastUpdated() {
    const now = new Date();
    document.getElementById('last-updated').textContent = `Last Updated: ${now.toLocaleTimeString()}`;
}

// Create or Update Temperature Chart
function updateTempChart(labels, data) {
    const ctx = document.getElementById('tempChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Temperature (°C)',
                data,
                borderColor: '#f87171',
                backgroundColor: 'rgba(248,113,113,0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' }
            }
        }
    });
}

// Create or Update Humidity Chart
function updateHumidityChart(labels, data) {
    const ctx = document.getElementById('humidityChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Humidity (%)',
                data,
                borderColor: '#60a5fa',
                backgroundColor: 'rgba(96,165,250,0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' }
            },

            
            
        }
    });
}

// Create or Update Air Quality Voltage Chart
mq135Ref.on("value", (snapshot) => {
    const gasData = snapshot.val();
    const labels = [];
    const voltages = [];

    if (gasData) {
        Object.keys(gasData).forEach((key) => {
            const entry = gasData[key];
            labels.push(new Date(entry.timestamp).toLocaleTimeString());
            voltages.push(parseFloat(entry.MQ135_voltage || 0));
        });

        const ctxAir = document.getElementById('airQualityChart').getContext('2d');
        new Chart(ctxAir, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'MQ135 Voltage (V)',
                    data: voltages,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16,185,129,0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' }
                },
                title: {
                    display: true,
                    text: 'Voltage Value Over Time',
                    color: 'rgba(16,185,129,0.1)',
                    font: { size: 22 }
                  },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: "Voltage (V)"
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: "Time"
                        }
                    }
                }
            }
        });
    }
});
// Create or Update RAW ADC Chart
mq135Ref.on("value", (snapshot) => {
    const gasData = snapshot.val();
    const labels = [];
    const rawAdcValues = [];
  
    if (gasData) {
      Object.keys(gasData).forEach((key) => {
        const entry = gasData[key];
        labels.push(new Date(entry.timestamp).toLocaleTimeString());
        rawAdcValues.push(parseFloat(entry.MQ135_raw_ADC || 0));
      });
  
      const ctxAdc = document.getElementById('adcChart').getContext('2d');
      new Chart(ctxAdc, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'RAW ADC Value',
            data: rawAdcValues,
            borderColor: '#facc15', // Yellow line
            backgroundColor: 'rgba(250,204,21,0.2)',
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: '#facc15',
            pointBorderColor: '#facc15',
 
          }]
        },
        options: {
          responsive: true,

          plugins: {
            legend: {
              labels: { color: '#ffffff', font: { size: 16 } },
              position: 'top'
            },
            title: {
              display: true,
              text: 'RAW ADC Value Over Time',
              color: '#facc15',
              font: { size: 22 }
            }
          },
          scales: {
            x: {
              ticks: { color: '#d1d5db' },
              title: {
                display: true,
                text: 'Time',
                color: '#9ca3af',
                font: { size: 18 }
              }
            },
            y: {
              ticks: { color: '#d1d5db' },
              title: {
                display: true,
                text: 'ADC Value',
                color: '#9ca3af',
                font: { size: 18 }
              },
              beginAtZero: true
            }
          }
        }
      });
    }
  });
  

// ✅ New Fire Alert Function
function checkFireAlert(adcValue) {
    const popup = document.getElementById('popup-alert');
    if (!popup) return;
  
    if (adcValue > 700) {
      popup.textContent = "🔥 EXTREME Danger! Gas Concentration Very High!";
      popup.classList.remove('hidden');
      playDoubleBeep(); // Double beep for extreme danger
    } else if (adcValue > 500) {
      popup.textContent = "⚠️ Dangerous Gases Detected!";
      popup.classList.remove('hidden');
      playNormalBeep(); // Normal beep
    } else if (adcValue > 300) {
      popup.textContent = "⚠️ Warning: Air Quality Moderate!";
      popup.classList.remove('hidden');
      playSoftBeep(); // Soft beep for warning
    } else {
      popup.classList.add('hidden'); // Hide popup if air is good
    }
  
    if (adcValue > 300) {
      setTimeout(() => {
        popup.classList.add('hidden'); // Auto-hide after 10 seconds
      }, 10000);
    }
  }
  
  function playSoftBeep() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
  
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
  
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, context.currentTime); // Softer frequency
    gainNode.gain.setValueAtTime(0.05, context.currentTime); // Softer volume
  
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
    }, 300);
  }
  
  function playNormalBeep() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
  
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
  
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1000, context.currentTime); // Normal beep
    gainNode.gain.setValueAtTime(0.1, context.currentTime);
  
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
    }, 500);
  }
  
  function playDoubleBeep() {
    playNormalBeep();
    setTimeout(() => {
      playNormalBeep();
    }, 700); // Play second beep after 0.7 seconds
  }
  
  
