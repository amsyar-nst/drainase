import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
// import { useNavigate } from 'react-router-dom'; // Tidak lagi diperlukan di sini
// import { useEffect } from 'react'; // Tidak lagi diperlukan di sini
// import { toast } from 'sonner'; // Tidak lagi diperlukan di sini

const Login = () => {
  // const navigate = useNavigate(); // Tidak lagi diperlukan di sini

  // useEffect(() => { // Logika ini dipindahkan ke SessionContextProvider
  //   const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
  //     if (event === 'SIGNED_IN' && session) {
  //       toast.success('Berhasil masuk!');
  //       navigate('/'); // Redirect to home page after successful login
  //     } else if (event === 'SIGNED_OUT') {
  //       toast.info('Anda telah keluar.');
  //     } else if (event === 'USER_UPDATED') {
  //       toast.info('Profil pengguna diperbarui.');
  //     }
  //   });

  //   // Check initial session
  //   supabase.auth.getSession().then(({ data: { session } }) => {
  //     if (session) {
  //       navigate('/');
  //     }
  //   });

  //   return () => {
  //     authListener.subscription.unsubscribe();
  //   };
  // }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-foreground">Masuk ke Aplikasi</h1>
        <Auth
          supabaseClient={supabase}
          providers={[]} // No third-party providers unless specified
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                },
              },
            },
          }}
          theme="light"
          redirectTo={window.location.origin} // Redirect back to the app's origin
          localization={{
            variables: {
              sign_in: {
                link_text: '',      // Menyembunyikan tautan "Don't have an account? Sign up"
              },
              sign_up: {
                link_text: '', // Menyembunyikan tautan "Sign in" jika pengguna beralih ke tampilan daftar
              },
              forgotten_password: {
                link_text: '', // Menyembunyikan tautan "Remember your password? Sign in"
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Login;