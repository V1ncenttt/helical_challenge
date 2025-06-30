"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUpload } from "@/components/file-upload"
import { ModelSelector } from "@/components/model-selector"
import { ApplicationSelector } from "@/components/application-selector"
import { ResultsVisualization } from "@/components/results-visualization"
import { WorkflowStepper } from "@/components/workflow-stepper"
import { JobStatus } from "@/components/job-status"
import { Brain, Database, Target, BarChart3 } from "lucide-react"

type WorkflowStep = "data" | "model" | "application" | "results"
type JobState = "idle" | "pending" | "embedding" | "classification" | "running_stats" | "success" | "failed"

interface AnalysisState {
  file: File | null
  selectedModel: string
  selectedApplication: string
  isProcessing: boolean
  jobState: JobState
  jobProgress: number
  results: any
  workflowId: string | null
}

export default function Dashboard() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("data")
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    file: null,
    selectedModel: "",
    selectedApplication: "",
    isProcessing: false,
    jobState: "idle",
    jobProgress: 0,
    results: null,
    workflowId: null,
  })

  const handleFileUpload = (file: File) => {
    setAnalysisState((prev) => ({ ...prev, file }))
    setCurrentStep("model")
  }

  const handleModelSelect = (model: string) => {
    setAnalysisState((prev) => ({ ...prev, selectedModel: model }))
    setCurrentStep("application")
  }

  const handleApplicationSelect = (application: string) => {
    setAnalysisState((prev) => ({ ...prev, selectedApplication: application }))
  }

  const runAnalysis = async () => {
    setAnalysisState((prev) => ({ ...prev, isProcessing: true, jobProgress: 0 }));

    try {
      const res = await fetch("http://localhost:8000/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          upload_id: "5b9178d0-6eeb-40ea-aaaa-66599d0bdfdc", // adjust if a true upload ID is used
          model: 1,
          application: 1,
        }),
      });

      const data = await res.json();
      const workflowId = data.workflow_id;

      setAnalysisState((prev) => ({
        ...prev,
        workflowId,
      }));
    } catch (err) {
      console.error("Failed to submit job", err);
      setAnalysisState((prev) => ({ ...prev, isProcessing: false, jobState: "failed" }));
    }
  }

  const convertToJobState = (status: string, info: any): JobState => {
    if (status === "SUCCESS") return "success"
    if (status === "PROGRESS" || status === "PENDING") {
      switch (info?.stage?.toUpperCase()) {
        case "EMBEDDING":
          return "embedding"
        case "CLASSIFICATION":
          return "classification"
        case "RUNNING STATS":
          return "running_stats"
        default:
          return "pending"
      }
    }
    return "failed"
  }

  useEffect(() => {
    if (analysisState.isProcessing && analysisState.workflowId) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:8000/status/${analysisState.workflowId}`);
          const data = await res.json();
          const jobState = convertToJobState(data.status, data.info);
          console.log("Job status update:", jobState);

          if (jobState === "success") {
            clearInterval(interval);

            try {
              const resultRes = await fetch(`http://localhost:8000/result/${analysisState.workflowId}`);
              const resultData = await resultRes.json();
              console.log("Result data:", resultData);
              setCurrentStep("results");
              setAnalysisState((prev) => ({
                ...prev,
                isProcessing: false,
                jobState,
                jobProgress: 100,
                results: {
                  accuracy: resultData.summary.confidence_stats.average,
                  cellTypes: Object.keys(resultData.cell_type_distribution),
                  umapData: resultData.umap || [],
                  numCells: resultData.summary.num_cells_analysed,
                  numCellTypes: resultData.summary.num_cell_types
                }
              }));
            } catch (error) {
              console.error("Failed to fetch results:", error);
              setAnalysisState((prev) => ({
                ...prev,
                isProcessing: false,
                jobState: "failed"
              }));
            }
          } else {
            setAnalysisState((prev) => ({
              ...prev,
              jobState
            }));
          }
        } catch (err) {
          console.error("Error polling job status:", err);
        }
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(interval);
    }
  }, [analysisState.isProcessing, analysisState.workflowId]);

  const canProceed = () => {
    switch (currentStep) {
      case "data":
        return !!analysisState.file
      case "model":
        return !!analysisState.selectedModel
      case "application":
        return !!analysisState.selectedApplication
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Helical App</h1>
          <p className="text-lg text-gray-400">Upload your cell data and run state-of-the-art classification models</p>
        </div>

        {/* Workflow Stepper */}
        <WorkflowStepper currentStep={currentStep} />

        {/* Job Status - Show when processing and workflowId is set */}
        {analysisState.isProcessing && analysisState.workflowId && (
          <div className="mt-8">
            {/* Map backend status/info to JobState for JobStatus */}
            <JobStatus
              workflowId={analysisState.workflowId}
              selectedModel={analysisState.selectedModel}
              selectedApplication={analysisState.selectedApplication}
              jobState={analysisState.jobState}
              onComplete={() => {
                setCurrentStep("results")
                setAnalysisState((prev) => ({
                  ...prev,
                  isProcessing: false,
                  jobState: "success",
                  jobProgress: 100,
                  results: {} // placeholder until real results are fetched
                }))
              }}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Left Panel - Workflow Steps */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={currentStep} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-black border border-white/20">
                <TabsTrigger
                  value="data"
                  disabled={currentStep !== "data"}
                  className="data-[state=active]:bg-white data-[state=active]:text-black text-white border-r border-white/20 last:border-r-0"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Data
                </TabsTrigger>
                <TabsTrigger
                  value="model"
                  disabled={currentStep !== "model"}
                  className="data-[state=active]:bg-white data-[state=active]:text-black text-white border-r border-white/20 last:border-r-0"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Model
                </TabsTrigger>
                <TabsTrigger
                  value="application"
                  disabled={currentStep !== "application"}
                  className="data-[state=active]:bg-white data-[state=active]:text-black text-white border-r border-white/20 last:border-r-0"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Application
                </TabsTrigger>
                <TabsTrigger
                  value="results"
                  disabled={currentStep !== "results"}
                  className="data-[state=active]:bg-white data-[state=active]:text-black text-white"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Results
                </TabsTrigger>
              </TabsList>

              <TabsContent value="data" className="mt-6">
                <FileUpload onFileUpload={handleFileUpload} />
              </TabsContent>

              <TabsContent value="model" className="mt-6">
                <ModelSelector selectedModel={analysisState.selectedModel} onModelSelect={handleModelSelect} />
              </TabsContent>

              <TabsContent value="application" className="mt-6">
                <ApplicationSelector
                  selectedApplication={analysisState.selectedApplication}
                  onApplicationSelect={handleApplicationSelect}
                />
              </TabsContent>

              <TabsContent value="results" className="mt-6">
                {analysisState.results && <ResultsVisualization results={analysisState.results} />}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Analysis Summary */}
          <div className="space-y-6">
            <Card className="bg-black border border-white/20">
              <CardHeader className="border-b border-white/20">
                <CardTitle className="flex items-center gap-2 text-white">
                  <BarChart3 className="w-5 h-5" />
                  Analysis Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-black border border-white/20">
                    <span className="text-white font-medium">Data File:</span>
                    <Badge
                      variant={analysisState.file ? "default" : "secondary"}
                      className={
                        analysisState.file
                          ? "bg-white text-black border-white"
                          : "bg-black text-white border border-white/20"
                      }
                    >
                      {analysisState.file ? analysisState.file.name : "Not selected"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-black border border-white/20">
                    <span className="text-white font-medium">Model:</span>
                    <Badge
                      variant={analysisState.selectedModel ? "default" : "secondary"}
                      className={
                        analysisState.selectedModel
                          ? "bg-white text-black border-white"
                          : "bg-black text-white border border-white/20"
                      }
                    >
                      {analysisState.selectedModel || "Not selected"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-black border border-white/20">
                    <span className="text-white font-medium">Application:</span>
                    <Badge
                      variant={analysisState.selectedApplication ? "default" : "secondary"}
                      className={
                        analysisState.selectedApplication
                          ? "bg-white text-black border-white"
                          : "bg-black text-white border border-white/20"
                      }
                    >
                      {analysisState.selectedApplication || "Not selected"}
                    </Badge>
                  </div>
                </div>

                {analysisState.results && (
                  <div className="space-y-3 pt-4 border-t border-white/20">
                    <h4 className="font-semibold text-sm text-white">Results Summary</h4>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-black border border-white/20">
                      <span className="text-white font-medium">Accuracy:</span>
                      <Badge className="bg-white text-black border-white">
                        {(analysisState.results.accuracy * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-black border border-white/20">
                      <span className="text-white font-medium">Cell Types:</span>
                      <Badge className="bg-black text-white border border-white/20">
                        {analysisState.results.numCellTypes}
                      </Badge>
                    </div>
                  </div>
                )}

                {currentStep === "application" && canProceed() && !analysisState.isProcessing && (
                  <Button
                    onClick={runAnalysis}
                    className="w-full bg-white text-black hover:bg-gray-200 border border-white"
                    disabled={analysisState.isProcessing}
                  >
                    Run Analysis
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            {analysisState.results && (
              <Card className="bg-black border border-white/20">
                <CardHeader className="border-b border-white/20">
                  <CardTitle className="text-lg text-white">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 rounded-lg bg-black border border-white/20">
                      <div className="text-2xl font-bold text-white">{analysisState.results.numCells}</div>
                      <div className="text-sm text-gray-400 font-medium">Cells Analyzed</div>
                    </div>
                    <div className="p-4 rounded-lg bg-black border border-white/20">
                      <div className="text-2xl font-bold text-white">{analysisState.results.numCellTypes}</div>
                      <div className="text-sm text-gray-400 font-medium">Cell Types</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}