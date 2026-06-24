import { collection, doc, getDocs, setDoc, updateDoc, arrayUnion, arrayRemove, increment, query, orderBy, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  upvotes: string[]; // array of userIds
  upvoteCount: number;
  createdAt: string;
}

/**
 * Creates a new feature request. The author automatically upvotes their own request.
 */
export async function createFeatureRequest(userId: string, creatorName: string, title: string, description: string): Promise<void> {
  try {
    const ref = collection(db, "featureRequests");
    const newDocRef = doc(ref);
    await setDoc(newDocRef, {
      id: newDocRef.id,
      title,
      description,
      creatorId: userId,
      creatorName,
      upvotes: [userId],
      upvoteCount: 1,
      createdAt: new Date().toISOString(),
    });
    console.log(`[Firebase Sync] Created feature request ${newDocRef.id} by ${userId}.`);
  } catch (error) {
    console.error("[Firebase Sync] Error creating feature request:", error);
    throw error;
  }
}

/**
 * Fetches all feature requests from Firestore.
 * Sorted by upvoteCount (descending) and then by createdAt (descending).
 */
export async function getFeatureRequests(): Promise<FeatureRequest[]> {
  try {
    const ref = collection(db, "featureRequests");
    const snap = await getDocs(ref);
    const requests: FeatureRequest[] = [];
    snap.forEach((d) => {
      requests.push(d.data() as FeatureRequest);
    });
    
    // Sort in memory: upvoteCount descending, then createdAt descending
    return requests.sort((a, b) => {
      if (b.upvoteCount !== a.upvoteCount) {
        return b.upvoteCount - a.upvoteCount;
      }
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  } catch (error) {
    console.error("[Firebase Sync] Error fetching feature requests:", error);
    throw error;
  }
}

/**
 * Toggles a user's upvote on a feature request.
 * If the user has already upvoted, the upvote is removed and count is decremented.
 * Otherwise, the upvote is added and count is incremented.
 */
export async function toggleUpvoteFeatureRequest(requestId: string, userId: string): Promise<void> {
  try {
    const docRef = doc(db, "featureRequests", requestId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error("Feature request not found.");
    }
    const data = docSnap.data();
    const upvotes: string[] = data.upvotes || [];

    if (upvotes.includes(userId)) {
      // Remove upvote
      await updateDoc(docRef, {
        upvotes: arrayRemove(userId),
        upvoteCount: increment(-1),
      });
      console.log(`[Firebase Sync] Removed upvote for user ${userId} on feature ${requestId}.`);
    } else {
      // Add upvote
      await updateDoc(docRef, {
        upvotes: arrayUnion(userId),
        upvoteCount: increment(1),
      });
      console.log(`[Firebase Sync] Added upvote for user ${userId} on feature ${requestId}.`);
    }
  } catch (error) {
    console.error("[Firebase Sync] Error toggling upvote on feature request:", error);
    throw error;
  }
}
