import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index"; // This is DrainaseForm
import LaporanList from "./pages/LaporanList";
import TersierList from "./pages/TersierList";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { SessionContextProvider } from "./components/SessionContextProvider";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <SessionContextProvider>
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Main Drainase List */}
              <Route path="/" element={<LaporanList />} />
              <Route path="/laporan" element={<LaporanList />} />

              {/* Drainase Form (Harian) routes */}
              <Route path="/drainase/new" element={<Index />} />
              <Route path="/drainase/edit/:id" element={<Index />} />
              
              {/* Tersier Form routes */}
              <Route path="/tersier/new" element={<Index />} /> {/* New route for creating tersier reports */}
              <Route path="/tersier/edit/:id" element={<Index />} /> {/* Edit tersier report using main form */}
              <Route path="/tersier/list" element={<TersierList />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SessionContextProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;