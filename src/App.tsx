import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import { GithubSettings } from "@/components/github/GithubSettings";
import { SettingsLayout } from "@/components/SettingsLayout";
import { AnalysisProvider } from "./components/context/AnalysisContext";

const App = () => (
  <ErrorBoundary>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AnalysisProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            
            {/* Settings routes */}
            <Route path="/settings" element={<SettingsLayout />}>
              <Route path="github" element={<GithubSettings />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnalysisProvider>
      </BrowserRouter>
      <Analytics />
    </TooltipProvider>
  </ErrorBoundary>
);

export default App;