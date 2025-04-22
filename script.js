//let alertSent = false;

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyA2YlhCqM1uKxn3jw8KVkP9x9ONr3J3uxs",
  authDomain: "air-quality-monitoring-s-8d8c8.firebaseapp.com",
  databaseURL:
    "https://air-quality-monitoring-s-8d8c8-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "air-quality-monitoring-s-8d8c8",
  storageBucket: "air-quality-monitoring-s-8d8c8.firebasestorage.app",
  messagingSenderId: "899854720338",
  appId: "1:899854720338:web:7fbddb85bc74b2d98cae8b",
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const mq135Ref = db.ref("MQ135_sensor_data");

mq135Ref.limitToLast(1).on("value", (snapshot) => {
  const data = snapshot.val();
  if (data) {
    const latest = Object.values(data)[0];
    document.getElementById("air-quality-status").textContent =
      latest.MQ135_air_quality_status;
    document.getElementById("mq135-voltage").textContent = parseFloat(
      latest.MQ135_voltage
    ).toFixed(2);
    document.getElementById("mq135-adc").textContent = latest.MQ135_raw_ADC;
  }
});

// function sendAlertEmail(temp) {
//   emailjs.send("service_fjsfmdq", "template_79qlyzd", {
//     message: `Alert! Temperature has reached ${temp}°C`
//   }).then(
//     () => console.log("Email sent successfully."),
//     (error) => console.error("Failed to send email:", error)
//   );
// }

// Fetch historical data for graphing
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
      //  if (entry["temperature(°C)"] >= 20 && !alertSent) {
      //   sendAlertEmail(entry["temperature(°C)"]);
      //   alertSent = true;
      // }
    });

    // Update Live Readings (last entry)
    const latest = history[Object.keys(history).pop()];
    console.log("Latest DHT22 data:", latest);
    //   document.getElementById("temp-c").textContent = latest["temperature(°C)"].toFixed(1);
    //   document.getElementById("temp-f").textContent = latest["temperature(°F)"].toFixed(1);
    //   document.getElementById("humidity").textContent = latest.humidity.toFixed(1);
    const tempC = latest["temperature(°C)"];
    const tempF = (tempC * 9) / 5 + 32;

    const tempCElement = document.getElementById("temp-c");
    const tempFElement = document.getElementById("temp-f");
    const humidityElement = document.getElementById("humidity");

    if (tempCElement) tempCElement.textContent = tempC.toFixed(1);
    if (tempFElement) tempFElement.textContent = tempF.toFixed(1);
    if (humidityElement)
      humidityElement.textContent = latest.humidity.toFixed(1);

    // Update Temperature Chart
    new Chart(document.getElementById("tempChart"), {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Temperature(°C)",
            data: tempData,
            borderColor: "#f87171",
            fill: false,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "top" } },
      },
    });

    // Update Humidity Chart
    new Chart(document.getElementById("humidityChart"), {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Humidity (%)",
            data: humidityData,
            borderColor: "#60a5fa",
            fill: false,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "top" } },
      },
    });
  }
});

//const mq135Ref = db.ref("MQ135_sensor_data");

mq135Ref.on("value", (snapshot) => {
  const data = snapshot.val();
  const labels = [];
  const voltages = [];

  for (let key in data) {
    const entry = data[key];
    labels.push(new Date(entry.timestamp).toLocaleTimeString());
    voltages.push(parseFloat(entry.MQ135_voltage));
  }

  const ctxAirQuality = document.getElementById("airQualityChart").getContext("2d");
  new Chart(ctxAirQuality, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "MQ135 Voltage (V)",
          data: voltages,
          borderColor: "rgba(34, 197, 94, 1)",
          backgroundColor: "rgba(34, 197, 94, 0.2)",
          fill: true,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 3
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Air Quality (MQ135) Voltage Over Time",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Voltage (V)",
          },
        },
        x: {
          title: {
            display: true,
            text: "Time",
          },
        },
      },
    },
  });
});
