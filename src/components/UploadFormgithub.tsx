// src/components/UploadForm.tsx
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function UploadForm() {
  const [githubUrl, setGithubUrl] = useState("");
  
  const handleGithubSubmit = async () => {
    try {
      // Extract owner and repo from URL
      const { owner, repo } = parseGithubUrl(githubUrl);
      
      // Download and analyze repo
      const analysisResults = await analyzeGithubRepo(owner, repo);
      
      // Process results as you currently do with ZIP files
    } catch (error) {
      // Handle errors
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing ZIP upload */}
      
      {/* New GitHub integration */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-2">Or analyze a GitHub repository:</h3>
        <div className="flex gap-2">
          <Input
            placeholder="https://github.com/owner/repo"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
          />
          <Button onClick={handleGithubSubmit}>Analyze</Button>
        </div>
      </div>
    </div>
  );
}