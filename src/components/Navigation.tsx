import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { FileText, List, Home, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const Navigation = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
      toast.error("Gagal keluar: " + error.message);
    } else {
      toast.success("Anda telah berhasil keluar.");
      navigate("/login");
    }
  };

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Sistem Laporan Drainase</h1>
          </div>
          <div className="flex items-center gap-2">
            <NavLink
              to="/drainase/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
              activeClassName="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Form Drainase</span>
            </NavLink>
            <NavLink
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
              activeClassName="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List Laporan</span>
            </NavLink>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};