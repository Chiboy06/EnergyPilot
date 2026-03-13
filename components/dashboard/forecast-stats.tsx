import { Card } from '@/components/ui/card'
import { TrendingDown, BarChart3, Clock, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ForecastStats() {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 flex-1">
        {/* Forecast Next 24h */}
        <Card className="bg-card border-border p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <TrendingDown className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">Forecast (Next 24h)</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">38.4</span>
            <span className="text-sm text-muted-foreground">kWh</span>
          </div>
          <p className="text-xs text-destructive mt-2">-5% vs yesterday</p>
        </Card>

        {/* Model Confidence */}
        <Card className="bg-card border-border p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">Model Confidence</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">96.2%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Based on 30d history</p>
        </Card>

        {/* Next Peak Load */}
        <Card className="bg-card border-border p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <Clock className="h-5 w-5 text-warning" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">Next Peak Load</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">18:30</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Est. 4.8 kW load</p>
        </Card>

        {/* Proj. Monthly Savings */}
        <Card className="bg-card border-border p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">Proj. Monthly Savings</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">$24.50</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">If recommendations followed</p>
        </Card>
      </div>

    </div>
  )
}
