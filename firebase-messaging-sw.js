importScripts(
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js'
);

importScripts(
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js'
);

firebase.initializeApp({

 apiKey: "AIzaSyD91obV5pMOt8FGeyC2_StenLM6dKpbQKQ",
  authDomain: "family-bill-tracker-465e9.firebaseapp.com",
  projectId: "family-bill-tracker-465e9",
  storageBucket: "family-bill-tracker-465e9.firebasestorage.app",
  messagingSenderId: "933705487509",
  appId: "1:933705487509:web:152e1f6e0e60295193b79c"

});

const messaging =
    firebase.messaging();

messaging.onBackgroundMessage(
    (payload) => {

        self.registration.showNotification(
    payload.notification.title,
    {
        body: payload.notification.body,
        icon: "/7244-Bill-Tracker/icon-192.png",
        badge: "/7244-Bill-Tracker/icon-192.png",
        requireInteraction: true
    }
);

    }
);
