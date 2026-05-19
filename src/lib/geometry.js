/**
 * Checks if a point is within distance of a line segment.
 */
export function getDistance(p1, p2) {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

/**
 * Snaps a target endpoint (x, y) to the bounding box of any nearby element.
 * If the point is within 20px of the edge of an element's bounding box,
 * it returns the snapped coordinates. Otherwise, returns the original coordinates.
 */
export function snapToElementEdges(x, y, elements, excludeId, threshold = 20) {
  let closestX = x;
  let closestY = y;
  let minDistance = threshold;

  for (const el of elements.values()) {
    if (el.id === excludeId || el.type === 'path' || el.type === 'arrow') {
      continue; // Skip lines/paths/arrows for simpler edge snapping
    }

    // Bounding box boundary coordinates
    const left = el.x;
    const right = el.x + el.width;
    const top = el.y;
    const bottom = el.y + el.height;

    // Check distances to the 4 edges
    // 1. Left Edge
    if (y >= top && y <= bottom) {
      const distLeft = Math.abs(x - left);
      if (distLeft < minDistance) {
        minDistance = distLeft;
        closestX = left;
        closestY = y;
      }
    }
    // 2. Right Edge
    if (y >= top && y <= bottom) {
      const distRight = Math.abs(x - right);
      if (distRight < minDistance) {
        minDistance = distRight;
        closestX = right;
        closestY = y;
      }
    }
    // 3. Top Edge
    if (x >= left && x <= right) {
      const distTop = Math.abs(y - top);
      if (distTop < minDistance) {
        minDistance = distTop;
        closestX = x;
        closestY = top;
      }
    }
    // 4. Bottom Edge
    if (x >= left && x <= right) {
      const distBottom = Math.abs(y - bottom);
      if (distBottom < minDistance) {
        minDistance = distBottom;
        closestX = x;
        closestY = bottom;
      }
    }

    // Check corners
    const corners = [
      { x: left, y: top },
      { x: right, y: top },
      { x: left, y: bottom },
      { x: right, y: bottom },
    ];
    for (const corner of corners) {
      const dist = getDistance({ x, y }, corner);
      if (dist < minDistance) {
        minDistance = dist;
        closestX = corner.x;
        closestY = corner.y;
      }
    }
  }

  return { x: closestX, y: closestY };
}

/**
 * Snap a coordinate to a grid of size gridSz if enabled.
 */
export function snapToGrid(coord, gridSz = 20) {
  return Math.round(coord / gridSz) * gridSz;
}
