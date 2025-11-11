import React, { useEffect, useState } from "react";
import { NewsCardSkeleton } from "../ui/SkeletonLoader";
import ErrorMessage from "../ui/ErrorMessage";

export default function WordPressNews({
  feedUrl,
  maxItems = 2,
  theme = "light",
}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [overlayVisible, setOverlayVisible] = useState(false);

  const getSnippet = (html, wordCount = 20) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    return text.split(" ").slice(0, wordCount).join(" ") + "...";
  };

  const fetchFeed = async () => {
    try {
      setLoading(true);
      setError(null);
      const rssApiUrl =
        process.env.REACT_APP_RSS_API_URL ||
        "https://api.rss2json.com/v1/api.json";
      const res = await fetch(
        `${rssApiUrl}?rss_url=${encodeURIComponent(feedUrl)}`
      );
      if (!res.ok) throw new Error("No se pudo cargar el feed RSS");
      const data = await res.json();

      if (data.status !== "ok") {
        throw new Error("El servicio de RSS devolvió un error");
      }

      const formatted = data.items.slice(0, maxItems).map((post) => ({
        title: post.title,
        pubDate: post.pubDate,
        snippet: getSnippet(post.content, 20),
        fullContent: post.content,
        link: post.link,
      }));
      setPosts(formatted);
    } catch (err) {
      console.error("WordPress RSS fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [feedUrl, maxItems]);

  const handleMouseEnter = (index) => {
    setHoveredIndex(index);
    setOverlayVisible(true);
  };

  const handleMouseLeave = () => {
    setOverlayVisible(false);
    setTimeout(() => setHoveredIndex(null), 400); // wait for exit animation
  };

  // Determine if dark mode based on theme prop
  const isDarkMode = theme === "dark";

  // Helper to check if post is new (2 days or less)
  const isNewPost = (pubDate) => {
    const postDate = new Date(pubDate);
    const now = new Date();
    const diffInMs = now - postDate;
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    return diffInDays <= 2;
  };

  return (
    <div
      style={{
        marginTop: 40,
        maxWidth: 700,
        marginInline: "auto",
        position: "relative",
      }}
    >
      <h3 className="section-heading">Devocionales</h3>

      {loading && (
        <div>
          {[...Array(maxItems)].map((_, i) => (
            <NewsCardSkeleton key={i} />
          ))}
        </div>
      )}

      {error && (
        <ErrorMessage
          title="Error al cargar devocionales"
          message={`No pudimos cargar los devocionales. ${error}`}
          onRetry={fetchFeed}
          variant="warning"
        />
      )}

      {!loading && !error && posts.length === 0 && (
        <ErrorMessage
          title="Sin devocionales"
          message="No hay devocionales disponibles en este momento."
          variant="info"
        />
      )}

      {!loading && !error && posts.length > 0 && (
        <div
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
          onMouseLeave={handleMouseLeave}
        >
          {posts.map((post, i) => (
            <div
              key={i}
              onMouseEnter={() => handleMouseEnter(i)}
              className="wordpress-news-item"
              style={{
                background: isDarkMode ? "#263041" : "#f9f9f9",
                borderRadius: 12,
                padding: 20,
                boxShadow: isDarkMode
                  ? "0 3px 8px rgba(0,0,0,0.6)"
                  : "0 3px 8px rgba(0,0,0,0.15)",
                cursor: "pointer",
                minHeight: 150,
                position: "relative",
                overflow: "hidden",
                transition:
                  "transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease",
                transform:
                  hoveredIndex === i
                    ? "scale(1.03) translateY(-5px)"
                    : "scale(1)",
                zIndex: hoveredIndex === i ? 10 : 1,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
              >
                <h4
                  style={{
                    color: isDarkMode ? "#e9eef5" : "#111",
                    flex: 1,
                    margin: 0,
                  }}
                >
                  {post.title}
                </h4>
                {isNewPost(post.pubDate) && (
                  <span
                    style={{
                      background: "#8b5cf6",
                      color: "white",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 6,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      flexShrink: 0,
                    }}
                  >
                    Nuevo
                  </span>
                )}
              </div>
              <small
                style={{
                  color: isDarkMode ? "#9ea9b6" : "#666",
                  marginBottom: 10,
                  marginTop: 8,
                  display: "block",
                }}
              >
                {new Date(post.pubDate).toLocaleDateString()}
              </small>
              <p style={{ color: isDarkMode ? "#c8d1dc" : "#333" }}>
                {post.snippet}
              </p>
            </div>
          ))}

          {/* Overlay for full content */}
          {hoveredIndex !== null && (
            <div
              role={overlayVisible ? "dialog" : "presentation"}
              aria-hidden={!overlayVisible}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: isDarkMode
                  ? "rgba(38, 48, 65, 0.98)"
                  : "rgba(255,255,255,0.98)",
                color: isDarkMode ? "#e9eef5" : "#111",
                padding: 30,
                boxSizing: "border-box",
                overflowY: "auto",
                zIndex: 50,
                display: "flex",
                flexDirection: "column",
                gap: 20,
                borderRadius: 12, // Rounded corners for expanded view
                pointerEvents: overlayVisible ? "auto" : "none", // <-- prevents the invisible overlay from intercepting mouse events during fade-out
                animation: overlayVisible
                  ? "slideFadeIn 0.4s forwards"
                  : "slideFadeOut 0.4s forwards",
              }}
            >
              <h4 style={{ color: isDarkMode ? "#e9eef5" : "#111" }}>
                {posts[hoveredIndex].title}
              </h4>
              <small
                style={{
                  color: isDarkMode ? "#9ea9b6" : "#666",
                  display: "block",
                  marginBottom: 10,
                }}
              >
                {new Date(posts[hoveredIndex].pubDate).toLocaleDateString()}
              </small>
              <div
                style={{
                  color: isDarkMode ? "#c8d1dc" : "#333",
                  textAlign: "justify",
                }}
                dangerouslySetInnerHTML={{
                  __html: posts[hoveredIndex].fullContent,
                }}
              ></div>
              <a
                href={posts[hoveredIndex].link}
                target="_blank"
                rel="noreferrer"
                style={{
                  marginTop: 15,
                  display: "inline-block",
                  color: isDarkMode ? "#6ba3ff" : "#0066cc",
                }}
              >
                Lee más en WordPress
              </a>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideFadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideFadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
