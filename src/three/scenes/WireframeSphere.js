export function createScene(THREE, scene, options = {}) {
  const primaryColor = options.primaryColor || '#3b82f6';
  const secondaryColor = options.secondaryColor || '#10b981';
  let rotationSpeed = options.rotationSpeed !== undefined ? options.rotationSpeed : 1.0;
  let autoRotate = options.autoRotate !== undefined ? options.autoRotate : true;
  let wireframe = options.wireframe || false;
  let t = 0;

  // Inner solid sphere
  const innerGeo = new THREE.SphereGeometry(0.85, 32, 32);
  const innerMat = new THREE.MeshStandardMaterial({
    color: primaryColor,
    roughness: 0.3,
    metalness: 0.4,
    wireframe: wireframe,
    transparent: true,
    opacity: options.opacity !== undefined ? options.opacity : 1.0,
  });
  const innerMesh = new THREE.Mesh(innerGeo, innerMat);
  scene.add(innerMesh);

  // Outer wireframe sphere
  const outerGeo = new THREE.SphereGeometry(0.92, 16, 16);
  const wireGeo = new THREE.WireframeGeometry(outerGeo);
  const outerMat = new THREE.LineBasicMaterial({
    color: secondaryColor,
    transparent: true,
    opacity: options.opacity !== undefined ? new THREE.Color(secondaryColor) && options.opacity * 0.5 : 0.5,
  });
  const outerMesh = new THREE.LineSegments(wireGeo, outerMat);
  scene.add(outerMesh);

  return {
    update(delta) {
      t += delta;

      if (autoRotate) {
        innerMesh.rotation.y += 0.3 * delta * rotationSpeed;
        innerMesh.rotation.x += 0.1 * delta * rotationSpeed;

        outerMesh.rotation.y -= 0.15 * delta * rotationSpeed;
        outerMesh.rotation.z += 0.08 * delta * rotationSpeed;
      }

      // Inner scale pulses slightly
      const pulse = 1.0 + Math.sin(t * 3) * 0.03; // pulses between 0.97 - 1.03
      innerMesh.scale.set(pulse, pulse, pulse);
    },
    applyOptions(newOptions) {
      if (newOptions.primaryColor) {
        innerMat.color.set(newOptions.primaryColor);
      }
      if (newOptions.secondaryColor) {
        outerMat.color.set(newOptions.secondaryColor);
      }
      if (newOptions.rotationSpeed !== undefined) {
        rotationSpeed = newOptions.rotationSpeed;
      }
      if (newOptions.autoRotate !== undefined) {
        autoRotate = newOptions.autoRotate;
      }
      if (newOptions.wireframe !== undefined) {
        innerMat.wireframe = newOptions.wireframe;
      }
      if (newOptions.opacity !== undefined) {
        innerMat.opacity = newOptions.opacity;
        outerMat.opacity = newOptions.opacity * 0.5;
      }
    },
  };
}
