let tempChartInstance = null;
let humidityChartInstance = null;
let airQualityChartInstance = null;
let adcChartInstance = null;
let alertSent = false;


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

const subscribersRef = db.ref("subscribers");

document.getElementById('emailForm').addEventListener('submit', function (event) {
  event.preventDefault();
  const emailInput = document.getElementById('userEmail');
  const email = emailInput.value.trim().toLowerCase();

  if (!email) return;

  // Check for duplicates
  subscribersRef.orderByChild("email").equalTo(email).once("value", (snapshot) => {
    if (snapshot.exists()) {
      document.getElementById("emailStatus").textContent = "⚠️ You have already subscribed!";
    } else {
      subscribersRef.push({ email });
      document.getElementById("emailStatus").textContent = "✅ You have subscribed successfully!";
    }

    emailInput.value = "";
  });
});



//Alert function
function sendAlertEmail(temp) {
  if (!subscribedEmail) {
    console.warn("No subscribed email, skipping alert email.");
    return;
  }
  emailjs.send("service_fjsfmdq", "template_79qlyzd", {
    to_email: subscribedEmail,
    AQMS: "Air Quality Monitoring System",
    message: `${temp}°C`
  }).then(
    () => console.log("✅ Email sent successfully to:", subscribedEmail),
    (error) => console.error("❌ Failed to send email:", error)
  );
}

function checkLatestTemperatureForAlert() {
  dataRef.limitToLast(1).once("value", (snapshot) => {
      const latest = snapshot.val();
      if (latest) {
          const entry = Object.values(latest)[0];
          console.log(entry);
          console.log(entry["temperature(°C)"]);
          if (entry["temperature(°C)"] >= 30 && !alertSent) {
              sendAlertEmail(entry["temperature(°C)"]);
              alertSent = true;
          }
      }
  });
}

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
            document.getElementById("mq135-resistance").textContent = latest.resistance_Rs|| "--";
            document.getElementById("mq135-CO2").textContent = latest.MQ135_raw_ADC || "--";

            updateAQIBadge(latest.MQ135_air_quality_status);
            checkAirQualityAlert(latest.estimated_CO2_ppm); // ✅ Fire alert checking
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
    const tempData_F=[]
    const humidityData = [];

    if (history) {
        Object.keys(history).forEach((key) => {
            const entry = history[key];
            labels.push(new Date(entry.timestamp).toLocaleTimeString());
            tempData.push(entry["temperature(°C)"]);
            tempData_F.push(entry["temperature(°F)"]);
            humidityData.push(entry.humidity);
            if (entry["temperature(°C)"] >= 30 && !alertSent) {
              sendAlertEmail(entry["temperature(°C)"]);
              //alertSent = true;
            }
        });

        const latest = history[Object.keys(history).pop()];
        if (latest) {
            const tempC = latest["temperature(°C)"];
            const tempF = latest["temperature(°F)"]

            document.getElementById("temp-c").textContent = tempC.toFixed(1);
            document.getElementById("temp-f").textContent = tempF.toFixed(1);
            document.getElementById("humidity").textContent = latest.humidity.toFixed(1);
        }

        updateTempChart(labels, tempData);
        updateTempChart_F(labels, tempData_F);
        updateHumidityChart(labels, humidityData);
        updateLastUpdated();
    }
});

