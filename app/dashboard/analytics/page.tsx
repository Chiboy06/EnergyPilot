'use client';

import { AnalyticsStats } from '@/components/dashboard/analytics-stats';
import { ConsumptionChart } from '@/components/dashboard/consumption-chart';
import { UsageBreakdown } from '@/components/dashboard/usage-breakdown';
import { EfficiencyScore } from '@/components/dashboard/efficiency-score';
import { AnomalyReports } from '@/components/dashboard/anomaly-reports';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Stats */}
      <AnalyticsStats />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2">
          <ConsumptionChart />
        </div>
        <div>
          <UsageBreakdown />
        </div>
      </div>

      {/* Efficiency & Anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div>
          <EfficiencyScore />
        </div>
        <div className="lg:col-span-2">
          <AnomalyReports />
        </div>
      </div>
    </div>
  );
}
