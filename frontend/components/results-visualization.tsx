"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UMAPPlot } from "@/components/umap-plot"
import { ConfidenceDistribution } from "@/components/confidence-distribution"
import { BarChart3, ScatterChartIcon as Scatter, TrendingUp, Download, FileText, Table } from "lucide-react"

interface ResultsVisualizationProps {
  results: {
    workflowId: string
    accuracy: number
    numCells: number
    numCellTypes: number
    cellTypeDistribution: Record<string, number>
    umapData: Array<{
      x: number
      y: number
      label: string
      confidence: number
      id: number
    }>
    confidenceHistograms: Record<string, number[]>
    confidenceAverages: Record<string, number>
    confidenceStats: {
      average: number
      min: number
      max: number
    }
    confidenceBreakdown: {
      high: number
      medium: number
      low: number
    }
  }
}

export function ResultsVisualization({ results }: ResultsVisualizationProps) {
  if (
    !results ||
    !results.cellTypeDistribution ||
    !results.confidenceStats ||
    !results.umapData ||
    !results.confidenceHistograms ||
    !results.confidenceAverages
  ) {
    return <div className="text-white">No results data available.</div>;
  }

  // Extract cell types from cellTypeDistribution
  const cellTypes = Object.keys(results.cellTypeDistribution)
  const metrics = [
    { name: "Overall Confidence", value: `${(results.confidenceStats.average * 100).toFixed(1)}%` },
    { name: "Number of Cells", value: results.numCells.toLocaleString() },
    { name: "Cell Types Identified", value: results.numCellTypes },
    { name: "High Confidence Cells", value: `${results.confidenceBreakdown.high}` },
  ]

  const downloadAnnotatedData = async () => {
    try {
      const response = await fetch(`http://localhost:8000/download/${results.workflowId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch annotated dataset.");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "helical_annotated_cells.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const downloadAnalysisReport = () => {
    // Directly serialize the results object as the analysis report
    const analysisReport = results;
    const jsonContent = JSON.stringify(analysisReport, null, 2)
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "helical_analysis_report.json")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.name} className="bg-black border border-white/20">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white">{metric.value}</div>
              <div className="text-sm text-gray-400">{metric.name}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Results */}
      <Card className="bg-black border border-white/20">
        <CardHeader className="border-b border-white/20">
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="w-5 h-5" />
            Analysis Results
          </CardTitle>
          <CardDescription className="text-gray-400">
            Detailed visualization and metrics from your cell classification analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="umap" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-black border border-white/20">
              <TabsTrigger
                value="umap"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-black text-white border-r border-white/20 last:border-r-0"
              >
                <Scatter className="w-4 h-4" />
                UMAP Plot
              </TabsTrigger>
              <TabsTrigger
                value="confidence"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-black text-white"
              >
                <TrendingUp className="w-4 h-4" />
                Confidence Scores
              </TabsTrigger>
            </TabsList>

            <TabsContent value="umap" className="mt-6">
              <UMAPPlot data={results.umapData} cellTypes={cellTypes} />
            </TabsContent>

            <TabsContent value="confidence" className="mt-6">
              <ConfidenceDistribution
                confidenceStats={results.confidenceStats}
                cellTypeDistribution={results.cellTypeDistribution}
                confidenceHistograms={results.confidenceHistograms}
                confidenceAverages={results.confidenceAverages}
                confidenceBreakdown={results.confidenceBreakdown}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Cell Type Distribution */}
      <Card className="bg-black border border-white/20">
        <CardHeader className="border-b border-white/20">
          <CardTitle className="text-white">Cell Type Distribution</CardTitle>
          <CardDescription className="text-gray-400">
            Distribution of identified cell types in your dataset
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {results.cellTypeDistribution &&
              Object.entries(results.cellTypeDistribution).map(([cellType, count], index) => {
                const percentage = ((count / results.numCells) * 100).toFixed(1)
                return (
                  <div
                    key={cellType}
                    className="flex items-center justify-between p-3 rounded-lg bg-black border border-white/20"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{
                          backgroundColor: `hsl(${(index * 360) / Object.keys(results.cellTypeDistribution).length}, 70%, 60%)`,
                        }}
                      />
                      <span className="font-medium text-white">{cellType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-black text-white border border-white/20">{count} cells</Badge>
                      <Badge className="bg-white text-black border-white">{percentage}%</Badge>
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      {/* Download Section */}
      <Card className="bg-black border border-white/20">
        <CardHeader className="border-b border-white/20">
          <CardTitle className="flex items-center gap-2 text-white">
            <Download className="w-5 h-5" />
            Download Results
          </CardTitle>
          <CardDescription className="text-gray-400">
            Export your analysis results for further analysis and record keeping
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Annotated Dataset */}
            <Card className="bg-black border border-white/20 hover:bg-white/5 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-white/10">
                    <Table className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-2">Annotated Dataset</h4>
                    <p className="text-sm text-gray-400 mb-4">
                      Complete dataset with cell type annotations, confidence scores, and umap coordinates
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        Cell IDs 
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        UMAP coordinates (X, Y)
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        Confidence scores
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        Cell type annotations
                      </div>
                    </div>
                    <Button
                      onClick={downloadAnnotatedData}
                      className="w-full bg-white text-black hover:bg-gray-200 border border-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Report */}
            <Card className="bg-black border border-white/20 hover:bg-white/5 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-white/10">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-2">Analysis Report</h4>
                    <p className="text-sm text-gray-400 mb-4">
                      Comprehensive analysis report with metadata, statistics, parameters, and quality metrics
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        Summary statistics
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        Cell type distribution
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        Analysis parameters
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        Quality metrics
                      </div>
                    </div>
                    <Button
                      onClick={downloadAnalysisReport}
                      className="w-full bg-black text-white border border-white/20 hover:bg-white/10 hover:border-white/50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download JSON
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
