import { LucideIcon } from "lucide-react";
import { StatsCard as BaseStatsCard } from "@/shared/components/ConsolidatedComponents";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: "primary" | "success" | "accent";
  gradient?: boolean;
  onClick?: () => void;
}

export const StatsCard = ({
  title,
  value,
  icon: Icon,
  color = "primary",
  gradient = false,
  onClick,
}: StatsCardProps) => {
  const getVariantClass = () => {
    if (gradient) {
      switch (color) {
        case "success":
          return "!bg-gradient-to-br !from-green-500 !to-emerald-600 !text-white";
        case "accent":
          return "!bg-gradient-to-br !from-yellow-500 !to-orange-600 !text-white";
        default:
          return "!bg-gradient-to-br !from-blue-500 !to-purple-600 !text-white";
      }
    }
    return "";
  };

  return (
    <div
      className={cn("transition-all duration-300 hover:scale-105", onClick && "cursor-pointer")}
      onClick={onClick}
    >
      <BaseStatsCard
        data={{
          title,
          value,
          icon: (
            <div className={cn("p-2 rounded-full", gradient ? "bg-white/20" : "bg-primary/10")}>
              <Icon className={cn("h-5 w-5", gradient ? "text-white" : "text-primary")} />
            </div>
          ),
        }}
        variant={gradient ? "gradient" : "default"}
        className={cn("shadow-card hover:shadow-glow", getVariantClass())}
      />
    </div>
  );
};
