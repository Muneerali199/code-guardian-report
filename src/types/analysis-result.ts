// src/types/analysis-result.ts
export interface AnalysisMetadata {
  source: 'github' | 'local';
  owner?: string;
  repo?: string;
  branch?: string;
  fileCount: number;
  analyzedAt: string;
  toolVersion: string;
  analysisDuration: number;
  repoSize?: number;
  defaultBranch?: string;
  private?: boolean;
  url?: string;
  cloneUrl?: string;
  stars?: number;
  forks?: number;
  lastCommit?: string;
  license?: string;
  topics?: string[];
  visibility?: 'public' | 'private' | 'internal';
}

export interface AnalysisIssue {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  line?: number;
  column?: number;
  ruleId?: string;
  suggestion?: string;
}

export interface AnalysisFile {
  path: string;
  language: string;
  size: number;
  sha?: string;
  encoding?: string;
  issues: AnalysisIssue[];
  complexity?: number;
  dependencies?: string[];
}

export interface AnalysisSummary {
  totalFiles: number;
  totalLines: number;
  totalSize: number;
  languages: Record<string, {
    count: number;
    size: number;
    percentage: number;
  }>;
  issues: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    byType: Record<string, number>;
  };
  security: {
    vulnerabilities: number;
    licenses: Record<string, number>;
  };
  complexity: {
    average: number;
    max: number;
    problematicFiles: number;
  };
}

export interface AnalysisResults {
  summary: AnalysisSummary;
  files: AnalysisFile[];
  metadata: AnalysisMetadata;
  dependencies?: {
    direct: string[];
    indirect: string[];
    outdated: string[];
    vulnerable: string[];
  };
  timeline?: {
    analyzedAt: string;
    duration: number;
  };
  storage?: {
    usage: number;
    quota: number;
    percentage: number;
  };
}