interface ProgressBarProps {
  progress: number;
  max: number;
  label?: string;
  color?: "primary" | "success" | "accent";
  showPercentage?: boolean;
}

export const ProgressBar = ({ 
  progress, 
  max, 
  label, 
  color = "primary", 
  showPercentage = false 
}: ProgressBarProps) => {
  const percentage = Math.min((progress / max) * 100, 100);
  
  const getBarColor = () => {
    switch (color) {
      case "success":
        return "bg-success";
      case "accent":
        return "bg-accent";
      default:
        return "bg-primary";
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {showPercentage && (
            <span className="text-sm text-muted-foreground">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className="h-3 bg-secondary rounded-full overflow-hidden">
        <div 
          className={`h-full ${getBarColor()} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{progress}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};