// src/context/AnalysisContext.tsx
"use client";

import { createContext, useContext, useState } from "react";
import type { AnalysisResults } from "../../types/analysis-result";

interface AnalysisContextType {
  results: AnalysisResults | null;
  setResults: (results: AnalysisResults | null) => void;
  githubToken: string | null;
  setGithubToken: (token: string) => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [githubToken, setToken] = useState<string | null>(null);

  const setGithubToken = (token: string) => {
    setToken(token);
    localStorage.setItem("githubToken", token);
  };

  return (
    <AnalysisContext.Provider value={{ results, setResults, githubToken, setGithubToken }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error("useAnalysis must be used within an AnalysisProvider");
  }
  return context;
}