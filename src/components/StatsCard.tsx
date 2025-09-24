import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: "primary" | "success" | "accent";
  gradient?: boolean;
}

export const StatsCard = ({ title, value, icon: Icon, color = "primary", gradient = false }: StatsCardProps) => {
  const getCardClasses = () => {
    const baseClasses = "relative overflow-hidden transition-all duration-300 hover:scale-105";
    
    if (gradient) {
      switch (color) {
        case "success":
          return `${baseClasses} bg-gradient-success text-success-foreground shadow-glow`;
        case "accent":
          return `${baseClasses} bg-gradient-gold text-accent-foreground shadow-gold`;
        default:
          return `${baseClasses} bg-gradient-primary text-primary-foreground shadow-glow`;
      }
    }
    
    return `${baseClasses} shadow-card hover:shadow-glow`;
  };

  return (
    <Card className={getCardClasses()}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${gradient ? "opacity-90" : "text-muted-foreground"}`}>
              {title}
            </p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${gradient ? "bg-white/20" : "bg-primary/10"}`}>
            <Icon className={`h-6 w-6 ${gradient ? "text-white" : "text-primary"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};