import { User } from "../types/editor";

// =============================================================================
// COLLABORATION CURSOR RENDERER
// =============================================================================

export const createCollaborationCursor = (user: User) => {
  const cursor = document.createElement("span");
  cursor.classList.add("collaboration-cursor__caret");
  cursor.style.cssText = `
    position: relative;
    margin-left: -1px;
    margin-right: -1px;
    border-left: 2px solid ${user.color};
    pointer-events: none;
    user-select: none;
    display: inline-block;
    height: 1.2em;
  `;

  const label = document.createElement("div");
  label.classList.add("collaboration-cursor__label");
  label.style.cssText = `
    position: absolute;
    top: -20px;
    left: -1px;
    background: ${user.color};
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
    opacity: 1;
    pointer-events: none;
    z-index: 50;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  `;
  label.textContent = user.name;
  cursor.appendChild(label);

  return cursor;
};
