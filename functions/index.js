/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();
const db = admin.database();

const EMAILJS_SERVICE_ID = "service_fjsfmdq";
const EMAILJS_TEMPLATE_ID = "template_79qlyzd";
// Public key
const EMAILJS_USER_ID = "zGsGaBQMI-j1lygia";

exports.dailyTemperatureCheck = functions.pubsub
    .schedule("every 24 hours")
    .onRun(async (context) => {
      const snapshot = await db.ref("DHT22_sensor_data").once("value");
      const data = snapshot.val();
      if (!data) return null;

      const temps = [];
      const today = new Date().toISOString().slice(0, 10);

      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const entry = data[key];
          const entryDate = new Date(entry.timestamp).toISOString().slice(0, 10);
          if (entryDate === today && entry["temperature(°C)"]) {
            temps.push(parseFloat(entry["temperature(°C)"]));
          }
        }
      }

      if (temps.length === 0) return null;

      const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
      console.log("Average Temp:", avgTemp);

      if (avgTemp >= 30) {
        const subsSnapshot = await db.ref("subscribers").once("value");
        const subscribers = subsSnapshot.val();

        if (!subscribers) return null;

        for (const id in subscribers) {
          if (Object.prototype.hasOwnProperty.call(subscribers, id)) {
            const email = subscribers[id].email;

            await fetch("https://api.emailjs.com/api/v1.0/email/send", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                service_id: EMAILJS_SERVICE_ID,
                template_id: EMAILJS_TEMPLATE_ID,
                user_id: EMAILJS_USER_ID,
                template_params: {
                  to_email: email,
                  AQMS: "Air Quality Monitoring System",
                  message: `${avgTemp.toFixed(1)}°C - High temperature alert!`,
                },
              }),
            }).then((res) => res.json())
                .then((json) => console.log("Email sent to:", email, json))
                .catch((err) => console.error("Failed to send email:", email, err));
          }
        }
      }

      return null;
    });
