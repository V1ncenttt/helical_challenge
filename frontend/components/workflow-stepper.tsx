import { Check, Database, Brain, Target, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface WorkflowStepperProps {
  currentStep: "data" | "model" | "application" | "results"
}

const steps = [
  { id: "data", name: "Select Data", icon: Database },
  { id: "model", name: "Choose Model", icon: Brain },
  { id: "application", name: "Select Application", icon: Target },
  { id: "results", name: "View Results", icon: BarChart3 },
]

export function WorkflowStepper({ currentStep }: WorkflowStepperProps) {
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep)

  return (
    <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
      {steps.map((step, index) => {
        const Icon = step.icon
        const isCompleted = index < currentStepIndex
        const isCurrent = index === currentStepIndex
        const isUpcoming = index > currentStepIndex

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
                  {
                    "bg-white border-white text-black": isCompleted,
                    "bg-white border-white text-black": isCurrent,
                    "bg-black border-white/20 text-gray-400": isUpcoming,
                  },
                )}
              >
                {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
              </div>
              <span
                className={cn("mt-2 text-sm font-medium", {
                  "text-white": isCompleted || isCurrent,
                  "text-gray-400": isUpcoming,
                })}
              >
                {step.name}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn("flex-1 h-0.5 mx-4 transition-all duration-300", {
                  "bg-white": index < currentStepIndex,
                  "bg-white/20": index >= currentStepIndex,
                })}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
