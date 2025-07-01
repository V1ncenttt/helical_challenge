"use client"

import { useMemo } from "react"

interface UMAPPlotProps {
  data: Array<{
    x: number
    y: number
    label: string
    id: number
  }>
  cellTypes: string[]
}

export function UMAPPlot({ data, cellTypes }: UMAPPlotProps) {
  const colorMap = useMemo(() => {
    const colors: Record<string, string> = {}
    cellTypes.forEach((label, index) => {
      colors[label] = `hsl(${(index * 360) / cellTypes.length}, 70%, 50%)`
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

  const normalizeX = (x: number) => {
    if (maxX === minX) return 50;
    const padding = 0.05 * (maxX - minX);
    return ((x - minX + padding) / (maxX - minX + 2 * padding)) * 100;
  }
  const normalizeY = (y: number) => {
    if (maxY === minY) return 50;
    const padding = 0.05 * (maxY - minY);
    return ((y - minY + padding) / (maxY - minY + 2 * padding)) * 100;
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full h-96 bg-black rounded-lg border border-white/20 overflow-hidden">
        <svg className="w-full h-full">
          {/* Graduation lines and labels */}
          {[0, 25, 50, 75, 100].map((perc) => (
            <g key={`h-${perc}`}>
              <line
                x1="0"
                x2="100%"
                y1={`${100 - perc}%`}
                y2={`${100 - perc}%`}
                stroke="white"
                strokeWidth="0.5"
                strokeDasharray="2,2"
                opacity="0.2"
              />
              <text
                x="2"
                y={`${100 - perc}%`}
                fontSize="10"
                fill="white"
                alignmentBaseline="middle"
              >
                {((perc / 100) * (maxY - minY) + minY).toFixed(1)}
              </text>
            </g>
          ))}
          {[0, 25, 50, 75, 100].map((perc) => (
            <g key={`v-${perc}`}>
              <line
                y1="0"
                y2="100%"
                x1={`${perc}%`}
                x2={`${perc}%`}
                stroke="white"
                strokeWidth="0.5"
                strokeDasharray="2,2"
                opacity="0.2"
              />
              <text
                y="10"
                x={`${perc}%`}
                fontSize="10"
                fill="white"
                textAnchor="middle"
              >
                {((perc / 100) * (maxX - minX) + minX).toFixed(1)}
              </text>
            </g>
          ))}
          {data.map((point) => (
            <circle
              key={`${point.id}-${point.x}-${point.y}`}
              cx={`${normalizeX(point.x)}%`}
              cy={`${100 - normalizeY(point.y)}%`}
              r="2"
              fill={colorMap[point.label]}
              opacity="0.8"
              className="hover:opacity-100 hover:r-3 transition-all duration-200"
            >
              <title>{`${point.label} (${point.x.toFixed(2)}, ${point.y.toFixed(2)})`}</title>
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
        {cellTypes.map((label) => (
          <div
            key={label}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-black border border-white/20"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: colorMap[label],
              }}
            />
            <span className="text-sm text-white">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
