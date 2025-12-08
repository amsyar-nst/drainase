import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index"; // This is DrainaseForm
import LaporanList from "./pages/LaporanList";
import TersierIndex from "./pages/TersierIndex";
import TersierList from "./pages/TersierList";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login"; // Import the new Login page
import { SessionContextProvider } from "./components/SessionContextProvider"; // Import the new context provider

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}> {/* Enabled future flags */}
          <SessionContextProvider> {/* Wrap the entire app with SessionContextProvider */}
            <Routes>
              <Route path="/login" element={<Login />} /> {/* Add the login route */}

              {/* New main display: LaporanList */}
              <Route path="/" element={<LaporanList />} />
              <Route path="/laporan" element={<LaporanList />} /> {/* Keep for explicit access */}

              {/* Drainase Form routes */}
              <Route path="/drainase/new" element={<Index />} /> {/* New form */}
              <Route path="/drainase/edit/:id" element={<Index />} /> {/* Edit form */}
              
              {/* Tersier routes (unchanged) */}
              <Route path="/tersier" element={<TersierIndex />} />
              <Route path="/tersier/edit/:id" element={<TersierIndex />} />
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