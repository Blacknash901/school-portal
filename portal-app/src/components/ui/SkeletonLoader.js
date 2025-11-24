import React from "react";
import "./SkeletonLoader.css";

export function NewsCardSkeleton() {
  return (
    <div className="news-card-skeleton">
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line skeleton-text" />
      <div className="skeleton-line skeleton-text short" />
    </div>
  );
}

export function AppCardSkeleton() {
  return (
    <div className="app-card-skeleton">
      <div className="skeleton-circle" />
      <div className="skeleton-line skeleton-app-name" />
    </div>
  );
}
