
import { ForecastStats } from '@/components/dashboard/forecast-stats'
import { LoadProjectionChart } from '@/components/dashboard/load-projection-chart'
import { MLInsights } from '@/components/dashboard/ml-insights'
import { SmartActions } from '@/components/dashboard/smart-actions'
import { Button } from '@/components/ui/button'

export default function PredictionsPage() {
  return (
    <div className="flex-1 flex flex-col">

      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
          {/* Header with title and button */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Energy Forecast & Insights</h2>
            </div>
            {/* Model Settings Button */}
            <Button variant="outline" className="w-full md:w-auto md:ml-4 whitespace-nowrap">
              ☰ Model Settings
            </Button>
          </div>

          {/* Forecast Stats */}
          <ForecastStats />

          {/* Load Projection Chart */}
          <LoadProjectionChart />

          {/* ML Insights and Smart Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2">
              <MLInsights />
            </div>
            <div className="lg:col-span-1">
              <SmartActions />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
