 
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDmbitci7RdqvTxbHOPdwHj6nui9ysMejc",
  authDomain: "vibenetai-app-18396.firebaseapp.com",
  projectId: "vibenetai-app-18396",
  storageBucket: "vibenetai-app-18396.firebasestorage.app",
  messagingSenderId: "758643874403",
  appId: "1:758643874403:web:3cf39d3281690a3e0af656"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body: body,
    icon: '/assets/icon/favicon.png',
    badge: '/assets/icon/favicon.png',
    data: payload.data
  });
});