// Update AQI Status Badge Color & Icon
function updateAQIBadge(status) {
  const badge = document.getElementById('air-quality-status');
  if (!badge) return;

  badge.innerText = status; // Base text

  switch (status) {
      case "Excellent":
          badge.style.backgroundColor = "#16a34a"; // deep green
          badge.style.color = "#ffffff";
          badge.innerText += " 🌿";
          break;
      case "Good":
          badge.style.backgroundColor = "#10b981"; // green
          badge.style.color = "#ffffff";
          badge.innerText += " ✅";
          break;
      case "Moderate":
          badge.style.backgroundColor = "#f59e0b"; // yellow
          badge.style.color = "#000000";
          badge.innerText += " ⚠️";
          break;
      case "Poor":
          badge.style.backgroundColor = "#ef4444"; // red
          badge.style.color = "#ffffff";
          badge.innerText += " ❌";
          break;
      case "Hazardous":
          badge.style.backgroundColor = "#7e22ce"; // dark purple
          badge.style.color = "#ffffff";
          badge.innerText += " ☠️";
          break;
      default:
          badge.style.backgroundColor = "#4b5563"; // gray
          badge.style.color = "#ffffff";
          badge.innerText += " ❓";
  }

  badge.title = `Current air quality is: ${status}`;
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
                tension: 0.4,
                borderWidth: 3,
            pointBackgroundColor: '#f87171',
            pointBorderColor: '#f87171',
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
              text: 'Temperature(°C) Over Time',
              color: '#f87171',
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
              text: 'Temperature(°C)',
              color: '#9ca3af',
              font: { size: 18 }
            },
            beginAtZero: true
          }
        }
      }
    });
}

function updateTempChart_F(labels, data) {
  const ctx = document.getElementById('tempChart(F)').getContext('2d');
  new Chart(ctx, {
      type: 'line',
      data: {
          labels,
          datasets: [{
              label: 'Temperature (°F)',
              data,
              borderColor: '#bb1cd4',
              backgroundColor: 'rgba(248,113,113,0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 3,
          pointBackgroundColor: '#bb1cd4',
          pointBorderColor: '#bb1cd4',
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
            text: 'Temperature(°F) Over Time',
            color: '#bb1cd4',
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
            text: 'Temperature(°F)',
            color: '#9ca3af',
            font: { size: 18 }
          },
          beginAtZero: true
        }
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
                tension: 0.4,
                borderWidth: 3,
                pointBackgroundColor: '#60a5fa',
                pointBorderColor: '#60a5fa',
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
              text: 'Humidity  Over Time',
              color: '#60a5fa',
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
                text: 'Humidity',
                color: '#9ca3af',
                font: { size: 18 }
              },
              beginAtZero: true
            }
        }
      }
    });
}

// Create or Update Air Quality co2 Chart
mq135Ref.on("value", (snapshot) => {
    const gasData = snapshot.val();
    const labels = [];
    const voltages = [];

    if (gasData) {
        Object.keys(gasData).forEach((key) => {
            const entry = gasData[key];
            labels.push(new Date(entry.timestamp).toLocaleTimeString());
            voltages.push(parseFloat(entry.estimated_CO2_ppm|| 0));
        });

        const ctxAir = document.getElementById('airQualityChart').getContext('2d');
        new Chart(ctxAir, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Estimated CO2 (ppm)',
                    data: voltages,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16,185,129,0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#10b981',
         
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
                    text: 'Estimated CO2 Over Time',
                    color: '#10b981',
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
                      text: 'Estimated CO2',
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
function checkAirQualityAlert(ppm) {
  const popup = document.getElementById('popup-alert');
  const heading = document.getElementById('recommendation-heading');
  if (!popup || !heading) return;

  if (ppm > 5000) {
    popup.textContent = "🔥 EXTREME DANGER! CO₂ Levels Toxic!";
    heading.textContent = "🚨 ACTION: Evacuate area immediately and call for help!";
    popup.classList.remove('hidden');
    playDoubleBeep();
  } else if (ppm > 2000) {
    popup.textContent = "⚠️ Very Poor Air Quality!";
    heading.textContent = "⚠️ ACTION: Open all windows and leave the area.";
    popup.classList.remove('hidden');
    playNormalBeep();
  } else if (ppm > 1000) {
    popup.textContent = "⚠️ Moderate Air Quality!";
    heading.textContent = "🔄 ACTION: Improve ventilation.";
    popup.classList.remove('hidden');
    playSoftBeep();
  } else if (ppm > 400) {
    popup.textContent = "✅ Good Air Quality.";
    heading.textContent = "🙂 No action needed.";
    popup.classList.remove('hidden');
    // Optional: No beep
  } else {
    popup.classList.add('hidden');
    heading.textContent = "";
  }

  if (ppm > 400) {
    setTimeout(() => {
      popup.classList.add('hidden');
      heading.textContent = "";
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
  
  
  
  