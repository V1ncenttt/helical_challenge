"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ConfidenceDistributionProps {
  cellTypes: string[]
  umapData: Array<{
    x: number
    y: number
    cellType: string
    id: number
  }>
}

export function ConfidenceDistribution({ cellTypes, umapData }: ConfidenceDistributionProps) {
  // Generate mock confidence scores for each cell type
  const confidenceData = useMemo(() => {
    return cellTypes.map((cellType, index) => {
      const cellsOfType = umapData.filter((d) => d.cellType === cellType)

      // Generate realistic confidence scores (higher for some cell types)
      const baseConfidence = 0.7 + Math.sin(index) * 0.2
      const confidenceScores = cellsOfType.map(() => {
        return Math.max(0.3, Math.min(0.99, baseConfidence + (Math.random() - 0.5) * 0.4))
      })

      const avgConfidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length
      const minConfidence = Math.min(...confidenceScores)
      const maxConfidence = Math.max(...confidenceScores)

      // Create histogram bins
      const bins = Array(10).fill(0)
      confidenceScores.forEach((score) => {
        const binIndex = Math.min(9, Math.floor(score * 10))
        bins[binIndex]++
      })

      return {
        cellType,
        count: cellsOfType.length,
        avgConfidence,
        minConfidence,
        maxConfidence,
        bins,
        color: `hsl(${(index * 360) / cellTypes.length}, 70%, 60%)`,
      }
    })
  }, [cellTypes, umapData])

  const maxBinValue = Math.max(...confidenceData.flatMap((d) => d.bins))

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-black border border-white/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">
              {(
                (confidenceData.reduce((sum, d) => sum + d.avgConfidence * d.count, 0) / umapData.length) *
                100
              ).toFixed(1)}
              %
            </div>
            <div className="text-sm text-gray-400">Average Confidence</div>
          </CardContent>
        </Card>
        <Card className="bg-black border border-white/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">
              {(Math.min(...confidenceData.map((d) => d.minConfidence)) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400">Minimum Confidence</div>
          </CardContent>
        </Card>
        <Card className="bg-black border border-white/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">
              {(Math.max(...confidenceData.map((d) => d.maxConfidence)) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400">Maximum Confidence</div>
          </CardContent>
        </Card>
      </div>

      {/* Confidence Distribution by Cell Type */}
      <Card className="bg-black border border-white/20">
        <CardHeader className="border-b border-white/20">
          <CardTitle className="text-white">Confidence Distribution by Cell Type</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {confidenceData.map((data) => (
              <div key={data.cellType} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: data.color }} />
                    <span className="font-medium text-white">{data.cellType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-black text-white border border-white/20">
                      Avg: {(data.avgConfidence * 100).toFixed(1)}%
                    </Badge>
                    <Badge className="bg-white text-black border-white">{data.count} cells</Badge>
                  </div>
                </div>

                {/* Histogram */}
                <div className="flex items-end gap-1 h-16 bg-black border border-white/20 rounded p-2">
                  {data.bins.map((count, binIndex) => (
                    <div
                      key={binIndex}
                      className="flex-1 rounded-sm transition-all duration-300 hover:opacity-80"
                      style={{
                        height: `${(count / maxBinValue) * 100}%`,
                        backgroundColor: data.color,
                        minHeight: count > 0 ? "4px" : "0px",
                      }}
                      title={`${binIndex * 10}-${(binIndex + 1) * 10}%: ${count} cells`}
                    />
                  ))}
                </div>

                {/* Confidence range labels */}
                <div className="flex justify-between text-xs text-gray-400">
                  <span>30%</span>
                  <span>50%</span>
                  <span>70%</span>
                  <span>90%</span>
                  <span>100%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assignment Quality */}
      <Card className="bg-black border border-white/20">
        <CardHeader className="border-b border-white/20">
          <CardTitle className="text-white">Assignment Quality</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-black border border-white/20">
              <span className="text-gray-400">High Confidence Cells</span>
              <Badge className="bg-white text-black border-white">
                {Math.round(confidenceData.reduce((sum, d) => sum + d.count, 0) * 0.73)}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-black border border-white/20">
              <span className="text-gray-400">Medium Confidence Cells</span>
              <Badge className="bg-black text-white border border-white/20">
                {Math.round(confidenceData.reduce((sum, d) => sum + d.count, 0) * 0.15)}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-black border border-white/20">
              <span className="text-gray-400">Low Confidence Cells</span>
              <Badge className="bg-black text-white border border-white/20">
                {Math.round(confidenceData.reduce((sum, d) => sum + d.count, 0) * 0.12)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
