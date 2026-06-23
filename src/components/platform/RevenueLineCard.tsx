import {
  PlaneLanding,
  PlaneTakeoff,
  CircleParking,
  Warehouse,
  DoorOpen,
  Building,
  MonitorCheck,
  Monitor,
  Luggage,
  LogIn,
  Users,
  UserCheck,
  ArrowLeftRight,
  Accessibility,
  ShieldCheck,
  VolumeX,
  Cloud,
  Compass,
  Stamp,
  Truck,
  Fuel,
  Snowflake,
  PlugZap,
  Sparkles,
  Package,
  ShoppingBag,
  Store,
  Utensils,
  Newspaper,
  Box,
  Car,
  KeyRound,
  Navigation,
  Bus,
  TrainFront,
  Building2,
  Container,
  Factory,
  Map,
  Home,
  Hotel,
  Megaphone,
  Armchair,
  Crown,
  Banknote,
  Wifi,
  Zap,
  HardHat,
  Shield,
  Badge,
  CircleDot,
  type LucideIcon,
} from "lucide-react";
import type { RevenueLineRow } from "@/lib/supabase";
import { REVENUE_CATEGORY_COLORS } from "@/lib/supabase";

const ICON_MAP: Record<string, LucideIcon> = {
  "plane-landing": PlaneLanding,
  "plane-takeoff": PlaneTakeoff,
  "circle-parking": CircleParking,
  warehouse: Warehouse,
  "door-open": DoorOpen,
  building: Building,
  "monitor-check": MonitorCheck,
  monitor: Monitor,
  luggage: Luggage,
  "log-in": LogIn,
  users: Users,
  "user-check": UserCheck,
  "arrow-left-right": ArrowLeftRight,
  accessibility: Accessibility,
  "shield-check": ShieldCheck,
  "volume-x": VolumeX,
  cloud: Cloud,
  compass: Compass,
  stamp: Stamp,
  truck: Truck,
  fuel: Fuel,
  snowflake: Snowflake,
  "plug-zap": PlugZap,
  sparkles: Sparkles,
  package: Package,
  "shopping-bag": ShoppingBag,
  store: Store,
  utensils: Utensils,
  newspaper: Newspaper,
  box: Box,
  car: Car,
  key: KeyRound,
  navigation: Navigation,
  bus: Bus,
  "train-front": TrainFront,
  "building-2": Building2,
  container: Container,
  factory: Factory,
  map: Map,
  home: Home,
  hotel: Hotel,
  megaphone: Megaphone,
  armchair: Armchair,
  crown: Crown,
  banknote: Banknote,
  wifi: Wifi,
  zap: Zap,
  "hard-hat": HardHat,
  shield: Shield,
  badge: Badge,
};

export function RevenueLineCard({ line }: { line: RevenueLineRow }) {
  const Icon = ICON_MAP[line.icon_name ?? ""] ?? CircleDot;
  const color = REVENUE_CATEGORY_COLORS[line.category];
  const isAero = line.category === "aero";

  return (
    <a
      href={`/platform/DAdemo/enterprise-access/portal/revenue/${line.slug}`}
      className={`group rounded-2xl border p-5 transition-all duration-300 cursor-pointer block ${
        isAero
          ? "border-white/[0.06] bg-white/[0.02] hover:border-cyan-500/20 hover:bg-white/[0.04]"
          : "border-white/[0.06] bg-white/[0.02] hover:border-violet-500/20 hover:bg-white/[0.04]"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: color + "15" }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-sm font-semibold text-white">{line.name}</h3>
            {line.subcategory && (
              <span className="text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-500">
                {line.subcategory}
              </span>
            )}
          </div>
          <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-2">
            {line.description}
          </p>
        </div>
      </div>
    </a>
  );
}
