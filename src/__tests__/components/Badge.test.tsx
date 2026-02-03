import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/Badge";

describe("Badge", () => {
  it("renders badge with text", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("applies default variant styling", () => {
    render(<Badge data-testid="badge">Default</Badge>);
    expect(screen.getByTestId("badge")).toHaveClass("bg-secondary");
  });

  it("applies primary variant styling", () => {
    render(<Badge variant="primary" data-testid="badge">Primary</Badge>);
    expect(screen.getByTestId("badge")).toHaveClass("bg-primary");
  });

  it("applies secondary variant styling", () => {
    render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>);
    expect(screen.getByTestId("badge")).toHaveClass("bg-muted");
  });

  it("applies success variant styling", () => {
    render(<Badge variant="success" data-testid="badge">Success</Badge>);
    expect(screen.getByTestId("badge")).toHaveClass("text-success");
  });

  it("applies warning variant styling", () => {
    render(<Badge variant="warning" data-testid="badge">Warning</Badge>);
    expect(screen.getByTestId("badge")).toHaveClass("text-warning");
  });

  it("applies error variant styling", () => {
    render(<Badge variant="error" data-testid="badge">Error</Badge>);
    expect(screen.getByTestId("badge")).toHaveClass("text-error");
  });

  it("applies custom className", () => {
    render(<Badge className="custom-badge" data-testid="badge">Custom</Badge>);
    expect(screen.getByTestId("badge")).toHaveClass("custom-badge");
  });

  it("applies base styling", () => {
    render(<Badge data-testid="badge">Base</Badge>);
    expect(screen.getByTestId("badge")).toHaveClass("inline-flex");
    expect(screen.getByTestId("badge")).toHaveClass("rounded-full");
  });
});
