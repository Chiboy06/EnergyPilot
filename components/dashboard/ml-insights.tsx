import { Card } from '@/components/ui/card'
import { ChevronRight, AlertCircle, AlertTriangle, Zap } from 'lucide-react'

interface Insight {
  id: string
  title: string
  description: string
  icon: 'info' | 'warning' | 'success'
}

const insights: Insight[] = [
  {
    id: 'hvac',
    title: 'HVAC Efficiency Drop',
    description: 'Cooling cycle is running 15% longer than predicted for this temperature. Check filter.',
    icon: 'info',
  },
  {
    id: 'kitchen',
    title: 'Unusual Kitchen Activity',
    description: 'High consumption detected during typical low-usage hours (02:00 - 04:00).',
    icon: 'warning',
  },
  {
    id: 'ev',
    title: 'EV Charging Optimized',
    description: 'Scheduled charging for 01:00 AM to align with lowest predicted grid rates.',
    icon: 'success',
  },
]

export function MLInsights() {
  return (
    <Card className="bg-card border-border p-4 md:p-6 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-semibold text-foreground">ML Insights</h3>
        <span className="text-xs text-muted-foreground">Updated 5 min ago</span>
      </div>

      <div className="space-y-4">
        {insights.map((insight) => (
          <button
            key={insight.id}
            className="w-full flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left group min-h-[60px]"
          >
            <div className="flex-shrink-0 mt-0.5">
              {insight.icon === 'info' && (
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <AlertCircle className="h-5 w-5 text-blue-400" />
                </div>
              )}
              {insight.icon === 'warning' && (
                <div className="p-2 rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
              )}
              {insight.icon === 'success' && (
                <div className="p-2 rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground mb-1 text-sm md:text-base">{insight.title}</p>
              <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{insight.description}</p>
            </div>

            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground flex-shrink-0 transition-colors" />
          </button>
        ))}
      </div>
    </Card>
  )
}
