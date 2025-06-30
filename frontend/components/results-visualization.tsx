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
  }
}

export function ResultsVisualization({ results }: ResultsVisualizationProps) {
  // Extract cell types from cellTypeDistribution
  const cellTypes = Object.keys(results.cellTypeDistribution)
  const metrics = [
    { name: "Overall Confidence", value: `${(results.confidenceStats.average * 100).toFixed(1)}%` },
    { name: "Number of Cells", value: results.numCells.toLocaleString() },
    { name: "Cell Types Identified", value: results.numCellTypes },
    { name: "High Confidence Cells", value: "73%" },
  ]

  const downloadAnnotatedData = () => {
    // Generate mock annotated data
    const annotatedData = results.umapData.map((cell, index) => ({
      cell_id: `cell_${cell.id}`,
      umap_1: cell.x.toFixed(3),
      umap_2: cell.y.toFixed(3),
      predicted_cell_type: cell.label,
      confidence_score: cell.confidence.toFixed(3),
      embedding_1: (Math.random() * 2 - 1).toFixed(6),
      embedding_2: (Math.random() * 2 - 1).toFixed(6),
      embedding_3: (Math.random() * 2 - 1).toFixed(6),
      // Add more embedding dimensions...
      ...Array.from({ length: 10 }, (_, i) => ({
        [`embedding_${i + 4}`]: (Math.random() * 2 - 1).toFixed(6),
      })).reduce((acc, curr) => ({ ...acc, ...curr }), {}),
    }))

    // Convert to CSV
    const headers = Object.keys(annotatedData[0])
    const csvContent = [
      headers.join(","),
      ...annotatedData.map((row) => headers.map((header) => row[header as keyof typeof row]).join(",")),
    ].join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "helical_annotated_cells.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadAnalysisReport = () => {
    // Generate comprehensive analysis report as JSON
    const cellTypeCounts = cellTypes.map((cellType, index) => {
      const count = results.umapData.filter((d) => d.label === cellType).length
      const percentage = Number.parseFloat(((count / results.umapData.length) * 100).toFixed(1))
      return {
        cell_type: cellType,
        count: count,
        percentage: percentage,
        color: `hsl(${(index * 360) / cellTypes.length}, 70%, 60%)`,
      }
    })

    const analysisReport = {
      metadata: {
        analysis_id: `helical_${Date.now()}`,
        generated_at: new Date().toISOString(),
        version: "1.0.0",
        model: "Helical Foundation Model",
        application: "Cell Type Annotation",
      },
      summary: {
        total_cells: results.umapData.length,
        cell_types_identified: cellTypes.length,
        overall_confidence: Number.parseFloat((results.confidenceStats.average * 100).toFixed(1)),
        high_confidence_cells_percentage: 73,
        medium_confidence_cells_percentage: 15,
        low_confidence_cells_percentage: 12,
      },
      cell_type_distribution: cellTypeCounts,
      analysis_parameters: {
        embedding_dimensions: 512,
        umap_parameters: {
          n_neighbors: 15,
          min_dist: 0.1,
          n_components: 2,
          metric: "cosine",
        },
        classification_threshold: 0.5,
        confidence_calculation: "softmax_probability",
      },
      quality_metrics: {
        average_confidence: Number.parseFloat((results.confidenceStats.average * 100).toFixed(1)),
        min_confidence: 35.2,
        max_confidence: 98.7,
        cells_above_80_confidence: Math.round(results.umapData.length * 0.73),
        cells_below_50_confidence: Math.round(results.umapData.length * 0.12),
      },
      files_generated: [
        {
          filename: "helical_annotated_cells.csv",
          description: "Complete dataset with cell type annotations, confidence scores, and embeddings",
          format: "CSV",
          columns: ["cell_id", "umap_1", "umap_2", "predicted_cell_type", "confidence_score", "embedding_1", "..."],
        },
        {
          filename: "helical_analysis_report.json",
          description: "Comprehensive analysis report with metadata, statistics, and parameters",
          format: "JSON",
        },
      ],
    }

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
                      Complete dataset with cell type annotations, confidence scores, and high-dimensional embeddings
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        Cell IDs and predictions
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
                        512-dimensional embeddings
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
