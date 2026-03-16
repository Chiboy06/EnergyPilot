import {
  ChefHat,
  Sofa,
  Bed,
  Bath,
  Car,
  Monitor,
  Waves,
  Wind,
  Server,
  BookOpen,
  Users,
  Briefcase,
  Factory,
  Zap,
  Building2,
  FlaskConical,
  Cpu,
  Package,
  Wrench,
  LucideIcon,
} from "lucide-react";

// Map room name keywords → icon
const ICON_MAP: Array<[RegExp, LucideIcon]> = [
  [/kitchen/i,          ChefHat],
  [/parlour|living|lounge/i, Sofa],
  [/bedroom|bed|master/i, Bed],
  [/bath|toilet/i,      Bath],
  [/garage|car|parking/i, Car],
  [/office|desk|admin/i, Monitor],
  [/pool|pump|water/i,  Waves],
  [/hvac|air|fan|cooling/i, Wind],
  [/server|rack|it|computer|lab/i, Server],
  [/library|reading/i,  BookOpen],
  [/conference|board|meeting|faculty/i, Users],
  [/dean|director|manager|secretary|deputy/i, Briefcase],
  [/lecture|hall|class/i, Building2],
  [/lab|research|science/i, FlaskConical],
  [/production|floor|assembly/i, Factory],
  [/control|panel/i,    Cpu],
  [/storage|bay|warehouse/i, Package],
  [/maintenance|workshop|repair/i, Wrench],
  [/laundry|washing/i,  Waves],
  [/dining|canteen/i,   ChefHat],
];

export function getRoomIcon(room: string): LucideIcon {
  for (const [pattern, icon] of ICON_MAP) {
    if (pattern.test(room)) return icon;
  }
  return Zap;
}

// Deterministic hash so the same room always gets the same mock values
function hashRoom(room: string): number {
  let h = 0;
  for (let i = 0; i < room.length; i++) {
    h = (h * 31 + room.charCodeAt(i)) >>> 0;
  }
  return h;
}

type MockPower = {
  power: number;
  percentage: number;
  status: string;
  statusColor: string;
  progressColor: string;
};

export function getRoomMockPower(room: string): MockPower {
  const h = hashRoom(room);
  const percentage = 5 + (h % 88); // 5–92%

  let status: string;
  let statusColor: string;
  let progressColor: string;

  if (percentage >= 85) {
    status = "HIGH LOAD";
    statusColor = "text-warning";
    progressColor = "bg-warning";
  } else if (percentage >= 60) {
    status = "ACTIVE";
    statusColor = "text-primary";
    progressColor = "bg-primary";
  } else if (percentage >= 20) {
    status = "NORMAL";
    statusColor = "text-muted-foreground";
    progressColor = "bg-primary";
  } else if (percentage >= 5) {
    status = "LOW";
    statusColor = "text-muted-foreground";
    progressColor = "bg-primary";
  } else {
    status = "OFFLINE";
    statusColor = "text-muted-foreground";
    progressColor = "bg-muted";
  }

  // Anomaly: ~1 in 9 rooms
  if (h % 9 === 0) {
    status = "ANOMALY";
    statusColor = "text-destructive";
    progressColor = "bg-destructive";
  }

  // Base power: 50W–3500W scaled by percentage
  const power = Math.round((percentage / 100) * 3500);

  return { power, percentage, status, statusColor, progressColor };
}
