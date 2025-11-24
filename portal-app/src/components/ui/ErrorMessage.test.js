import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorMessage from "./ErrorMessage";

describe("ErrorMessage", () => {
  it("renders with default title and message", () => {
    render(<ErrorMessage />);
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(
      screen.getByText("Algo salió mal. Por favor, intenta nuevamente.")
    ).toBeInTheDocument();
  });

  it("renders with custom title and message", () => {
    render(
      <ErrorMessage
        title="Custom Error"
        message="This is a custom error message"
      />
    );
    expect(screen.getByText("Custom Error")).toBeInTheDocument();
    expect(
      screen.getByText("This is a custom error message")
    ).toBeInTheDocument();
  });

  it("renders retry button when onRetry is provided", () => {
    const onRetry = jest.fn();
    render(<ErrorMessage onRetry={onRetry} />);
    expect(screen.getByText("Reintentar")).toBeInTheDocument();
  });

  it("does not render retry button when onRetry is not provided", () => {
    render(<ErrorMessage />);
    expect(screen.queryByText("Reintentar")).not.toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", () => {
    const onRetry = jest.fn();
    render(<ErrorMessage onRetry={onRetry} />);
    const retryButton = screen.getByText("Reintentar");
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders error variant with correct class", () => {
    const { container } = render(<ErrorMessage variant="error" />);
    const errorDiv = container.querySelector(".error-message");
    expect(errorDiv).toHaveClass("error");
  });

  it("renders warning variant with correct class", () => {
    const { container } = render(<ErrorMessage variant="warning" />);
    const errorDiv = container.querySelector(".error-message");
    expect(errorDiv).toHaveClass("warning");
  });

  it("renders info variant with correct class", () => {
    const { container } = render(<ErrorMessage variant="info" />);
    const errorDiv = container.querySelector(".error-message");
    expect(errorDiv).toHaveClass("info");
  });

  it("displays correct icon for error variant", () => {
    render(<ErrorMessage variant="error" />);
    expect(screen.getByText("⚠️")).toBeInTheDocument();
  });

  it("displays correct icon for warning variant", () => {
    render(<ErrorMessage variant="warning" />);
    expect(screen.getByText("⚡")).toBeInTheDocument();
  });

  it("displays correct icon for info variant", () => {
    render(<ErrorMessage variant="info" />);
    expect(screen.getByText("ℹ️")).toBeInTheDocument();
  });
});
