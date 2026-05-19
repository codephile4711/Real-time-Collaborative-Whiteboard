export function createScene(THREE, scene, options = {}) {
  const primaryColor = options.primaryColor || '#3b82f6';
  let rotationSpeed = options.rotationSpeed !== undefined ? options.rotationSpeed : 1.0;
  let autoRotate = options.autoRotate !== undefined ? options.autoRotate : true;
  let t = 0;

  // NOTE: TextGeometry requires downloading a typeface.json font and loading it asynchronously.
  // To avoid asynchronous hydration mismatch and blocking load state, we use a torus knot/ring
  // shape as a visual 3D placeholder. To implement real 3D text in production, load a Font
  // using FontLoader and instantiate TextGeometry(options.label || "3D", { font, size: 0.4, depth: 0.1 })
  const geometry = new THREE.TorusGeometry(0.5, 0.18, 12, 40);
  const material = new THREE.MeshStandardMaterial({
    color: primaryColor,
    roughness: 0.1,
    metalness: 0.8,
    transparent: true,
    opacity: options.opacity !== undefined ? options.opacity : 1.0,
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  return {
    update(delta) {
      t += delta;
      
      // Floating bobbing motion on the Y axis
      mesh.position.y = Math.sin(t * 1.2) * 0.15;
      
      if (autoRotate) {
        mesh.rotation.y += 0.3 * delta * rotationSpeed;
        mesh.rotation.x = Math.sin(t * 0.5) * 0.1; // Gentle sway
      }
    },
    applyOptions(newOptions) {
      if (newOptions.primaryColor) {
        material.color.set(newOptions.primaryColor);
      }
      if (newOptions.rotationSpeed !== undefined) {
        rotationSpeed = newOptions.rotationSpeed;
      }
      if (newOptions.autoRotate !== undefined) {
        autoRotate = newOptions.autoRotate;
      }
      if (newOptions.opacity !== undefined) {
        material.opacity = newOptions.opacity;
      }
    },
  };
}
