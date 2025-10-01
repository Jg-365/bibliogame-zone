import { ProgressBar as BaseProgressBar } from "@/shared/components/ConsolidatedComponents";

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
  showPercentage = false,
}: ProgressBarProps) => {
  const getVariant = () => {
    switch (color) {
      case "success":
        return "gradient";
      case "accent":
        return "striped";
      default:
        return "default";
    }
  };

  return (
    <BaseProgressBar
      value={progress}
      max={max}
      label={label}
      showPercentage={showPercentage}
      variant={getVariant()}
      size="md"
    />
  );
};
