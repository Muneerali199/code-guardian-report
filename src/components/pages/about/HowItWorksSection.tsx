import React, { useState } from "react";
import {
  FileCode,
  Shield,
  Brain,
  BarChart3,
  Code2,
  Share2,
  Cpu,
  Terminal,
  Activity,
  GitBranch,
  Network,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_VERSION_WITH_PREFIX } from "@/utils/version";

interface AnalysisNode {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
  metrics: string[];
}

export const HowItWorksSection: React.FC = () => {
  const [activeNode, setActiveNode] = useState<string>("ingest");

  const nodes: AnalysisNode[] = [
    {
      id: "ingest",
      title: "MODULE_01: INGESTION",
      description: "Binary analysis & content extraction engine",
      icon: <FileCode className="h-5 w-5" />,
      details: [
        "JSZip streaming extraction",
        "MIME-type heuristic detection",
        "Polyglot language parser",
        "Binary/Text segregation",
        "Directory tree mapping",
      ],
      metrics: [
        "Throughput: >50MB/s",
        "Format Support: 20+",
        "Encoding: Auto-detect",
      ],
    },
    {
      id: "security",
      title: "MODULE_02: THREAT_SCAN",
      description: "Vulnerability heuristics & pattern matching",
      icon: <Shield className="h-5 w-5" />,
      details: [
        "OWASP compliance matrix",
        "CVE signature matching",
        "AST injection detection",
        "Secrets entropy scan",
        "Auth logic analysis",
      ],
      metrics: [
        "False Positives: <5%",
        "Scan Depth: Recursive",
        "Rule Set: Extended",
      ],
    },
    {
      id: "quality",
      title: "MODULE_03: CODE_METRICS",
      description: "Static analysis & complexity computation",
      icon: <Code2 className="h-5 w-5" />,
      details: [
        "Cyclomatic complexity",
        "Halstead metrics",
        "Maintainability index",
        "Duplication fragments",
        "Anti-pattern detection",
      ],
      metrics: [
        "Maintainability: 0-100",
        "Tech Debt: HoursEstimate",
        "Cognitive Load: High/Low",
      ],
    },
    {
      id: "ai",
      title: "MODULE_04: NEURAL_CORE",
      description: "LLM-based pattern recognition & context",
      icon: <Brain className="h-5 w-5" />,
      details: [
        "Context-aware analysis",
        "Semantic understanding",
        "Remediation synthesis",
        "False positive filtering",
        "Predictive risk modeling",
      ],
      metrics: [
        "Model: Specialized",
        "Context Window: 32k",
        "Latency: Optimized",
      ],
    },
    {
      id: "scoring",
      title: "MODULE_05: AGGREGATOR",
      description: "Multi-dimensional scoring algorithm",
      icon: <BarChart3 className="h-5 w-5" />,
      details: [
        "Weighted severity matrix",
        "Exponential penalty logic",
        "Benchmarking engine",
        "Risk velocity calc",
        "Grade classification",
      ],
      metrics: ["Precision: 99.9%", "Dimensions: 5", "Output: JSON/PDF"],
    },
  ];

  return (
    <section className="border-border bg-background relative border-t py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-16 flex flex-col items-center">
          <div className="mb-4 flex items-center gap-2">
            <Network className="text-primary h-4 w-4" />
            <span className="text-primary font-mono text-xs font-bold tracking-widest uppercase">
              Core_Architecture
            </span>
          </div>
          <h2 className="text-center font-mono text-3xl font-bold tracking-tight uppercase lg:text-4xl">
            System Logic Pipeline
          </h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left: Pipeline Visualizer */}
          <div className="relative lg:col-span-5">
            <div className="bg-border absolute top-6 bottom-6 left-6 hidden w-0.5 lg:block" />

            <div className="relative space-y-6">
              {nodes.map((node, index) => (
                <div
                  key={node.id}
                  className={cn(
                    "group relative cursor-pointer pl-12 transition-all duration-300",
                    activeNode === node.id
                      ? "translate-x-2 opacity-100"
                      : "opacity-60 hover:opacity-100"
                  )}
                  onClick={() => setActiveNode(node.id)}
                >
                  {/* Connector Node */}
                  <div
                    className={cn(
                      "border-border bg-background absolute top-6 left-[21px] z-10 h-3 w-3 border transition-colors duration-300",
                      activeNode === node.id
                        ? "bg-primary border-primary"
                        : "group-hover:border-primary"
                    )}
                  />

                  {/* Card */}
                  <div
                    className={cn(
                      "relative overflow-hidden border p-4 transition-all duration-300",
                      activeNode === node.id
                        ? "bg-primary/5 border-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                        : "bg-background border-border group-hover:border-primary/50"
                    )}
                  >
                    {activeNode === node.id && (
                      <div className="from-primary/10 pointer-events-none absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl to-transparent" />
                    )}

                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "border p-2 transition-colors duration-300",
                          activeNode === node.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/10 border-border"
                        )}
                      >
                        {node.icon}
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 font-mono text-[10px] tracking-wider uppercase">
                          0{index + 1} // {node.id.toUpperCase()}
                        </div>
                        <h3
                          className={cn(
                            "font-mono text-sm font-bold tracking-tight uppercase",
                            activeNode === node.id
                              ? "text-primary"
                              : "text-foreground"
                          )}
                        >
                          {node.description}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Detailed Analysis View */}
          <div className="lg:col-span-7">
            <div className="sticky top-24">
              {nodes.map(
                (node) =>
                  activeNode === node.id && (
                    <div
                      key={node.id}
                      className="animate-in fade-in slide-in-from-right-4 duration-300"
                    >
                      <div className="border-border bg-background/50 relative overflow-hidden border backdrop-blur-xl">
                        {/* Tech decorations */}
                        <div className="from-primary absolute top-0 left-0 h-1 w-full bg-gradient-to-r via-transparent to-transparent" />
                        <div className="from-primary/30 absolute right-0 bottom-0 h-1 w-1/3 bg-gradient-to-l to-transparent" />

                        <div className="p-8">
                          {/* Header */}
                          <div className="border-border/50 mb-8 flex items-center justify-between border-b pb-6">
                            <div>
                              <h3 className="text-foreground mb-2 font-mono text-2xl font-bold uppercase">
                                {node.title}
                              </h3>
                              <p className="text-muted-foreground font-mono text-sm">
                                Status:{" "}
                                <span className="animate-pulse text-green-500">
                                  ACTIVE
                                </span>{" "}
                                // Latency: 12ms
                              </p>
                            </div>
                            <Cpu className="text-primary/10 h-12 w-12" />
                          </div>

                          <div className="grid gap-8 md:grid-cols-2">
                            {/* Functionality */}
                            <div>
                              <div className="text-primary mb-4 flex items-center gap-2">
                                <Terminal className="h-4 w-4" />
                                <span className="font-mono text-xs font-bold tracking-wider uppercase">
                                  Logic_Gates
                                </span>
                              </div>
                              <ul className="space-y-3">
                                {node.details.map((detail, idx) => (
                                  <li
                                    key={idx}
                                    className="text-muted-foreground flex items-start gap-3 text-sm"
                                  >
                                    <span className="text-primary/50 mt-0.5 font-mono text-xs">
                                      [{idx.toString().padStart(2, "0")}]
                                    </span>
                                    <span className="text-foreground/90">
                                      {detail}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Metrics Panel */}
                            <div className="bg-muted/5 border-border/50 border p-4">
                              <div className="text-primary mb-4 flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                <span className="font-mono text-xs font-bold tracking-wider uppercase">
                                  Performance_Telemetry
                                </span>
                              </div>
                              <div className="space-y-3">
                                {node.metrics.map((metric, idx) => (
                                  <div key={idx} className="relative pt-2">
                                    <div className="mb-1 flex justify-between font-mono text-xs">
                                      <span className="text-muted-foreground">
                                        {metric.split(":")[0]}
                                      </span>
                                      <span className="text-foreground font-bold">
                                        {metric.split(":")[1]}
                                      </span>
                                    </div>
                                    <div className="bg-muted h-0.5 w-full overflow-hidden">
                                      <div
                                        className="bg-primary h-full"
                                        style={{
                                          width: `${Math.random() * 40 + 60}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Footer / System Status */}
                          <div className="border-border/50 mt-8 flex items-center justify-between border-t pt-6">
                            <div className="flex items-center gap-4">
                              <div className="bg-background border-border flex gap-2 border px-2 py-1">
                                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                                <span className="text-muted-foreground font-mono text-[10px] uppercase">
                                  System_Online
                                </span>
                              </div>
                              <div className="bg-background border-border flex gap-2 border px-2 py-1">
                                <GitBranch className="text-muted-foreground h-3 w-3" />
                                <span className="text-muted-foreground font-mono text-[10px] uppercase">
                                  {APP_VERSION_WITH_PREFIX}
                                </span>
                              </div>
                            </div>
                            <Share2 className="text-muted-foreground hover:text-foreground h-4 w-4 cursor-pointer transition-colors" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
