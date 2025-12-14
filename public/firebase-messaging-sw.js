importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCvthDP8LSNfFB1sD9X53hwrdeKuNOQm-7k",
  authDomain: "vetconnect-6d4a8.firebaseapp.com",
  projectId: "vetconnect-6d4a8",
  storageBucket: "vetconnect-6d4a8.firebasestorage.app",
  messagingSenderId: "502108263748",
  appId: "1:502108263748:web:5366107802f225eb08f311"
});

const messaging = firebase.messaging();

// --- HANDLER COMPLETO (notification + data) ---
messaging.onBackgroundMessage((payload) => {

  let title = "Nova Notificação";
  let options = {
    body: "",
    icon: "/icon.png",
    data: payload.data || {}
  };

  // Caso venha notification:
  if (payload.notification) {
    title = payload.notification.title || title;
    options.body = payload.notification.body || "";
  }

  // Caso venha somente data:
  if (!payload.notification && payload.data) {
    title = payload.data.title || title;
    options.body = payload.data.body || "";
  }

  self.registration.showNotification(title, options);
});
