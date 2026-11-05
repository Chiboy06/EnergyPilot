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
