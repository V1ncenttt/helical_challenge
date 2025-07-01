"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, Zap, Star, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModelSelectorProps {
  selectedModel: { id: number; name: string } | null
  onModelSelect: (model: { id: number; name: string }) => void
}

export function ModelSelector({ selectedModel, onModelSelect }: ModelSelectorProps) {
  const [models, setModels] = useState<any[]>([])

  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch("http://localhost:8000/models") // Adjust endpoint if needed
        const data = await res.json()
        // Print the fetched data to console for debugging
        console.log("Fetched models:", data)
        setModels(data.models)
      } catch (error) {
        console.error("Failed to fetch models:", error)
      }
    }
    fetchModels()
  }, [])

  return (
    <Card className="bg-black border border-white/20">
      <CardHeader className="border-b border-white/20">
        <CardTitle className="flex items-center gap-2 text-white">
          <Brain className="w-5 h-5" />
          Choose a Helical Model
        </CardTitle>
        <CardDescription className="text-gray-400">
          Select a pre-trained foundation model for your cell classification task
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {models.map((model) => (
            <Card
              key={model.id}
              className={cn(
                "cursor-pointer transition-all duration-300 hover:shadow-md bg-black border",
                selectedModel?.id === model.id
                  ? "ring-2 ring-white border-white bg-white/5"
                  : "border-white/20 hover:bg-white/5 hover:border-white/50",
              )}
              onClick={() => onModelSelect(model)}
            >
              <CardHeader className="pb-3 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    {model.name}
                    {!!model.recommended && (
                      <Badge className="bg-white text-black border-white">
                        <Star className="w-3 h-3 mr-1" />
                        Recommended
                      </Badge>
                    )}
                  </CardTitle>
                </div>
                <CardDescription className="text-sm text-gray-400">{model.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-white">
                      <Zap className="w-4 h-4" />
                      <span>{model.accuracy.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-1 text-white">
                      <Clock className="w-4 h-4" />
                      <span>{model.speed.charAt(0).toUpperCase() + model.speed.slice(1)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {model.attributes?.map((feature: string) => (
                    <Badge key={feature} className="text-xs bg-black text-white border border-white/20">
                      {feature}
                    </Badge>
                  ))}
                </div>
                <Button
                  className={cn(
                    "w-full transition-all duration-300 font-medium",
                    selectedModel?.id === model.id
                      ? "bg-white text-black hover:bg-gray-200 border border-white"
                      : "bg-black text-white border border-white/20 hover:bg-white/10 hover:border-white/50",
                  )}
                  size="sm"
                >
                  {selectedModel?.id === model.id ? "Selected" : "Select Model"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
