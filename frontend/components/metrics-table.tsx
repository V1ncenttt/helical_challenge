import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface MetricsTableProps {
  cellTypes: string[]
  confusionMatrix: number[][]
}

export function MetricsTable({ cellTypes, confusionMatrix }: MetricsTableProps) {
  const calculateMetrics = (cellTypeIndex: number) => {
    const tp = confusionMatrix[cellTypeIndex][cellTypeIndex]
    const fp = confusionMatrix.reduce((sum, row, i) => (i !== cellTypeIndex ? sum + row[cellTypeIndex] : sum), 0)
    const fn = confusionMatrix[cellTypeIndex].reduce((sum, val, i) => (i !== cellTypeIndex ? sum + val : sum), 0)
    const tn = confusionMatrix.reduce(
      (sum, row, i) =>
        sum + row.reduce((rowSum, val, j) => (i !== cellTypeIndex && j !== cellTypeIndex ? rowSum + val : rowSum), 0),
      0,
    )

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0
    const f1 = precision + recall > 0 ? (2 * (precision * recall)) / (precision + recall) : 0
    const support = tp + fn

    return {
      precision: (precision * 100).toFixed(1),
      recall: (recall * 100).toFixed(1),
      f1: (f1 * 100).toFixed(1),
      support,
    }
  }

  const getPerformanceBadge = (value: string) => {
    const numValue = Number.parseFloat(value)
    if (numValue >= 90) return <Badge className="bg-green-600 text-white border-green-600">{value}%</Badge>
    if (numValue >= 80) return <Badge className="bg-yellow-600 text-white border-yellow-600">{value}%</Badge>
    return <Badge className="bg-red-600 text-white border-red-600">{value}%</Badge>
  }

  return (
    <div className="space-y-4">
      <div className="bg-black rounded-lg border border-white/20 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/20 hover:bg-white/5">
              <TableHead className="text-white border-r border-white/20">Cell Type</TableHead>
              <TableHead className="text-center text-white border-r border-white/20">Precision</TableHead>
              <TableHead className="text-center text-white border-r border-white/20">Recall</TableHead>
              <TableHead className="text-center text-white border-r border-white/20">F1-Score</TableHead>
              <TableHead className="text-center text-white">Support</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cellTypes.map((cellType, index) => {
              const metrics = calculateMetrics(index)
              return (
                <TableRow key={cellType} className="border-white/20 hover:bg-white/5">
                  <TableCell className="font-medium text-white border-r border-white/20">{cellType}</TableCell>
                  <TableCell className="text-center border-r border-white/20">
                    {getPerformanceBadge(metrics.precision)}
                  </TableCell>
                  <TableCell className="text-center border-r border-white/20">
                    {getPerformanceBadge(metrics.recall)}
                  </TableCell>
                  <TableCell className="text-center border-r border-white/20">
                    {getPerformanceBadge(metrics.f1)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-black text-white border border-white/20">{metrics.support}</Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="p-4 bg-black rounded-lg border border-white/20">
          <h4 className="font-semibold mb-2 text-white">Precision</h4>
          <p className="text-sm text-gray-400">
            Of all cells predicted as this type, how many were actually this type?
          </p>
        </div>
        <div className="p-4 bg-black rounded-lg border border-white/20">
          <h4 className="font-semibold mb-2 text-white">Recall</h4>
          <p className="text-sm text-gray-400">Of all actual cells of this type, how many were correctly identified?</p>
        </div>
        <div className="p-4 bg-black rounded-lg border border-white/20">
          <h4 className="font-semibold mb-2 text-white">F1-Score</h4>
          <p className="text-sm text-gray-400">Harmonic mean of precision and recall, balancing both metrics.</p>
        </div>
      </div>
    </div>
  )
}
