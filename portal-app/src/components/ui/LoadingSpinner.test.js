import React from "react";
import { render, screen } from "@testing-library/react";
import LoadingSpinner from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders with default message", () => {
    render(<LoadingSpinner />);
    expect(screen.getByText("Cargando...")).toBeInTheDocument();
  });

  it("renders with custom message", () => {
    render(<LoadingSpinner message="Loading data..." />);
    expect(screen.getByText("Loading data...")).toBeInTheDocument();
  });

  it("renders without message when message is empty", () => {
    render(<LoadingSpinner message="" />);
    expect(screen.queryByText("Cargando...")).not.toBeInTheDocument();
  });

  it("renders with small size class", () => {
    const { container } = render(<LoadingSpinner size="small" />);
    const spinner = container.querySelector(".loading-spinner");
    expect(spinner).toHaveClass("spinner-small");
  });

  it("renders with medium size class by default", () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector(".loading-spinner");
    expect(spinner).toHaveClass("spinner-medium");
  });

  it("renders with large size class", () => {
    const { container } = render(<LoadingSpinner size="large" />);
    const spinner = container.querySelector(".loading-spinner");
    expect(spinner).toHaveClass("spinner-large");
  });
});
