import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { FileText, List, Home, LogIn, LogOut } from "lucide-react";
import { useSession } from "./SessionProvider"; // Import useSession
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Navigation = () => {
  const { session, loading } = useSession(); // Get session and loading state

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
      toast.error("Gagal logout.");
    } else {
      // SessionProvider will handle the redirect and toast.info
    }
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Sistem Laporan Drainase</h1>
          </div>
          <div className="flex items-center gap-2">
            {session ? (
              <>
                <NavLink
                  to="/"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
                  activeClassName="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Form Drainase</span>
                </NavLink>
                <NavLink
                  to="/laporan"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
                  activeClassName="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">List Drainase</span>
                </NavLink>
                <NavLink
                  to="/tersier"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
                  activeClassName="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Form Tersier</span>
                </NavLink>
                <NavLink
                  to="/tersier/list"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
                  activeClassName="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">List Tersier</span>
                </NavLink>
                <Button variant="ghost" onClick={handleLogout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
                activeClassName="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Login</span>
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};