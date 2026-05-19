import { STICKY_COLORS } from '../lib/colors.js';

export const ELEMENT_TYPES = {
  STICKY: 'sticky',
  PATH: 'path',
  RECT: 'rect',
  ELLIPSE: 'ellipse',
  ARROW: 'arrow',
  TEXT: 'text',
  IMAGE: 'image',
  THREED: 'threed',
};

/**
 * Generates initial attributes for a given element type based on the spec definitions.
 */
export function createDefaultElement(type, data = {}) {
  const base = {
    id: data.id || '',
    type,
    x: data.x || 0,
    y: data.y || 0,
    width: data.width || 100,
    height: data.height || 100,
    rotation: data.rotation || 0,
    locked: data.locked || false,
    zIndex: data.zIndex || 0,
    createdBy: data.createdBy || 'anonymous',
    createdAt: data.createdAt || Date.now(),
    updatedAt: data.updatedAt || Date.now(),
  };

  switch (type) {
    case ELEMENT_TYPES.STICKY:
      return {
        ...base,
        width: data.width || 200,
        height: data.height || 120,
        text: data.text || '',
        color: data.color || STICKY_COLORS[0],
        fontSize: data.fontSize || 16,
      };

    case ELEMENT_TYPES.PATH:
      return {
        ...base,
        points: data.points || [], // Array of {x, y}
        stroke: data.stroke || '#000000',
        strokeWidth: data.strokeWidth || 3,
        opacity: data.opacity !== undefined ? data.opacity : 1.0,
      };

    case ELEMENT_TYPES.RECT:
      return {
        ...base,
        fill: data.fill || 'transparent',
        stroke: data.stroke || '#000000',
        strokeWidth: data.strokeWidth || 2,
        cornerRadius: data.cornerRadius || 0,
      };

    case ELEMENT_TYPES.ELLIPSE:
      return {
        ...base,
        fill: data.fill || 'transparent',
        stroke: data.stroke || '#000000',
        strokeWidth: data.strokeWidth || 2,
      };

    case ELEMENT_TYPES.ARROW:
      return {
        ...base,
        x2: data.x2 || (base.x + 100),
        y2: data.y2 || (base.y + 100),
        stroke: data.stroke || '#000000',
        strokeWidth: data.strokeWidth || 2,
        startArrow: data.startArrow || false,
        endArrow: data.endArrow || true,
      };

    case ELEMENT_TYPES.TEXT:
      return {
        ...base,
        width: data.width || 150,
        height: data.height || 40,
        text: data.text || 'Double click to edit',
        fontSize: data.fontSize || 20,
        fontFamily: data.fontFamily || 'Inter',
        fill: data.fill || '#000000',
        align: data.align || 'left',
        bold: data.bold || false,
        italic: data.italic || false,
      };

    case ELEMENT_TYPES.IMAGE:
      return {
        ...base,
        src: data.src || '', // Base64 data URL
        naturalWidth: data.naturalWidth || 0,
        naturalHeight: data.naturalHeight || 0,
      };

    case ELEMENT_TYPES.THREED:
      return {
        ...base,
        width: data.width || 280,
        height: data.height || 280,
        scene: data.scene || 'spinningCube',
        primaryColor: data.primaryColor || '#3B82F6',
        secondaryColor: data.secondaryColor || '#10B981',
        autoRotate: data.autoRotate !== undefined ? data.autoRotate : true,
        rotationSpeed: data.rotationSpeed !== undefined ? data.rotationSpeed : 1.0,
        wireframe: data.wireframe || false,
        opacity: data.opacity !== undefined ? data.opacity : 1.0,
        label: data.label || '',
      };

    default:
      return base;
  }
}
