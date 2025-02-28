import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import styles from '../../styles/register.module.css';

export default function AuthCallback() {
  const router = useRouter();
  const [message, setMessage] = useState('Verifying your email...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the hash from the URL
        const hash = window.location.hash;
        
        if (!hash) {
          setError('No verification token found.');
          return;
        }

        // Parse the hash to get the access token
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (!accessToken || !type) {
          setError('Invalid verification link.');
          return;
        }

        if (type === 'signup' || type === 'recovery') {
          // Set the session in Supabase
          const { data: { user }, error: sessionError } = await supabase.auth.getUser(accessToken);

          if (sessionError) {
            throw sessionError;
          }

          if (user) {
            // Check if profile exists
            const { data: profile, error: profileError } = await supabase
              .from('profile')
              .select('*')
              .eq('id', user.id)
              .single();

            if (profileError && profileError.code === 'PGRST116') {
              // Create profile if it doesn't exist
              const { error: insertError } = await supabase
                .from('profile')
                .insert([{ id: user.id, email: user.email }]);

              if (insertError) {
                console.error('Error creating profile:', insertError);
              }
            }

            setMessage('Email verified successfully! Redirecting...');
            
            // Redirect to profile page after a short delay
            setTimeout(() => {
              router.push('/profile');
            }, 2000);
          }
        }
      } catch (err) {
        console.error('Error during email confirmation:', err);
        setError('An error occurred during email verification. Please try again.');
      }
    };

    handleEmailConfirmation();
  }, [router]);

  return (
    <div className={styles.container}>
      <h1>Email Verification</h1>
      {error ? (
        <div className={`${styles.message} ${styles.error}`}>
          {error}
          <p className={styles.linkText}>
            <button
              onClick={() => router.push('/login')}
              className={styles.button}
            >
              Go to Login
            </button>
          </p>
        </div>
      ) : (
        <div className={`${styles.message} ${styles.success}`}>
          {message}
        </div>
      )}
    </div>
  );
} 