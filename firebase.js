const firebaseConfig = {
  apiKey: "AIzaSyAjLDd6lZyN2eRhQ49dd4oXZ7pf2lgVVsw",
  authDomain: "algorythm-637dd.firebaseapp.com",
  projectId: "algorythm-637dd",
  storageBucket: "algorythm-637dd.firebasestorage.app",
  messagingSenderId: "848301084424",
  appId: "1:848301084424:web:1b53f8fc7719b2a90ee6bd"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();