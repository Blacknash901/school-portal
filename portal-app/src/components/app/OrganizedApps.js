import React, { useState, useEffect } from "react";
import AppCard from "./AppCard";
import { CATEGORY_NAMES } from "../../data/apps";
import "./OrganizedApps.css";

export default function OrganizedApps({ apps, role }) {
  const [editMode, setEditMode] = useState(false);
  const [organizedApps, setOrganizedApps] = useState({});
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [ghostPosition, setGhostPosition] = useState({ x: 0, y: 0 });
  const [showGhost, setShowGhost] = useState(false);

  // Load saved order from localStorage or use default
  useEffect(() => {
    const savedOrder = localStorage.getItem(`app-order-${role}`);
    if (savedOrder) {
      try {
        setOrganizedApps(JSON.parse(savedOrder));
      } catch (err) {
        console.error("Failed to parse saved app order:", err);
        organizeApps(apps);
      }
    } else {
      organizeApps(apps);
    }
  }, [apps, role]);

  // Organize apps by category
  const organizeApps = (appsList) => {
    const organized = {};
    appsList.forEach((app) => {
      const category = app.category || "other";
      if (!organized[category]) {
        organized[category] = [];
      }
      organized[category].push(app);
    });
    setOrganizedApps(organized);
  };

  // Save order to localStorage
  const saveOrder = (newOrder) => {
    setOrganizedApps(newOrder);
    localStorage.setItem(`app-order-${role}`, JSON.stringify(newOrder));
  };

  // Handle drag start
  const handleDragStart = (e, app, category) => {
    if (!editMode) {
      e.preventDefault();
      return;
    }

    console.log("🚀 DRAG START:", app.name);

    setDraggedItem({ app, category });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", app.id);

    // Create invisible drag image
    try {
      const dragImage = document.createElement("div");
      dragImage.style.position = "absolute";
      dragImage.style.top = "-9999px";
      dragImage.style.width = "1px";
      dragImage.style.height = "1px";
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => {
        if (document.body.contains(dragImage)) {
          document.body.removeChild(dragImage);
        }
      }, 0);
    } catch (error) {
      console.log("Could not set custom drag image:", error);
    }

    setShowGhost(true);
    setGhostPosition({ x: e.clientX, y: e.clientY });
  };

  // Handle drag
  const handleDrag = (e) => {
    if (e.clientX === 0 && e.clientY === 0) return; // Ignore final drag event
    setGhostPosition({ x: e.clientX, y: e.clientY });
  };

  // Handle drag end
  const handleDragEnd = (e) => {
    console.log("🏁 DRAG END");
    setDraggedItem(null);
    setDragOverItem(null);
    setShowGhost(false);
  };

  // Handle drag enter
  const handleDragEnter = (e, targetApp, targetCategory) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editMode || !draggedItem) return;

    const { app: sourceApp, category: sourceCategory } = draggedItem;

    // Only show preview if same category and not hovering over itself
    if (sourceCategory === targetCategory && sourceApp.id !== targetApp.id) {
      setDragOverItem({ app: targetApp, category: targetCategory });
    }
  };

  // Handle drag over - CRITICAL for enabling drops
  const handleDragOver = (e, targetApp, targetCategory) => {
    if (!editMode || !draggedItem) return;

    e.preventDefault(); // MUST prevent default to allow drop
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";

    const { app: sourceApp, category: sourceCategory } = draggedItem;

    if (sourceCategory === targetCategory && sourceApp.id !== targetApp.id) {
      setDragOverItem({ app: targetApp, category: targetCategory });
    }
  };

  // Handle drop
  const handleDrop = (e, targetApp, targetCategory) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editMode || !draggedItem) return;

    const { app: sourceApp, category: sourceCategory } = draggedItem;

    console.log("🎯 DROP EVENT:", {
      source: sourceApp.name,
      target: targetApp.name,
      sourceCategory,
      targetCategory,
    });

    // Can only reorder within same category
    if (sourceCategory !== targetCategory) {
      console.log("❌ Different categories, aborting");
      setDraggedItem(null);
      setDragOverItem(null);
      setShowGhost(false);
      return;
    }

    // Don't do anything if dropping on the same item
    if (sourceApp.id === targetApp.id) {
      console.log("❌ Same item, aborting");
      setDraggedItem(null);
      setDragOverItem(null);
      setShowGhost(false);
      return;
    }

    const newOrder = { ...organizedApps };
    const categoryApps = [...newOrder[sourceCategory]];

    // Find BOTH indices BEFORE making any changes
    const sourceIndex = categoryApps.findIndex((a) => a.id === sourceApp.id);
    const targetIndex = categoryApps.findIndex((a) => a.id === targetApp.id);

    if (sourceIndex === -1) {
      console.log("❌ Source not found");
      return;
    }
    if (targetIndex === -1) {
      console.log("❌ Target not found");
      return;
    }

    console.log(
      `✅ Moving ${sourceApp.name} from index ${sourceIndex} to ${targetIndex}`
    );
    console.log(
      "📦 Before:",
      categoryApps.map((a) => a.name)
    );

    // Remove source app
    const [removed] = categoryApps.splice(sourceIndex, 1);

    // Adjust target index if source was before target
    const adjustedTargetIndex =
      sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;

    // Insert at adjusted target position
    categoryApps.splice(adjustedTargetIndex, 0, removed);

    console.log(
      "📦 After:",
      categoryApps.map((a) => a.name)
    );

    newOrder[sourceCategory] = categoryApps;
    setOrganizedApps(newOrder);
    localStorage.setItem(`app-order-${role}`, JSON.stringify(newOrder));

    // Reset drag state
    setDraggedItem(null);
    setDragOverItem(null);
    setShowGhost(false);
  };

  // Reset to default order
  const resetOrder = () => {
    organizeApps(apps);
    localStorage.removeItem(`app-order-${role}`);
  };

  // Get categories in display order (work, office, admin)
  const categoryOrder = ["work", "office", "payments", "admin"];
  const visibleCategories = categoryOrder.filter(
    (cat) => organizedApps[cat] && organizedApps[cat].length > 0
  );

  return (
    <div className="organized-apps-container">
      {/* Header */}
      <div className="apps-header">
        <h3 className="section-heading">Aplicaciones</h3>
        {/* TEMPORARILY DISABLED - drag-and-drop needs refinement
        <div className="apps-controls">
          {editMode && (
            <button
              className="reset-order-btn"
              onClick={resetOrder}
              title="Restablecer orden"
            >
              ↺
            </button>
          )}
          <button
            className={`edit-mode-btn ${editMode ? "active" : ""}`}
            onClick={() => setEditMode(!editMode)}
            title={editMode ? "Guardar cambios" : "Editar orden"}
          >
            {editMode ? "✓ Guardar" : "✎ Editar"}
          </button>
        </div>
        */}
      </div>

      {editMode && (
        <p className="edit-mode-hint">
          Arrastra las aplicaciones para reorganizarlas dentro de cada categoría
        </p>
      )}

      {/* Display apps by category */}
      {visibleCategories.map((category) => (
        <div key={category} className="app-category-section">
          <h4 className="category-title">{CATEGORY_NAMES[category]}</h4>
          <div className="apps-grid">
            {organizedApps[category].map((app, index) => {
              const isDragging = draggedItem?.app.id === app.id;
              const isTargetForDrop =
                dragOverItem?.app.id === app.id &&
                dragOverItem?.category === category;

              return (
                <React.Fragment key={app.id}>
                  {/* Show placeholder where item will drop */}
                  {isTargetForDrop && draggedItem && (
                    <div className="app-placeholder" />
                  )}

                  <div
                    className={`app-wrapper ${editMode ? "draggable" : ""} ${
                      isDragging ? "is-dragging" : ""
                    }`}
                    draggable={editMode}
                    onDragStart={(e) => handleDragStart(e, app, category)}
                    onDrag={handleDrag}
                    onDragEnd={handleDragEnd}
                    onDragEnter={(e) => handleDragEnter(e, app, category)}
                    onDragOver={(e) => handleDragOver(e, app, category)}
                    onDrop={(e) => handleDrop(e, app, category)}
                    onClick={(e) => {
                      if (editMode) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  >
                    <AppCard app={app} editMode={editMode} />
                    {editMode && (
                      <div className="drag-handle" title="Arrastra para mover">
                        ⋮⋮
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ))}

      {/* Custom drag ghost that follows cursor */}
      {showGhost && draggedItem && (
        <div
          className="drag-ghost"
          style={{
            left: ghostPosition.x - 60,
            top: ghostPosition.y - 55,
          }}
        >
          <AppCard app={draggedItem.app} />
        </div>
      )}
    </div>
  );
}
