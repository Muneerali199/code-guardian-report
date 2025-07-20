import { useState, Suspense, lazy } from 'react';
import { PageLayout } from '@/components/layouts/PageLayout';
import { HomeHero } from '@/components/pages/home/HomeHero';
import { AnalysisTabs } from '@/components/pages/home/AnalysisTabs';
import { StorageBanner } from '@/components/pages/home/StorageBanner';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useAnalysis } from '@/components/context/AnalysisContext';
import { GithubRepoInput } from '@/components/github/GithubRepoInput';
import { GithubRepoInfo } from '@/components/github/GithubRepoInfo';
import { GithubFileTree } from '@/components/github/GithubFileTree';
import { analysisStorage } from '@/services/analysisStorage';
import type { AnalysisResults, StoredAnalysisData } from '@/types/analysis-result';

// Lazy load heavy components
const FloatingChatBot = lazy(() => import('@/components/FloatingChatBot'));
const StorageStatus = lazy(() => import('@/components/StorageStatus'));
const AnalysisHistoryModal = lazy(() => import('@/components/AnalysisHistoryModal'));

const Index = () => {
  const [currentTab, setCurrentTab] = useState<'upload' | 'results'>('upload');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showStorageStatus, setShowStorageStatus] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { results, setResults } = useAnalysis();
  
  // Get current analysis from storage
  const currentAnalysis = analysisStorage.getCurrentAnalysis();
  const hasStoredData = analysisStorage.hasStoredAnalysis();
  const storageStats = analysisStorage.getStorageStats();

  const handleFileSelect = (file: File) => {
    setSelectedFiles([file]);
    setCurrentTab('upload');
  };

  const handleAnalysisComplete = (results: AnalysisResults) => {
    const virtualFile = new File(
      [""], 
      results.metadata?.source === 'github' 
        ? `${results.metadata.owner}_${results.metadata.repo}.zip` 
        : "analysis_results.json", 
      { type: "application/json" }
    );
    
    analysisStorage.storeAnalysisResults(results, virtualFile);
    setResults(results);
    setIsRedirecting(true);
    setCurrentTab('results');
  };

  const handleClearStoredData = () => {
    analysisStorage.clearCurrentAnalysis();
    setResults(null);
    setSelectedFiles([]);
  };

  const handleExportAnalysis = () => {
    return analysisStorage.exportAnalysis();
  };

  const handleImportAnalysis = (data: string) => {
    analysisStorage.importAnalysis(data);
  };

  const handleOptimizeStorage = async () => {
    await analysisStorage.optimizeStorage();
  };

  const handleRestoreFromHistory = (analysis: StoredAnalysisData) => {
    analysisStorage.importAnalysis(JSON.stringify(analysis));
    setResults(analysis.results);
    setShowHistoryModal(false);
    setCurrentTab('results');
  };

  const handleStartAnalysis = () => {
    setCurrentTab('upload');
  };

  const isNewFile = selectedFiles.length > 0 && currentAnalysis 
    ? currentAnalysis.fileName !== selectedFiles[0].name
    : true;

  // Type guard to ensure results is valid before passing to components
  const getValidResults = (): AnalysisResults | null => {
    if (results && 'securityIssues' in results) {
      return results;
    }
    if (currentAnalysis?.results && 'securityIssues' in currentAnalysis.results) {
      return currentAnalysis.results;
    }
    return null;
  };

  const validResults = getValidResults();

  return (
    <PageLayout isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}>
      <HomeHero onStartAnalysis={handleStartAnalysis} />

      <StorageBanner
        hasStoredData={hasStoredData}
        storedAnalysis={currentAnalysis}
        isNewFile={isNewFile}
        showStorageStatus={showStorageStatus}
        storageStats={storageStats}
        onToggleStorageStatus={() => setShowStorageStatus(!showStorageStatus)}
      />

      {showStorageStatus && (
        <div className="max-w-6xl mx-auto mb-6">
          <Suspense fallback={<div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>}>
            <StorageStatus
              hasStoredData={hasStoredData}
              storedAnalysis={currentAnalysis}
              storageStats={storageStats}
              onClearData={handleClearStoredData}
              onExportAnalysis={handleExportAnalysis}
              onImportAnalysis={handleImportAnalysis}
              onOptimizeStorage={handleOptimizeStorage}
              onShowHistory={() => setShowHistoryModal(true)}
            />
          </Suspense>
        </div>
      )}

      <div className="max-w-6xl mx-auto mb-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or analyze from
            </span>
          </div>
        </div>
        <div className="mt-4">
          <GithubRepoInput onAnalysisComplete={handleAnalysisComplete} />
        </div>
      </div>

      <AnalysisTabs
        currentTab={currentTab}
        onTabChange={(tab: string) => setCurrentTab(tab as 'upload' | 'results')}
        analysisResults={validResults}
        onFileSelect={handleFileSelect}
        onAnalysisComplete={handleAnalysisComplete}
        isRedirecting={isRedirecting}
      />

      {validResults?.metadata?.source === 'github' && (
        <div className="max-w-6xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <GithubRepoInfo metadata={validResults.metadata} />
            <GithubFileTree 
              files={validResults.files || []} 
              onFileSelect={(file) => console.log('Selected file:', file.path)}
            />
          </div>
          <div className="lg:col-span-3">
            {/* Analysis results display */}
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        <AnalysisHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          history={analysisStorage.getAnalysisHistory()}
          onRestoreAnalysis={handleRestoreFromHistory}
        />
      </Suspense>

      <Suspense fallback={null}>
        {validResults && <FloatingChatBot analysisResults={validResults} />}
      </Suspense>
    </PageLayout>
  );
};

export default Index;