import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import Layout from '../../components/Layout';
import { AuthCard, Message } from '../../components/AuthCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useFormState } from '../../hooks/useFormState';
import { AuthError } from '@supabase/supabase-js';

export default function AuthCallback() {
  const router = useRouter();
  const { message, messageType, handleError, setSuccess } = useFormState();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the hash from the URL
        const hash = window.location.hash;
        
        if (!hash) {
          handleError(new Error('No verification token found.'));
          return;
        }

        // Parse the hash to get the access token
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        if (!accessToken || !type) {
          handleError(new Error('Invalid verification link.'));
          return;
        }

        if (type === 'signup' || type === 'recovery') {
          // Set the session in Supabase
          const { data: { user }, error: sessionError } = await supabase.auth.getUser(accessToken);

          if (sessionError) {
            throw sessionError;
          }

          if (user) {
            // Check if profile exists and create if it doesn't
            const { error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();

            if (profileError && profileError.code === 'PGRST116') {
              // Create profile if it doesn't exist
              const { error: insertError } = await supabase
                .from('profiles')
                .insert([{ id: user.id, email: user.email }]);

              if (insertError) {
                console.error('Error creating profile:', insertError);
                throw insertError;
              }
            }

            setSuccess('Email verified successfully! Redirecting...');
            
            // Redirect to profile page after a short delay
            setTimeout(() => {
              router.push('/profile');
            }, 2000);
          }
        }
      } catch (error: unknown) {
        console.error('Error during email confirmation:', error);
        if (error instanceof AuthError || error instanceof Error) {
          handleError(error);
        } else {
          handleError(new Error('An unexpected error occurred during email verification. Please try again.'));
        }
      }
    };

    handleEmailConfirmation();
  }, [router, handleError, setSuccess]);

  return (
    <Layout>
      <AuthCard title="Email Verification">
        {!message ? (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600">Verifying your email...</span>
          </div>
        ) : (
          <>
            <Message message={message} type={messageType as "error" | "success"} />
            {messageType === "error" && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => router.push('/login')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Go to Login
                </button>
              </div>
            )}
          </>
        )}
      </AuthCard>
    </Layout>
  );
} 