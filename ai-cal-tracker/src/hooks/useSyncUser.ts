import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveUserToFirebase, checkOnboardingCompleted } from "../services/userService";

export function useSyncUser() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const syncUser = async () => {
        setIsSyncing(true);
        setError(null);
        try {
          // Check local storage first
          const localOnboarded = await AsyncStorage.getItem(`onboarding_${user.id}`);
          if (localOnboarded === "true") {
            setIsOnboarded(true);
          } else {
            // Check Firebase
            const firebaseOnboarded = await checkOnboardingCompleted(user.id);
            setIsOnboarded(firebaseOnboarded);
            
            if (firebaseOnboarded) {
              await AsyncStorage.setItem(`onboarding_${user.id}`, "true");
            }
          }

          await saveUserToFirebase({
            id: user.id,
            emailAddress: user.primaryEmailAddress?.emailAddress,
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
            imageUrl: user.imageUrl,
          });
        } catch (err: any) {
          setError(err as Error);
          // Default to true or false on error? Let's assume not onboarded if we can't tell, 
          // or just don't block. We'll set false to be safe but usually we don't want to trap users.
          if (isOnboarded === null) setIsOnboarded(false);
        } finally {
          setIsSyncing(false);
        }
      };

      syncUser();
    } else if (isLoaded && !isSignedIn) {
      // Reset when signed out
      setIsOnboarded(null);
    }
  }, [user, isLoaded, isSignedIn]);

  return { isSyncing, error, isOnboarded };
}
