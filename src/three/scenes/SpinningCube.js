export function createScene(THREE, scene, options = {}) {
  const primaryColor = options.primaryColor || '#3b82f6';
  const secondaryColor = options.secondaryColor || '#10b981';
  let rotationSpeed = options.rotationSpeed !== undefined ? options.rotationSpeed : 1.0;
  let autoRotate = options.autoRotate !== undefined ? options.autoRotate : true;
  let wireframe = options.wireframe || false;

  // Create main geometry and material
  const geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
  const material = new THREE.MeshStandardMaterial({
    color: primaryColor,
    roughness: 0.2,
    metalness: 0.5,
    wireframe: wireframe,
    transparent: true,
    opacity: options.opacity !== undefined ? options.opacity : 1.0,
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Add a nice wireframe/edge overlay in the secondary color
  const edgesGeometry = new THREE.EdgesGeometry(geometry);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: secondaryColor,
    linewidth: 2, // Note: linewidth > 1 usually not supported by WebGL implementations, but fine
    transparent: true,
    opacity: options.opacity !== undefined ? options.opacity : 1.0,
  });
  const edges = new THREE.LineSegments(edgesGeometry, lineMaterial);
  mesh.add(edges);

  return {
    update(delta) {
      if (autoRotate) {
        mesh.rotation.x += 0.4 * delta * rotationSpeed;
        mesh.rotation.y += 0.6 * delta * rotationSpeed;
      }
    },
    applyOptions(newOptions) {
      if (newOptions.primaryColor) {
        material.color.set(newOptions.primaryColor);
      }
      if (newOptions.secondaryColor) {
        lineMaterial.color.set(newOptions.secondaryColor);
      }
      if (newOptions.rotationSpeed !== undefined) {
        rotationSpeed = newOptions.rotationSpeed;
      }
      if (newOptions.autoRotate !== undefined) {
        autoRotate = newOptions.autoRotate;
      }
      if (newOptions.wireframe !== undefined) {
        material.wireframe = newOptions.wireframe;
      }
      if (newOptions.opacity !== undefined) {
        material.opacity = newOptions.opacity;
        lineMaterial.opacity = newOptions.opacity;
      }
    },
  };
}
