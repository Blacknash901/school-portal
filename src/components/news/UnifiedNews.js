// src/UnifiedNews.js
import React from "react";

const staticNews = [
  {
    title: "Upcoming School Event: Science Fair 2025",
    date: "2025-10-30",
    description:
      "Join us for the annual Science Fair showcasing projects from all grades. Parents are welcome!",
    source: "School",
    link: "#",
  },
  {
    title: "Microsoft Teams Upgrade",
    date: "2025-10-15",
    description:
      "Teams will receive a major update next week with improved performance and new classroom tools.",
    source: "School",
    link: "#",
  },
  {
    title: "New Moodle Theme",
    date: "2025-10-10",
    description:
      "Our Moodle platform now has a new, mobile-friendly theme. Try it out at moodle.cecre.net.",
    source: "School",
    link: "https://moodle.cecre.net",
  },
  {
    title: "Library Renovation Completed",
    date: "2025-09-30",
    description:
      "Our school library has been renovated with new reading corners and computer stations.",
    source: "School",
    link: "#",
  },
];

// Soft, modern rainbow palette (pastel tones for light mode)
const pastelPalette = [
  "#FFD1DC", // pink
  "#FFECB3", // soft yellow
  "#C8E6C9", // light green
  "#BBDEFB", // light blue
  "#D1C4E9", // lavender
  "#FFE0B2", // peach
  "#B2EBF2", // aqua
];

// Dark mode palette (darker, muted colors)
const darkPalette = [
  "#3d2a33", // dark rose
  "#3d3520", // dark yellow
  "#2a3d2f", // dark green
  "#2a3648", // dark blue
  "#352d44", // dark lavender
  "#3d2f20", // dark peach
  "#203d3d", // dark aqua
];

export default function UnifiedNews({ theme = "light" }) {
  const sortedNews = staticNews
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  // Determine if dark mode based on theme prop
  const isDarkMode = theme === "dark";
  const palette = isDarkMode ? darkPalette : pastelPalette;

  return (
    <div style={{ maxWidth: 900, marginInline: "auto" }}>
      <h3 className="section-heading">Noticias</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}
      >
        {sortedNews.map((item, i) => {
          const bgColor = palette[Math.floor(Math.random() * palette.length)];

          return (
            <div
              key={i}
              className="news-card"
              style={{
                background: bgColor,
                borderRadius: 16,
                padding: 25,
                boxShadow: isDarkMode
                  ? "0 4px 10px rgba(0,0,0,0.6)"
                  : "0 4px 10px rgba(0,0,0,0.15)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 220,
                transition:
                  "transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = isDarkMode
                  ? "0 6px 15px rgba(0,0,0,0.8)"
                  : "0 6px 15px rgba(0,0,0,0.25)";
                e.currentTarget.style.background = lightenColor(bgColor, 15);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = isDarkMode
                  ? "0 4px 10px rgba(0,0,0,0.6)"
                  : "0 4px 10px rgba(0,0,0,0.15)";
                e.currentTarget.style.background = bgColor;
              }}
            >
              <div>
                <h4
                  style={{
                    fontSize: "1.2rem",
                    marginBottom: 6,
                    color: isDarkMode ? "#e9eef5" : "#111",
                  }}
                >
                  {item.title}
                </h4>
                <small
                  style={{
                    color: isDarkMode ? "#9ea9b6" : "#444",
                    marginBottom: 10,
                    display: "block",
                  }}
                >
                  {new Date(item.date).toLocaleDateString()} • {item.source}
                </small>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: isDarkMode ? "#c8d1dc" : "#333",
                  }}
                >
                  {item.description}
                </p>
              </div>
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                style={{
                  marginTop: 15,
                  color: isDarkMode ? "#6ba3ff" : "#004a99",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                Read more →
              </a>
            </div>
          );
        })}
      </div>

      {/* View All News Button */}
      <div style={{ textAlign: "center", marginTop: 30 }}>
        <a
          href="/news"
          style={{
            display: "inline-block",
            padding: "12px 25px",
            backgroundColor: isDarkMode ? "#4a90e2" : "#004a99",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: "bold",
            transition: "background 0.3s",
          }}
          onMouseEnter={(e) =>
            (e.target.style.backgroundColor = isDarkMode
              ? "#3b82f6"
              : "#003366")
          }
          onMouseLeave={(e) =>
            (e.target.style.backgroundColor = isDarkMode
              ? "#4a90e2"
              : "#004a99")
          }
        >
          View All News
        </a>
      </div>
    </div>
  );
}

// helper to slightly lighten color
function lightenColor(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}
