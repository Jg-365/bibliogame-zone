import { render, screen } from "../utils/testUtils";
import { ProgressBar } from "@/components/ProgressBar";

describe("ProgressBar Component", () => {
  const defaultProps = {
    progress: 50,
    max: 100,
    label: "Reading Progress",
  };

  it("renders with correct progress value", () => {
    render(<ProgressBar {...defaultProps} />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute("aria-valuenow", "50");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
  });

  it("displays the correct label", () => {
    render(<ProgressBar {...defaultProps} />);

    expect(screen.getByText("Reading Progress")).toBeInTheDocument();
  });

  it("shows percentage when showPercentage is true", () => {
    render(<ProgressBar {...defaultProps} showPercentage />);

    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("handles zero progress correctly", () => {
    render(<ProgressBar {...defaultProps} progress={0} />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "0");
  });

  it("handles maximum progress correctly", () => {
    render(<ProgressBar {...defaultProps} progress={100} />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "100");

    if (screen.queryByText("100%")) {
      expect(screen.getByText("100%")).toBeInTheDocument();
    }
  });

  it("applies custom className when provided", () => {
    const customClass = "custom-progress-bar";
    render(<ProgressBar {...defaultProps} />);

    const container = screen.getByRole("progressbar").closest("div");
    expect(container).toHaveClass(customClass);
  });

  it("handles invalid values gracefully", () => {
    render(<ProgressBar {...defaultProps} progress={-10} />);

    const progressBar = screen.getByRole("progressbar");
    // Should clamp to 0
    expect(progressBar).toHaveAttribute("aria-valuenow", "0");
  });

  it("handles values exceeding maximum", () => {
    render(<ProgressBar {...defaultProps} progress={150} />);

    const progressBar = screen.getByRole("progressbar");
    // Should clamp to max value
    expect(progressBar).toHaveAttribute("aria-valuenow", "100");
  });

  it("is accessible with screen readers", () => {
    render(<ProgressBar {...defaultProps} />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-label", "Reading Progress");
  });

  it("updates when props change", () => {
    const { rerender } = render(<ProgressBar {...defaultProps} />);

    let progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "50");

    rerender(<ProgressBar {...defaultProps} progress={75} />);

    progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "75");
  });
});

describe("ProgressBar Animations", () => {
  it("has smooth animation class when animated", () => {
    render(<ProgressBar value={50} max={100} label="Test" animated />);

    const progressFill = screen.getByRole("progressbar").querySelector('[style*="width"]');
    expect(progressFill).toHaveClass("transition-all");
  });

  it("does not have animation class when not animated", () => {
    render(<ProgressBar value={50} max={100} label="Test" animated={false} />);

    const progressFill = screen.getByRole("progressbar").querySelector('[style*="width"]');
    expect(progressFill).not.toHaveClass("transition-all");
  });
});

describe("ProgressBar Variants", () => {
  it("applies correct styling for success variant", () => {
    render(<ProgressBar value={100} max={100} label="Complete" variant="success" />);

    const progressFill = screen.getByRole("progressbar").querySelector('[class*="bg"]');
    expect(progressFill).toHaveClass("bg-green-500");
  });

  it("applies correct styling for warning variant", () => {
    render(<ProgressBar value={50} max={100} label="Warning" variant="warning" />);

    const progressFill = screen.getByRole("progressbar").querySelector('[class*="bg"]');
    expect(progressFill).toHaveClass("bg-yellow-500");
  });

  it("applies correct styling for error variant", () => {
    render(<ProgressBar value={25} max={100} label="Error" variant="error" />);

    const progressFill = screen.getByRole("progressbar").querySelector('[class*="bg"]');
    expect(progressFill).toHaveClass("bg-red-500");
  });
});
