import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { guestStorage } from '../utils/guestStorage';

const AuthHandler = () => {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    const handleUserAuth = async () => {
      if (!isLoaded) return;

      if (user) {
        try {
          // Create/update user record
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/get-or-create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              clerkId: user.id,
              email: user.primaryEmailAddress?.emailAddress 
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create/update user record');
          }

          // Merge guest data with user data
          await guestStorage.mergeGuestDataWithUser(user.id);
        } catch (error) {
          console.error('Error in handleUserAuth:', error);
        }
      }
    };

    handleUserAuth();
  }, [user, isLoaded]);

  // This component doesn't render anything
  return null;
};

export default AuthHandler; 