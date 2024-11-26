import { auth } from '../config/firebase';
import { getFirestore, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

const DAILY_LIMIT = 35;
const db = getFirestore();

interface RequestLimitCheck {
  allowed: boolean;
  hoursUntilReset: number;
}

export async function checkRequestLimit(): Promise<RequestLimitCheck> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const usageRef = doc(db, 'usage', user.uid);
  const usageDoc = await getDoc(usageRef);
  const now = Timestamp.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  if (!usageDoc.exists() || usageDoc.data().date.toDate() < startOfDay) {
    // First request of the day or new day
    await setDoc(usageRef, {
      count: 1,
      date: now
    });
    return {
      allowed: true,
      hoursUntilReset: 24 - new Date().getHours()
    };
  }

  const usage = usageDoc.data();
  if (usage.count >= DAILY_LIMIT) {
    return {
      allowed: false,
      hoursUntilReset: 24 - new Date().getHours()
    };
  }

  // Increment usage count
  await setDoc(usageRef, {
    count: usage.count + 1,
    date: now
  });

  return {
    allowed: true,
    hoursUntilReset: 24 - new Date().getHours()
  };
}