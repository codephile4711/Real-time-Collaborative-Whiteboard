import * as THREE from 'three';
import { SCENES } from './sceneRegistry.js';

export class ThreeRenderer {
  constructor({ width, height, sceneKey, options }) {
    this.width = width;
    this.height = height;
    this.sceneKey = sceneKey;

    // Detect WebGL support via try/catch
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      throw new Error('WebGL is not supported in this browser environment.');
    }

    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0); // Transparent background
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance

    // Create scene
    this.scene = new THREE.Scene();

    // Create camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 3.2);

    // Setup lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 5, 5);
    this.scene.add(dirLight);

    // Look up and initialize the selected scene
    const sceneDef = SCENES[sceneKey];
    if (!sceneDef) {
      throw new Error(`Scene key "${sceneKey}" not found in registry.`);
    }

    // Call factory to build the actual meshes/animations
    this.sceneHandle = sceneDef.factory(THREE, this.scene, options);
  }

  tick(delta) {
    if (this.sceneHandle && this.sceneHandle.update) {
      // Ensure delta is reasonable to avoid massive jumps during lag spikes
      const cappedDelta = Math.min(delta, 0.1);
      this.sceneHandle.update(cappedDelta);
    }
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  getCanvas() {
    return this.renderer.domElement;
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    if (this.renderer) {
      this.renderer.setSize(w, h);
    }
    if (this.camera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }

  updateOptions(options) {
    if (this.sceneHandle && this.sceneHandle.applyOptions) {
      this.sceneHandle.applyOptions(options);
    }
  }

  dispose() {
    if (this.renderer) {
      this.renderer.dispose();
    }
    // Traverse scene and dispose of geometries & materials
    this.scene.traverse((object) => {
      if (!object.isMesh && !object.isPoints && !object.isLineSegments) return;
      
      if (object.geometry) {
        object.geometry.dispose();
      }
      
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
}
