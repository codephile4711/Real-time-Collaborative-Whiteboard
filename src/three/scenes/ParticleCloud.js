export function createScene(THREE, scene, options = {}) {
  const primaryColor = options.primaryColor || '#3b82f6';
  let rotationSpeed = options.rotationSpeed !== undefined ? options.rotationSpeed : 1.0;
  let autoRotate = options.autoRotate !== undefined ? options.autoRotate : true;
  let t = 0;

  const count = 600;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const baseDirections = new Float32Array(count * 3); // Store direction vectors for breathing calculations

  for (let i = 0; i < count; i++) {
    // Generate uniform random points on sphere
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    
    // Random radius between 0.8 and 1.4
    const r = 0.8 + Math.random() * 0.6;
    
    const dx = Math.sin(phi) * Math.cos(theta);
    const dy = Math.sin(phi) * Math.sin(theta);
    const dz = Math.cos(phi);

    baseDirections[i * 3] = dx;
    baseDirections[i * 3 + 1] = dy;
    baseDirections[i * 3 + 2] = dz;

    positions[i * 3] = dx * r;
    positions[i * 3 + 1] = dy * r;
    positions[i * 3 + 2] = dz * r;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: primaryColor,
    size: 0.04,
    transparent: true,
    opacity: options.opacity !== undefined ? options.opacity : 1.0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const pointsMesh = new THREE.Points(geometry, material);
  scene.add(pointsMesh);

  return {
    update(delta) {
      t += delta;
      
      if (autoRotate) {
        pointsMesh.rotation.y += 0.2 * delta * rotationSpeed;
        pointsMesh.rotation.x += 0.1 * delta * rotationSpeed;
      }

      // Breathing effect: oscillate particles along their direction vectors
      const posAttr = geometry.attributes.position;
      const posArray = posAttr.array;
      const breathingFactor = 1.0 + Math.sin(t * 2.0) * 0.15; // breathing pulse

      for (let i = 0; i < count; i++) {
        const dx = baseDirections[i * 3];
        const dy = baseDirections[i * 3 + 1];
        const dz = baseDirections[i * 3 + 2];
        
        // Base distance from center
        const baseRadius = 0.8 + (i % 10) * 0.06;
        const currentRadius = baseRadius * breathingFactor;

        posArray[i * 3] = dx * currentRadius;
        posArray[i * 3 + 1] = dy * currentRadius;
        posArray[i * 3 + 2] = dz * currentRadius;
      }
      posAttr.needsUpdate = true;
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
