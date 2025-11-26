import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Selamat Datang</CardTitle>
          <p className="text-muted-foreground">Silakan login untuk melanjutkan</p>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            providers={[]} // Anda bisa menambahkan 'google', 'github', dll. di sini
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
            theme="light" // Gunakan tema 'dark' jika aplikasi Anda mendukung dark mode
            redirectTo={window.location.origin} // Redirect ke halaman utama setelah login
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;