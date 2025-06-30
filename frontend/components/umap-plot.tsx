"use client"

import { useMemo } from "react"

interface UMAPPlotProps {
  data: Array<{
    x: number
    y: number
    cellType: string
    id: number
  }>
  cellTypes: string[]
}

export function UMAPPlot({ data, cellTypes }: UMAPPlotProps) {
  const colorMap = useMemo(() => {
    const colors: Record<string, string> = {}
    cellTypes.forEach((cellType, index) => {
      colors[cellType] = `hsl(${(index * 360) / cellTypes.length}, 70%, 50%)`
    })
    return colors
  }, [cellTypes])

  const { minX, maxX, minY, maxY } = useMemo(() => {
    const xs = data.map((d) => d.x)
    const ys = data.map((d) => d.y)
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    }
  }, [data])

  const normalizeX = (x: number) => ((x - minX) / (maxX - minX)) * 100
  const normalizeY = (y: number) => ((y - minY) / (maxY - minY)) * 100

  return (
    <div className="space-y-4">
      <div className="relative w-full h-96 bg-black rounded-lg border border-white/20 overflow-hidden">
        <svg className="w-full h-full">
          {data.map((point) => (
            <circle
              key={point.id}
              cx={`${normalizeX(point.x)}%`}
              cy={`${100 - normalizeY(point.y)}%`}
              r="2"
              fill={colorMap[point.cellType]}
              opacity="0.8"
              className="hover:opacity-100 hover:r-3 transition-all duration-200"
            >
              <title>{`${point.cellType} (${point.x.toFixed(2)}, ${point.y.toFixed(2)})`}</title>
            </circle>
          ))}
        </svg>

        {/* Axes labels */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm text-gray-400 font-medium">
          UMAP 1
        </div>
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 -rotate-90 text-sm text-gray-400 font-medium">
          UMAP 2
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center p-4 bg-black rounded-lg border border-white/20">
        {cellTypes.map((cellType) => (
          <div
            key={cellType}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-black border border-white/20"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: colorMap[cellType],
              }}
            />
            <span className="text-sm text-white">{cellType}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
