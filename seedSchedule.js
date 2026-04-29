import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAtiCjuRwUfAtv7S-D0SBL1DPN4WwbDAoI",
  authDomain: "bookingg-app-b0829.firebaseapp.com",
  projectId: "bookingg-app-b0829",
  storageBucket: "bookingg-app-b0829.firebasestorage.app",
  messagingSenderId: "975052929269",
  appId: "1:975052929269:web:f93799f82d4ee43d0b6dbc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  const scheduleRef = collection(db, 'schedule');
  
  // Clear existing
  const snap = await getDocs(scheduleRef);
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const baseIntervals = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
  
  for (const day of days) {
    if (day !== 'Sunday' && day !== 'Saturday') {
      await setDoc(doc(scheduleRef, day), {
        dayOfWeek: day,
        intervals: baseIntervals,
        timezone: 'UTC' // The base timezone for these intervals
      });
    } else {
      await setDoc(doc(scheduleRef, day), {
        dayOfWeek: day,
        intervals: [], // weekend off
        timezone: 'UTC'
      });
    }
  }

  console.log("Seeded /schedule collection");
}

seed().catch(console.error);
