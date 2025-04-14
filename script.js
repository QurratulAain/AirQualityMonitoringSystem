// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyA2YlhCqM1uKxn3jw8KVkP9x9ONr3J3uxs",
    authDomain: "air-quality-monitoring-s-8d8c8.firebaseapp.com",
    databaseURL: "https://air-quality-monitoring-s-8d8c8-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "air-quality-monitoring-s-8d8c8",
    storageBucket: "air-quality-monitoring-s-8d8c8.firebasestorage.app",
    messagingSenderId: "899854720338",
    appId: "1:899854720338:web:7fbddb85bc74b2d98cae8b"
  };
  
  const app = firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  
  // Fetch historical data for graphing
  const dataRef = db.ref("DH22_sensor_data");
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
  
      // Update Temperature Chart
      new Chart(document.getElementById("tempChart"), {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "Temperature (°C)",
            data: tempData,
            borderColor: "#f87171",
            fill: false,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: "top" } }
        }
      });
  
      // Update Humidity Chart
      new Chart(document.getElementById("humidityChart"), {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "Humidity (%)",
            data: humidityData,
            borderColor: "#60a5fa",
            fill: false,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: "top" } }
        }
      });
  
      // Update Live Readings (last entry)
      const latest = history[Object.keys(history).pop()];
      document.getElementById("temp-c").textContent = latest["temperature(°C)"].toFixed(1);
      document.getElementById("temp-f").textContent = latest["temperature(°F)"].toFixed(1);
      document.getElementById("humidity").textContent = latest.humidity.toFixed(1);
    }
  });
  