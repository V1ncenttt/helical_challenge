"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Target, FileText, Beaker, GitBranch } from "lucide-react"
import { cn } from "@/lib/utils"

interface ApplicationSelectorProps {
  selectedApplicationId: number | null;
  onApplicationSelect: (application: { id: number; name: string }) => void;
}

export function ApplicationSelector({ selectedApplicationId, onApplicationSelect }: ApplicationSelectorProps) {
  const [applications, setApplications] = useState<any[]>([])

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch("http://localhost:8000/applications")  // adjust URL as needed
        const data = await response.json()
        // Print the fetched data to console for debugging
        console.log("Fetched applications:", data)
        setApplications(data.applications) // assuming backend returns { applications: [...] }
      } catch (error) {
        console.error("Failed to fetch applications:", error)
      }
    }

    fetchApplications()
  }, [])

  return (
    <Card className="bg-black border border-white/20">
      <CardHeader className="border-b border-white/20">
        <CardTitle className="flex items-center gap-2 text-white">
          <Target className="w-5 h-5" />
          Select Application
        </CardTitle>
        <CardDescription className="text-gray-400">
          Choose the type of analysis you want to perform on your data
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {applications.map((app) => {
            const Icon = { Target, FileText, Beaker, GitBranch }[app.icon as keyof typeof import("lucide-react")] || Target
            return (
              <Card
                key={app.id}
                className={cn(
                  "cursor-pointer transition-all duration-300 hover:shadow-md bg-black border",
                  selectedApplicationId === app.id
                    ? "ring-2 ring-white border-white bg-white/5"
                    : "border-white/20 hover:bg-white/5 hover:border-white/50",
                )}
                onClick={() => onApplicationSelect({ id: app.id, name: app.name })}
              >
                <CardHeader className="pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <Icon className="w-6 h-6 text-white" />
                    <div>
                      <CardTitle className="text-lg text-white">{app.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {app.isNew && <Badge className="bg-white text-black border-white text-xs">New</Badge>}
                        <span className="text-xs text-gray-400">{app.duration}</span>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-sm mt-2 text-gray-400">{app.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-white mb-1">Outputs:</h4>
                      <div className="flex flex-wrap gap-1">
                        {app.attributes.map((output) => (
                          <Badge key={output} className="text-xs bg-black text-white border border-white/20">
                            {output}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      className={cn(
                        "w-full transition-all duration-300 font-medium",
                        selectedApplicationId === app.id
                          ? "bg-white text-black hover:bg-gray-200 border border-white"
                          : "bg-black text-white border border-white/20 hover:bg-white/10 hover:border-white/50",
                      )}
                      size="sm"
                    >
                      {selectedApplicationId === app.id ? "Selected" : "Select Application"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
