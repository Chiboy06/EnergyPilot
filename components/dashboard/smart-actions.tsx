import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Zap, RotateCcw } from 'lucide-react'

export function SmartActions() {
  return (
    <Card className="bg-card border-border p-4 md:p-6 rounded-lg">
      <h3 className="text-base md:text-lg font-semibold text-foreground mb-4 md:mb-6">Smart Actions</h3>

      <div className="space-y-4 md:space-y-6">
        {/* Load Shifting */}
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm md:text-base">Load Shifting</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                Shift dishwasher cycle to 10:00 PM to save
              </p>
              <p className="text-xs text-primary font-medium">$0.45.</p>
            </div>
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-11">
            Schedule for 10 PM
          </Button>
        </div>

        {/* Phantom Load */}
        <div className="border-t border-border pt-4 md:pt-6 space-y-3">
          <div className="flex items-start gap-2">
            <RotateCcw className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm md:text-base">Phantom Load</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                Guest room devices consuming 45W while idle.
              </p>
            </div>
          </div>
          <Button variant="outline" className="w-full rounded-lg h-11">
            Cut Power
          </Button>
        </div>
      </div>
    </Card>
  )
}
