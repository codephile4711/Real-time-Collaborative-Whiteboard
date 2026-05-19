export function createScene(THREE, scene, options = {}) {
  const primaryColor = options.primaryColor || '#3b82f6';
  const secondaryColor = options.secondaryColor || '#10b981';
  let rotationSpeed = options.rotationSpeed !== undefined ? options.rotationSpeed : 1.0;
  let autoRotate = options.autoRotate !== undefined ? options.autoRotate : true;
  let t = 0;

  const geometry = new THREE.TorusKnotGeometry(0.7, 0.22, 120, 16);
  const material = new THREE.MeshStandardMaterial({
    color: primaryColor,
    metalness: 0.7,
    roughness: 0.15,
    transparent: true,
    opacity: options.opacity !== undefined ? options.opacity : 1.0,
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Orbiting point light in secondaryColor
  const orbitLight = new THREE.PointLight(secondaryColor, 1.5, 10);
  scene.add(orbitLight);

  // Visual helper for the light so we can see it orbiting
  const lightGeo = new THREE.SphereGeometry(0.05, 8, 8);
  const lightMat = new THREE.MeshBasicMaterial({ color: secondaryColor });
  const lightSphere = new THREE.Mesh(lightGeo, lightMat);
  orbitLight.add(lightSphere);

  return {
    update(delta) {
      t += delta;

      if (autoRotate) {
        mesh.rotation.x += 0.3 * delta * rotationSpeed;
        mesh.rotation.y += 0.5 * delta * rotationSpeed;
      }

      // Orbit logic: circular movement around Y-axis
      const radius = 2.0;
      orbitLight.position.x = Math.sin(t * 1.5) * radius;
      orbitLight.position.z = Math.cos(t * 1.5) * radius;
      orbitLight.position.y = Math.sin(t * 0.5) * 0.5; // slight up and down wave
    },
    applyOptions(newOptions) {
      if (newOptions.primaryColor) {
        material.color.set(newOptions.primaryColor);
      }
      if (newOptions.secondaryColor) {
        orbitLight.color.set(newOptions.secondaryColor);
        lightMat.color.set(newOptions.secondaryColor);
      }
      if (newOptions.rotationSpeed !== undefined) {
        rotationSpeed = newOptions.rotationSpeed;
      }
      if (newOptions.autoRotate !== undefined) {
        autoRotate = newOptions.autoRotate;
      }
      if (newOptions.opacity !== undefined) {
        material.opacity = newOptions.opacity;
        lightMat.opacity = newOptions.opacity;
      }
    },
  };
}
