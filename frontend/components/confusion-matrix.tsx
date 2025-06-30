"use client"

import { useMemo } from "react"

interface ConfusionMatrixProps {
  matrix: number[][]
  cellTypes: string[]
}

export function ConfusionMatrix({ matrix, cellTypes }: ConfusionMatrixProps) {
  const maxValue = useMemo(() => {
    return Math.max(...matrix.flat())
  }, [matrix])

  const getIntensity = (value: number) => {
    return value / maxValue
  }

  const getAccuracy = (rowIndex: number) => {
    const total = matrix[rowIndex].reduce((sum, val) => sum + val, 0)
    return total > 0 ? ((matrix[rowIndex][rowIndex] / total) * 100).toFixed(1) : "0.0"
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto bg-black rounded-lg border border-white/20 p-4">
        <div className="inline-block min-w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-sm font-medium text-gray-400 border-b border-white/20">
                  Predicted →<br />
                  Actual ↓
                </th>
                {cellTypes.map((cellType) => (
                  <th
                    key={cellType}
                    className="p-2 text-sm font-medium text-gray-400 border-b border-white/20 min-w-20"
                  >
                    {cellType.split(" ")[0]}
                  </th>
                ))}
                <th className="p-2 text-sm font-medium text-gray-400 border-b border-white/20">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="p-2 text-sm font-medium text-gray-400 border-r border-white/20">
                    {cellTypes[rowIndex].split(" ")[0]}
                  </td>
                  {row.map((value, colIndex) => (
                    <td key={colIndex} className="p-2 text-center border border-white/20">
                      <div
                        className="w-full h-8 flex items-center justify-center text-sm font-medium rounded border border-white/10"
                        style={{
                          backgroundColor:
                            rowIndex === colIndex
                              ? `rgba(34, 197, 94, ${0.2 + getIntensity(value) * 0.6})`
                              : `rgba(239, 68, 68, ${0.1 + getIntensity(value) * 0.4})`,
                          color: getIntensity(value) > 0.4 ? "white" : "#ffffff",
                        }}
                      >
                        {value}
                      </div>
                    </td>
                  ))}
                  <td className="p-2 text-center border-l border-white/20">
                    <span className="text-sm font-medium text-white">{getAccuracy(rowIndex)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-gray-400 bg-black p-4 rounded-lg border border-white/20">
        <p>
          <strong className="text-white">How to read:</strong> Rows represent actual cell types, columns represent
          predicted cell types.
        </p>
        <p>Diagonal values (green) show correct predictions, off-diagonal values (red) show misclassifications.</p>
      </div>
    </div>
  )
}
