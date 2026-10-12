import {
  ACESFilmicToneMapping, Box3, Color, DirectionalLight, Group, HemisphereLight,
  LoadingManager, Material, Mesh, PerspectiveCamera, PMREMGenerator, Scene,
  Quaternion, Spherical, Texture, Vector3, WebGLRenderer, type WebGLRenderTarget,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { sceneConfig, type CameraPose } from './config';

export interface SceneStats { fps: number; dpr: number; drawCalls: number; triangles: number }

export class KatanaScene {
  readonly renderer: WebGLRenderer;
  readonly camera = new PerspectiveCamera(36, 1, 0.025, 100);
  readonly scene = new Scene();
  controls: OrbitControls;
  readonly model = new Group();
  private environment: WebGLRenderTarget;
  private draco = new DRACOLoader();
  private basis = new KTX2Loader();
  private manager = new LoadingManager();
  private dirty = true;
  private disposed = false;
  private exploring = false;
  private resetPose: CameraPose | null = null;
  private pixelRatio: number;
  private frameCount = 0;
  private frameSeconds = 0;
  private slowWindows = 0;
  private lastFrame = 0;
  private onFrame?: (stats: SceneStats) => void;

  constructor(canvas: HTMLCanvasElement, private onContextLost: () => void) {
    this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: new URLSearchParams(location.search).has('capture') });
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = sceneConfig.renderer.exposure;
    this.renderer.setClearColor(new Color('#171713'), 0);
    this.pixelRatio = Math.min(devicePixelRatio, innerWidth < sceneConfig.breakpoint ? sceneConfig.renderer.mobileDpr : sceneConfig.renderer.desktopDpr);
    this.renderer.setPixelRatio(this.pixelRatio);
    const room = new RoomEnvironment();
    const pmrem = new PMREMGenerator(this.renderer);
    this.environment = pmrem.fromScene(room, 0.025);
    this.scene.environment = this.environment.texture;
    this.scene.environmentIntensity = 0.75;
    room.dispose();
    pmrem.dispose();
    this.scene.add(new HemisphereLight('#efe8d9', '#302921', 0.8));
    const key = new DirectionalLight('#fff2dd', 2.5);
    key.position.set(-2, 4, 5);
    const rim = new DirectionalLight('#c6cddd', 1.65);
    rim.position.set(2, -1, -3);
    const warm = new DirectionalLight('#b9583e', 0.65);
    warm.position.set(-4, 1, -2);
    this.scene.add(key, rim, warm, this.model);
    this.draco.setDecoderPath('/assets/decoders/draco/');
    this.basis.setTranscoderPath('/assets/decoders/basis/').detectSupport(this.renderer);
    this.controls = this.createControls();
    canvas.addEventListener('webglcontextlost', this.contextLost);
    this.resize();
    this.renderer.setAnimationLoop(this.render);
  }

  async load(url: string, onProgress: (percent: number | null) => void): Promise<void> {
    const loader = new GLTFLoader(this.manager).setDRACOLoader(this.draco).setKTX2Loader(this.basis).setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(url, event => onProgress(event.lengthComputable ? Math.round(event.loaded / event.total * 100) : null));
    const source = gltf.scene;
    const presentation = source.getObjectByName(sceneConfig.model.presentationNode);
    if (presentation) {
      presentation.rotation.set(0, 0, 0);
      source.rotation.set(...sceneConfig.model.sourceRotation);
    }
    source.traverse(object => {
      if (object instanceof Mesh && sceneConfig.model.hiddenMeshes.test(object.name)) object.visible = false;
    });
    // Find the longest source axis, orient it horizontally, then normalize the model.
    const visibleBounds = (): Box3 => {
      source.updateMatrixWorld(true);
      const bounds = new Box3();
      source.traverseVisible(object => {
        if (object instanceof Mesh) bounds.expandByObject(object, true);
      });
      return bounds;
    };
    let bounds = visibleBounds();
    const extent = bounds.getSize(new Vector3());
    if (extent.y > extent.x && extent.y > extent.z) source.rotateZ(-Math.PI / 2);
    else if (extent.z > extent.x && extent.z > extent.y) source.rotateY(Math.PI / 2);
    if (sceneConfig.model.flipBlade) source.rotateY(Math.PI);
    source.updateMatrixWorld(true);
    bounds = visibleBounds();
    const length = bounds.getSize(new Vector3()).x;
    if (!Number.isFinite(length) || length <= 0) throw new Error('The katana has invalid geometry bounds.');
    const center = bounds.getCenter(new Vector3());
    source.position.sub(center);
    const normalized = new Group();
    normalized.add(source);
    normalized.scale.setScalar(sceneConfig.model.length / length);
    this.model.add(normalized);
    this.model.rotation.set(...sceneConfig.model.rotation);
    source.traverse(object => {
      if (!(object instanceof Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        for (const value of Object.values(material)) {
          if (value instanceof Texture) value.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
        }
      }
    });
    await this.renderer.compileAsync(this.scene, this.camera);
    this.dirty = true;
  }

  setPose(pose: CameraPose): void {
    if (this.exploring || this.disposed) return;
    this.camera.position.set(...pose.position);
    this.camera.up.set(Math.sin(pose.roll ?? 0), Math.cos(pose.roll ?? 0), 0);
    this.camera.fov = pose.fov;
    this.camera.updateProjectionMatrix();
    this.controls.target.set(...pose.target);
    this.camera.lookAt(this.controls.target);
    this.dirty = true;
  }

  resize(): void {
    if (this.disposed) return;
    this.renderer.setSize(innerWidth, innerHeight, false);
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
    // Never exceed the portrait performance cap after rotating/resizing.
    const cap = Math.min(devicePixelRatio, innerWidth < sceneConfig.breakpoint ? sceneConfig.renderer.mobileDpr : sceneConfig.renderer.desktopDpr);
    if (this.pixelRatio > cap) this.setPixelRatio(cap);
  }

  beginExplore(pose: CameraPose): void {
    this.setPose(pose);
    // OrbitControls caches the camera's up axis at construction. Recreate it
    // after applying portrait roll so touch and keyboard share the same axes.
    this.controls.removeEventListener('change', this.markDirty);
    this.controls.dispose();
    this.controls = this.createControls();
    this.controls.target.set(...pose.target);
    this.resetPose = pose;
    this.exploring = true;
    this.controls.enabled = true;
    this.controls.enableDamping = false;
    this.controls.update();
    this.controls.enableDamping = true;
    this.renderer.domElement.style.touchAction = 'none';
    this.dirty = true;
  }

  resetExplore(): void {
    if (!this.resetPose) return;
    this.controls.enableDamping = false;
    this.controls.update();
    this.camera.position.set(...this.resetPose.position);
    this.camera.up.set(Math.sin(this.resetPose.roll ?? 0), Math.cos(this.resetPose.roll ?? 0), 0);
    this.camera.fov = this.resetPose.fov;
    this.camera.updateProjectionMatrix();
    this.controls.target.set(...this.resetPose.target);
    // Flush damping momentum so reset is stable even during an active drag.
    this.controls.update();
    this.controls.enableDamping = true;
    this.dirty = true;
  }

  rotate(horizontal: number, vertical: number): void {
    if (!this.exploring) return;
    const alignment = new Quaternion().setFromUnitVectors(this.camera.up, new Vector3(0, 1, 0));
    const spherical = new Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target).applyQuaternion(alignment));
    spherical.theta += horizontal;
    spherical.phi = Math.max(this.controls.minPolarAngle, Math.min(this.controls.maxPolarAngle, spherical.phi + vertical));
    this.camera.position.copy(this.controls.target).add(new Vector3().setFromSpherical(spherical).applyQuaternion(alignment.invert()));
    this.controls.update();
    this.dirty = true;
  }

  endExplore(pose: CameraPose): void {
    this.exploring = false;
    this.controls.enabled = false;
    this.controls.enableDamping = false;
    this.controls.update();
    this.renderer.domElement.style.touchAction = '';
    this.setPose(pose);
    this.controls.enableDamping = true;
  }

  setStatsCallback(callback: (stats: SceneStats) => void): void { this.onFrame = callback; }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enabled = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI * 0.16;
    controls.maxPolarAngle = Math.PI * 0.84;
    controls.addEventListener('change', this.markDirty);
    return controls;
  }

  private setPixelRatio(value: number): void {
    this.pixelRatio = value;
    this.renderer.setPixelRatio(value);
    this.resize();
  }

  private markDirty = (): void => { this.dirty = true; };
  private contextLost = (event: Event): void => { event.preventDefault(); this.onContextLost(); };

  private render = (time: number): void => {
    if (this.disposed || document.hidden) { this.lastFrame = 0; return; }
    if (this.exploring) this.controls.update();
    if (!this.dirty) { this.lastFrame = 0; return; }
    if (this.lastFrame) {
      const seconds = Math.min((time - this.lastFrame) / 1000, 0.2);
      this.frameSeconds += seconds;
      this.frameCount++;
    }
    this.lastFrame = time;
    this.renderer.render(this.scene, this.camera);
    this.dirty = false;
    if (this.frameSeconds >= 2) {
      const fps = this.frameCount / this.frameSeconds;
      this.onFrame?.({ fps, dpr: this.pixelRatio, drawCalls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles });
      const minimumFps = innerWidth < sceneConfig.breakpoint ? 27 : 45;
      this.slowWindows = fps < minimumFps ? this.slowWindows + 1 : 0;
      if (this.slowWindows >= 2 && this.pixelRatio > sceneConfig.renderer.minimumDpr) {
        this.slowWindows = 0;
        this.setPixelRatio(Math.max(sceneConfig.renderer.minimumDpr, this.pixelRatio - 0.25));
      }
      this.frameCount = 0;
      this.frameSeconds = 0;
    }
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.controls.removeEventListener('change', this.markDirty);
    this.controls.dispose();
    this.renderer.domElement.removeEventListener('webglcontextlost', this.contextLost);
    const textures = new Set<Texture>();
    const materials = new Set<Material>();
    this.model.traverse(object => {
      if (!(object instanceof Mesh)) return;
      object.geometry.dispose();
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
    });
    for (const material of materials) {
      for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
      material.dispose();
    }
    for (const texture of textures) {
      const image = texture.source.data;
      if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) image.close();
      texture.dispose();
    }
    this.environment.dispose();
    this.draco.dispose();
    this.basis.dispose();
    this.renderer.dispose();
  }
}
