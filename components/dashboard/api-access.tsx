'use client'

import { Copy, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

export function APIAccess() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Developer Access</h2>
        <p className="text-sm text-muted-foreground mb-6">Manage API keys for external integrations.</p>

        <Card className="p-6">
          <div className="space-y-6">
            {/* Active API Key */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Active API Key</h3>
              <div className="flex items-center gap-4">
                <Input 
                  type="password"
                  value="pk_live_51M..."
                  readOnly
                  className="bg-secondary border-border text-foreground font-mono text-sm"
                />
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  Revoke
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Last used: Today at 14:02 from 192.168.1.4
              </p>
            </div>

            {/* Generate New Key */}
            <div className="pt-6 border-t border-border">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Generate New Key
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
