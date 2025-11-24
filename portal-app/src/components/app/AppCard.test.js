import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AppCard from "./AppCard";

// Mock the logger
jest.mock("../../utils/logger", () => ({
  logEvent: jest.fn(),
  LOG_TYPES: {
    APP: "APP",
  },
}));

describe("AppCard", () => {
  const mockApp = {
    id: "test-app",
    name: "Test App",
    url: "https://example.com",
    color: "#ff0000",
    icon: "🚀",
  };

  it("renders app name", () => {
    render(<AppCard app={mockApp} />);
    expect(screen.getByText("Test App")).toBeInTheDocument();
  });

  it("renders as a link when valid URL is provided", () => {
    render(<AppCard app={mockApp} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders as disabled div when URL is invalid", () => {
    const appWithoutUrl = { ...mockApp, url: "" };
    const { container } = render(<AppCard app={appWithoutUrl} />);
    expect(container.querySelector(".disabled")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders emoji icon when icon is emoji", () => {
    render(<AppCard app={mockApp} />);
    expect(screen.getByText("🚀")).toBeInTheDocument();
  });

  it("renders image icon when icon is URL", () => {
    const appWithImage = {
      ...mockApp,
      icon: "https://example.com/icon.png",
    };
    render(<AppCard app={appWithImage} />);
    const img = screen.getByAltText("Test App icon");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/icon.png");
  });

  it("logs click event when app is clicked", () => {
    const { logEvent } = require("../../utils/logger");
    render(<AppCard app={mockApp} />);
    const link = screen.getByRole("link");
    fireEvent.click(link);
    expect(logEvent).toHaveBeenCalled();
  });

  it("adds https:// to URLs without protocol", () => {
    const appWithoutProtocol = { ...mockApp, url: "example.com" };
    render(<AppCard app={appWithoutProtocol} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com");
  });

  it("uses custom target when specified", () => {
    const appWithTarget = { ...mockApp, target: "_self" };
    render(<AppCard app={appWithTarget} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_self");
  });

  it("displays disabled message when URL is not available", () => {
    const appWithoutUrl = { ...mockApp, url: null };
    render(<AppCard app={appWithoutUrl} />);
    const disabled = screen.getByTitle("Link not available");
    expect(disabled).toBeInTheDocument();
  });
});
