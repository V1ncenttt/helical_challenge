"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Cpu, CheckCircle, XCircle, Loader2, Activity, X, Database } from "lucide-react"
import { cn } from "@/lib/utils"

type JobState = "idle" | "pending" | "embedding" | "classification" | "running_stats" | "success" | "failed"

interface JobStatusProps {
  jobState: JobState
  progress: number
  selectedModel: string
  selectedApplication: string
  onCancel?: () => void
}

const jobStateConfig = {
  idle: {
    icon: Clock,
    label: "Idle",
    description: "Ready to start",
    color: "text-gray-400",
    bgColor: "bg-gray-500/20",
    borderColor: "border-gray-500/30",
  },
  pending: {
    icon: Clock,
    label: "Pending",
    description: "Job is queued and waiting to start",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    borderColor: "border-yellow-500/30",
  },
  embedding: {
    icon: Database,
    label: "Embedding",
    description: "Generating cell embeddings using foundation model",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
  },
  classification: {
    icon: Activity,
    label: "Classification",
    description: "Classifying cells into different types",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/30",
  },
  running_stats: {
    icon: Cpu,
    label: "Running Stats",
    description: "Computing statistics and generating visualizations",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
  },
  success: {
    icon: CheckCircle,
    label: "Success",
    description: "Analysis completed successfully",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/30",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    description: "Analysis encountered an error",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500/30",
  },
}

const getEstimatedTime = (jobState: JobState, progress: number) => {
  switch (jobState) {
    case "pending":
      return "~1-3 minutes"
    case "embedding":
      return "~2-4 minutes"
    case "classification":
      const remaining = Math.max(0, 100 - progress)
      const estimatedMinutes = Math.ceil((remaining / 100) * 3)
      return `~${estimatedMinutes} minutes remaining`
    case "running_stats":
      return "~30-60 seconds"
    case "success":
      return "Complete"
    case "failed":
      return "Failed"
    default:
      return ""
  }
}

export function JobStatus({ jobState, progress, selectedModel, selectedApplication, onCancel }: JobStatusProps) {
  const config = jobStateConfig[jobState]
  const Icon = config.icon
  const isActive = ["pending", "embedding", "classification", "running_stats"].includes(jobState)

  return (
    <Card className={cn("bg-black border transition-all duration-300", config.borderColor)}>
      <CardHeader className="border-b border-white/20">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-white">
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
              {isActive ? (
                <Loader2 className={cn("w-5 h-5 animate-spin", config.color)} />
              ) : (
                <Icon className={cn("w-5 h-5", config.color)} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span>Job Status</span>
                <Badge className={cn("text-xs", config.bgColor, config.color, "border-0")}>{config.label}</Badge>
              </div>
              <p className="text-sm text-gray-400 font-normal mt-1">{config.description}</p>
            </div>
          </CardTitle>
          {isActive && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-gray-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white font-medium">Progress</span>
              <span className="text-sm text-gray-400">{progress}%</span>
            </div>
            <Progress value={progress} className="w-full bg-black border border-white/20" />
          </div>

          {/* Job Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-black border border-white/20">
                <span className="text-sm text-gray-400">Model:</span>
                <Badge className="bg-white text-black border-white text-xs">{selectedModel}</Badge>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-black border border-white/20">
                <span className="text-sm text-gray-400">Application:</span>
                <Badge className="bg-black text-white border border-white/20 text-xs">{selectedApplication}</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-black border border-white/20">
                <span className="text-sm text-gray-400">Estimated Time:</span>
                <span className="text-sm text-white font-medium">{getEstimatedTime(jobState, progress)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-black border border-white/20">
                <span className="text-sm text-gray-400">Status:</span>
                <span className="text-sm text-white font-medium">
                  {jobState === "pending" && "Queued"}
                  {jobState === "embedding" && "Processing"}
                  {jobState === "classification" && "Analyzing"}
                  {jobState === "running_stats" && "Finalizing"}
                  {jobState === "success" && "Complete"}
                  {jobState === "failed" && "Error"}
                </span>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          <div className={cn("p-4 rounded-lg border", config.bgColor, config.borderColor)}>
            <div className="flex items-start gap-3">
              <Icon className={cn("w-5 h-5 mt-0.5", config.color)} />
              <div>
                <h4 className={cn("font-medium", config.color)}>{config.label}</h4>
                <p className="text-sm text-gray-300 mt-1">
                  {jobState === "pending" && "Your job is in the queue waiting for available compute resources."}
                  {jobState === "embedding" &&
                    "Generating high-dimensional embeddings from your cell data using the foundation model."}
                  {jobState === "classification" && "Classifying cells into different types based on their embeddings."}
                  {jobState === "running_stats" && "Computing confidence scores and generating visualizations."}
                  {jobState === "success" && "Your analysis is complete! Check the Results tab to view your findings."}
                  {jobState === "failed" &&
                    "Something went wrong during the analysis. Please try again or contact support."}
                </p>
              </div>
            </div>
          </div>

          {/* Real-time Updates */}
          {isActive && (
            <div className="text-xs text-gray-400 text-center">
              <div className="flex items-center justify-center gap-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
                <span>Live updates • Last updated just now</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
