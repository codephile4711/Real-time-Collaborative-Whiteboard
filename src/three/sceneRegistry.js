import { createScene as createSpinningCube } from './scenes/SpinningCube.js';
import { createScene as createFloatingText } from './scenes/FloatingText3D.js';
import { createScene as createParticleCloud } from './scenes/ParticleCloud.js';
import { createScene as createWireframeSphere } from './scenes/WireframeSphere.js';
import { createScene as createTorusKnot } from './scenes/TorusKnot.js';

export const SCENES = {
  spinningCube: {
    label: 'Spinning cube',
    description: 'Rotating box with edge overlay',
    factory: createSpinningCube,
    hasWireframeOption: true,
  },
  floatingText: {
    label: 'Floating text',
    description: 'Bobbing 3D torus (font placeholder)',
    factory: createFloatingText,
    hasWireframeOption: false,
  },
  particleCloud: {
    label: 'Particle cloud',
    description: '600-point breathing sphere',
    factory: createParticleCloud,
    hasWireframeOption: false,
  },
  wireframeSphere: {
    label: 'Wireframe sphere',
    description: 'Dual-mesh pulsing globe',
    factory: createWireframeSphere,
    hasWireframeOption: true,
  },
  torusKnot: {
    label: 'Torus knot',
    description: 'Metallic twist with orbiting light',
    factory: createTorusKnot,
    hasWireframeOption: false,
  },
};
