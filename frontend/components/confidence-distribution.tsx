"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ConfidenceDistributionProps {
  confidenceStats: {
    average: number
    min: number
    max: number
    breakdown?: {
      high?: number
      medium?: number
      low?: number
    }
  }
  confidenceHistograms: Record<string, number[]>
  confidenceAverages: Record<string, number>
  cellTypeDistribution: Record<string, number>
}

export function ConfidenceDistribution({
  confidenceStats,
  confidenceHistograms,
  confidenceAverages,
  cellTypeDistribution,
  confidenceBreakdown
}: ConfidenceDistributionProps) {
  const confidenceData = useMemo(() => {
    if (!cellTypeDistribution) return []
    const cellTypes = Object.keys(cellTypeDistribution)
    return cellTypes.map((cellType, index) => {
      const binsObj = confidenceHistograms?.[cellType] || {}
      const bins = Object.values(binsObj)
      const avgConfidence = confidenceAverages?.[cellType] || 0
      const count = cellTypeDistribution?.[cellType] || 0
      const minConfidence = 0.3 // placeholder
      const maxConfidence = 0.99 // placeholder

      return {
        cellType,
        count,
        avgConfidence,
        minConfidence,
        maxConfidence,
        bins,
        color: `hsl(${(index * 360) / cellTypes.length}, 70%, 60%)`,
      }
    })
  }, [cellTypeDistribution, confidenceHistograms, confidenceAverages])

  const maxBinValue = Math.max(...confidenceData.flatMap((d) => d.bins))

  
  const highConfidence = confidenceBreakdown.high || 0
  const mediumConfidence = confidenceBreakdown.medium || 0
  const lowConfidence = confidenceBreakdown.low || 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-black border border-white/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{(confidenceStats.average * 100).toFixed(1)}%</div>
            <div className="text-sm text-gray-400">Average Confidence</div>
          </CardContent>
        </Card>
        <Card className="bg-black border border-white/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{(confidenceStats.min * 100).toFixed(1)}%</div>
            <div className="text-sm text-gray-400">Minimum Confidence</div>
          </CardContent>
        </Card>
        <Card className="bg-black border border-white/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{(confidenceStats.max * 100).toFixed(1)}%</div>
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
                  <span>0%</span>
                  {/* <span>10%</span> */}
                  <span>20%</span>
                  {/* <span>30%</span> */}
                  <span>40%</span>
                  {/* <span>50%</span> */}
                  <span>60%</span>
                  {/* <span>70%</span> */}
                  <span>80%</span>
                  {/* <span>90%</span> */}
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
              <Badge className="bg-white text-black border-white">{highConfidence}</Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-black border border-white/20">
              <span className="text-gray-400">Medium Confidence Cells</span>
              <Badge className="bg-black text-white border border-white/20">{mediumConfidence}</Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-black border border-white/20">
              <span className="text-gray-400">Low Confidence Cells</span>
              <Badge className="bg-black text-white border border-white/20">{lowConfidence}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
