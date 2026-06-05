"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";

const generateData = () => {
  const data = [];
  for (let i = 0; i <= 24; i++) {
    const hour = i.toString().padStart(2, "0") + ":00";
    const baseActual = 1000 + Math.sin(i / 4) * 500 + Math.random() * 200;
    const basePredicted = 1000 + Math.sin(i / 4) * 500 + (i > 16 ? Math.random() * 100 : 0);
    data.push({
      time: hour,
      actual: Math.round(baseActual),
      predicted: Math.round(basePredicted),
    });
  }
  return data;
};

const data = generateData();

export function PowerChart() {
  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-1.5" style={{ color: "rgba(148,163,184,0.6)" }}>
            AWS IoT · SageMaker DeepAR
          </p>
          <h2 className="text-[17px] font-semibold text-white">Power Consumption Real-time</h2>
          <p className="text-[12.5px] mt-0.5" style={{ color: "rgba(100,116,139,0.9)" }}>
            Live data vs ML prediction · 24h
          </p>
        </div>
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-2 text-[12.5px]">
            <span className="inline-block w-3 h-0.5 rounded" style={{ background: "#18e39a" }} />
            <span style={{ color: "rgba(148,163,184,0.8)" }}>Actual</span>
          </span>
          <span className="flex items-center gap-2 text-[12.5px]">
            <span className="inline-block w-3 h-0.5 rounded" style={{ background: "#a78bfa", opacity: 0.8 }} />
            <span style={{ color: "rgba(148,163,184,0.8)" }}>Predicted</span>
          </span>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#18e39a" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#18e39a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="rgba(88,105,128,0.6)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(88,105,128,0.8)" }}
            />
            <YAxis
              stroke="rgba(88,105,128,0.6)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
              tick={{ fill: "rgba(88,105,128,0.8)" }}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(7,11,18,0.92)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 12,
                color: "#e2e8f0",
                backdropFilter: "blur(12px)",
                fontSize: 12,
              }}
              labelStyle={{ color: "rgba(148,163,184,0.8)", marginBottom: 4 }}
              cursor={{ stroke: "rgba(255,255,255,0.08)" }}
            />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#18e39a"
              strokeWidth={2}
              fill="url(#actualGrad)"
              name="Actual"
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#a78bfa"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              name="Predicted"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
