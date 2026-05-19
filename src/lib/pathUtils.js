import simplify from 'simplify-js';

/**
 * Simplifies a list of points using the Ramer-Douglas-Peucker algorithm.
 * Compresses freehand coordinates to reduce stored/synced data.
 */
export function compressPath(points, tolerance = 1.5) {
  if (points.length <= 2) return points;
  try {
    // simplify-js expects {x, y} format by default
    return simplify(points, tolerance, true);
  } catch (error) {
    console.error('Error simplifying path:', error);
    return points;
  }
}

/**
 * Converts a simplified list of points into a flat coordinate array suitable for Konva.Line (e.g. [x1, y1, x2, y2, ...])
 */
export function flattenPoints(points) {
  const arr = [];
  for (let i = 0; i < points.length; i++) {
    arr.push(points[i].x, points[i].y);
  }
  return arr;
}
