"use client"

import { useState } from "react"
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
    setAnalysisState((prev) => ({ ...prev, isProcessing: true, jobState: "pending", jobProgress: 0 }))

    // Simulate job pending
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setAnalysisState((prev) => ({ ...prev, jobState: "embedding", jobProgress: 20 }))

    // Simulate embedding
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setAnalysisState((prev) => ({ ...prev, jobState: "classification", jobProgress: 60 }))

    // Simulate classification
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setAnalysisState((prev) => ({ ...prev, jobState: "running_stats", jobProgress: 85 }))

    // Simulate running stats
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock results
    const mockResults = {
      accuracy: 0.92,
      cellTypes: ["T-cells", "B-cells", "NK cells", "Monocytes", "Dendritic cells"],
      confusionMatrix: [
        [85, 3, 2, 1, 0],
        [2, 78, 1, 2, 1],
        [1, 0, 67, 3, 2],
        [0, 1, 2, 89, 1],
        [1, 0, 1, 2, 71],
      ],
      umapData: Array.from({ length: 500 }, (_, i) => ({
        x: Math.random() * 20 - 10,
        y: Math.random() * 20 - 10,
        cellType: ["T-cells", "B-cells", "NK cells", "Monocytes", "Dendritic cells"][Math.floor(Math.random() * 5)],
        id: i,
      })),
    }

    setAnalysisState((prev) => ({
      ...prev,
      isProcessing: false,
      jobState: "success",
      jobProgress: 100,
      results: mockResults,
    }))
    setCurrentStep("results")
  }

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

        {/* Job Status - Show when processing */}
        {analysisState.isProcessing && (
          <div className="mt-8">
            <JobStatus
              jobState={analysisState.jobState}
              progress={analysisState.jobProgress}
              selectedModel={analysisState.selectedModel}
              selectedApplication={analysisState.selectedApplication}
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
                        {analysisState.results.cellTypes.length}
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
                      <div className="text-2xl font-bold text-white">{analysisState.results.umapData.length}</div>
                      <div className="text-sm text-gray-400 font-medium">Cells Analyzed</div>
                    </div>
                    <div className="p-4 rounded-lg bg-black border border-white/20">
                      <div className="text-2xl font-bold text-white">{analysisState.results.cellTypes.length}</div>
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
