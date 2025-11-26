import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import LaporanList from "./pages/LaporanList";
import TersierIndex from "./pages/TersierIndex";
import TersierList from "./pages/TersierList";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login"; // Import Login page
import { SessionProvider } from "./components/SessionProvider"; // Import SessionProvider

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SessionProvider> {/* Wrap the entire app with SessionProvider */}
            <Routes>
              <Route path="/login" element={<Login />} /> {/* Add login route */}
              <Route path="/" element={<Index />} />
              <Route path="/edit/:id" element={<Index />} />
              <Route path="/laporan" element={<LaporanList />} />
              <Route path="/tersier" element={<TersierIndex />} />
              <Route path="/tersier/edit/:id" element={<TersierIndex />} />
              <Route path="/tersier/list" element={<TersierList />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SessionProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;