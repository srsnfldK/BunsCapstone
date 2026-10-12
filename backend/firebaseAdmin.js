const { initializeApp, applicationDefault } = require("firebase-admin/app");

initializeApp({
  credential: applicationDefault(),
  projectId: "pantrysync-62d6b"
});

console.log("Firebase Admin initialized successfully!");