import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type OrbState = "pure" | "crack" | "shell" | "scribbles";

interface OrbParams {
  animSpeed: number;
  textureScale: number;
  brightness: number;
  voids: number;
  colorDeep: [number, number, number];
  colorMid: [number, number, number];
  colorBright: [number, number, number];
  edgeColor: [number, number, number];
  edgeOpacity: number;
  rotSpeedX: number;
  rotSpeedY: number;
}

const STAGE_PRESETS: Record<OrbState, OrbParams> = {
  pure: {
    animSpeed: 0.12,
    textureScale: 0.05,
    brightness: 1.8,
    voids: 0.0,
    colorDeep: [1.0, 0.7, 0.1],
    colorMid: [1.0, 0.82, 0.2],
    colorBright: [1.0, 0.95, 0.5],
    edgeColor: [1.0, 1.0, 1.0],
    edgeOpacity: 0.6,
    rotSpeedX: 0.06,
    rotSpeedY: 0.04,
  },
  crack: {
    animSpeed: 0.2,
    textureScale: 0.3,
    brightness: 1.5,
    voids: 0.15,
    colorDeep: [1.0, 0.55, 0.05],
    colorMid: [1.0, 0.65, 0.1],
    colorBright: [1.0, 0.85, 0.3],
    edgeColor: [0.95, 0.92, 0.85],
    edgeOpacity: 0.7,
    rotSpeedX: 0.2,
    rotSpeedY: 0.15,
  },
  shell: {
    animSpeed: 0.15,
    textureScale: 0.6,
    brightness: 1.25,
    voids: 0.3,
    colorDeep: [0.9, 0.45, 0.0],
    colorMid: [0.95, 0.6, 0.08],
    colorBright: [1.0, 0.78, 0.2],
    edgeColor: [0.75, 0.73, 0.7],
    edgeOpacity: 0.85,
    rotSpeedX: 0.35,
    rotSpeedY: 0.25,
  },
  scribbles: {
    animSpeed: 0.3,
    textureScale: 1.2,
    brightness: 0.95,
    voids: 0.45,
    colorDeep: [0.75, 0.35, 0.0],
    colorMid: [0.85, 0.5, 0.05],
    colorBright: [0.95, 0.7, 0.15],
    edgeColor: [0.6, 0.58, 0.55],
    edgeOpacity: 1.0,
    rotSpeedX: 0.5,
    rotSpeedY: 0.35,
  },
};

const VERTEX_SHADER = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
uniform float uTime;
uniform float uAnimSpeed;
uniform float uTextureScale;
uniform float uBrightness;
uniform float uVoids;
uniform vec3 uColorDeep;
uniform vec3 uColorMid;
uniform vec3 uColorBright;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
  float t = uTime * uAnimSpeed;
  vec3 pos = vPosition * uTextureScale;

  float n1 = snoise(pos + t * 0.3);
  float n2 = snoise(pos * 2.0 - t * 0.2) * 0.5;
  float n3 = snoise(pos * 4.0 + t * 0.15) * 0.25;
  float noise = n1 + n2 + n3;

  float voidMask = smoothstep(-uVoids, uVoids * 0.5, noise);
  voidMask = mix(0.35, 1.0, voidMask);

  vec3 color = mix(uColorDeep, uColorMid, smoothstep(-0.5, 0.3, noise));
  color = mix(color, uColorBright, smoothstep(0.2, 0.8, noise));

  color *= uBrightness * voidMask;

  float innerGlow = 0.25 + 0.1 * sin(uTime * 0.8);
  color = max(color, uColorDeep * innerGlow);

  float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
  color += uColorBright * fresnel * 0.3 * uBrightness;

  float breathe = 1.0 + 0.06 * sin(uTime * 0.9);
  color *= breathe;

  gl_FragColor = vec4(color, 1.0);
}
`;

const SHELL_VERTEX = `
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position * 1.02, 1.0);
}
`;

const SHELL_FRAGMENT = `
uniform vec3 uEdgeColor;
uniform float uEdgeOpacity;
varying vec3 vNormal;
void main() {
  float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
  float alpha = fresnel * uEdgeOpacity;
  gl_FragColor = vec4(uEdgeColor, alpha);
}
`;

function lerpVal(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [lerpVal(a[0], b[0], t), lerpVal(a[1], b[1], t), lerpVal(a[2], b[2], t)];
}

function lerpParams(a: OrbParams, b: OrbParams, t: number): OrbParams {
  return {
    animSpeed: lerpVal(a.animSpeed, b.animSpeed, t),
    textureScale: lerpVal(a.textureScale, b.textureScale, t),
    brightness: lerpVal(a.brightness, b.brightness, t),
    voids: lerpVal(a.voids, b.voids, t),
    colorDeep: lerpColor(a.colorDeep, b.colorDeep, t),
    colorMid: lerpColor(a.colorMid, b.colorMid, t),
    colorBright: lerpColor(a.colorBright, b.colorBright, t),
    edgeColor: lerpColor(a.edgeColor, b.edgeColor, t),
    edgeOpacity: lerpVal(a.edgeOpacity, b.edgeOpacity, t),
    rotSpeedX: lerpVal(a.rotSpeedX, b.rotSpeedX, t),
    rotSpeedY: lerpVal(a.rotSpeedY, b.rotSpeedY, t),
  };
}

function checkShaderErrors(gl: WebGLRenderingContext, program: WebGLProgram): boolean {
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
  return true;
}

interface PlasmaOrbProps {
  orbState: OrbState;
  shake: boolean;
  onError?: () => void;
}

export default function PlasmaOrb({ orbState, shake, onError }: PlasmaOrbProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const stateRef = useRef({
    renderer: null as THREE.WebGLRenderer | null,
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    plasmaMat: null as THREE.ShaderMaterial | null,
    shellMat: null as THREE.ShaderMaterial | null,
    plasmaGeo: null as THREE.SphereGeometry | null,
    shellGeo: null as THREE.SphereGeometry | null,
    orbGroup: null as THREE.Group | null,
    animId: 0,
    currentParams: { ...STAGE_PRESETS.pure },
    targetParams: { ...STAGE_PRESETS.pure },
    transitionStart: 0,
    transitionDuration: 1.5,
    isTransitioning: false,
    fromParams: { ...STAGE_PRESETS.pure },
    shakeOffset: 0,
    shakeActive: false,
    initialized: false,
    disposed: false,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container || failed) return;

    const s = stateRef.current;
    s.disposed = false;
    const size = 280;

    const handleFail = () => {
      setFailed(true);
      onError?.();
    };

    let canvas: HTMLCanvasElement;
    try {
      canvas = document.createElement("canvas");
      canvas.width = size * window.devicePixelRatio;
      canvas.height = size * window.devicePixelRatio;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      canvas.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        handleFail();
      });

      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) { handleFail(); return; }

      const renderer = new THREE.WebGLRenderer({
        canvas,
        context: gl as WebGLRenderingContext,
        antialias: true,
        alpha: true,
      });
      renderer.setSize(size, size);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.z = 3.2;

      const orbGroup = new THREE.Group();
      scene.add(orbGroup);

      const plasmaGeo = new THREE.SphereGeometry(1, 64, 64);
      const plasmaMat = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms: {
          uTime: { value: 0 },
          uAnimSpeed: { value: STAGE_PRESETS.pure.animSpeed },
          uTextureScale: { value: STAGE_PRESETS.pure.textureScale },
          uBrightness: { value: STAGE_PRESETS.pure.brightness },
          uVoids: { value: STAGE_PRESETS.pure.voids },
          uColorDeep: { value: new THREE.Vector3(...STAGE_PRESETS.pure.colorDeep) },
          uColorMid: { value: new THREE.Vector3(...STAGE_PRESETS.pure.colorMid) },
          uColorBright: { value: new THREE.Vector3(...STAGE_PRESETS.pure.colorBright) },
        },
      });
      const plasma = new THREE.Mesh(plasmaGeo, plasmaMat);
      orbGroup.add(plasma);

      const shellGeo = new THREE.SphereGeometry(1.02, 48, 48);
      const shellMat = new THREE.ShaderMaterial({
        vertexShader: SHELL_VERTEX,
        fragmentShader: SHELL_FRAGMENT,
        uniforms: {
          uEdgeColor: { value: new THREE.Vector3(...STAGE_PRESETS.pure.edgeColor) },
          uEdgeOpacity: { value: STAGE_PRESETS.pure.edgeOpacity },
        },
        transparent: true,
        side: THREE.FrontSide,
        depthWrite: false,
      });
      const shell = new THREE.Mesh(shellGeo, shellMat);
      orbGroup.add(shell);

      renderer.render(scene, camera);

      const glCtx = renderer.getContext();
      const programs = renderer.info.programs;
      if (programs) {
        for (const prog of programs) {
          if ((prog as any).program && !checkShaderErrors(glCtx, (prog as any).program)) {
            handleFail();
            renderer.dispose();
            return;
          }
        }
      }

      if (glCtx.getError() !== glCtx.NO_ERROR) {
        handleFail();
        renderer.dispose();
        return;
      }

      container.appendChild(canvas);

      s.renderer = renderer;
      s.scene = scene;
      s.camera = camera;
      s.plasmaMat = plasmaMat;
      s.shellMat = shellMat;
      s.plasmaGeo = plasmaGeo;
      s.shellGeo = shellGeo;
      s.orbGroup = orbGroup;
      s.initialized = true;

      const startTime = performance.now() / 1000;

      const animate = () => {
        if (s.disposed) return;
        const now = performance.now() / 1000;
        const elapsed = now - startTime;

        if (s.isTransitioning) {
          const tElapsed = now - s.transitionStart;
          const progress = Math.min(tElapsed / s.transitionDuration, 1);
          const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          s.currentParams = lerpParams(s.fromParams, s.targetParams, eased);
          if (progress >= 1) s.isTransitioning = false;
        }

        const p = s.currentParams;

        if (s.plasmaMat) {
          s.plasmaMat.uniforms.uTime.value = elapsed;
          s.plasmaMat.uniforms.uAnimSpeed.value = p.animSpeed;
          s.plasmaMat.uniforms.uTextureScale.value = p.textureScale;
          s.plasmaMat.uniforms.uBrightness.value = p.brightness;
          s.plasmaMat.uniforms.uVoids.value = p.voids;
          s.plasmaMat.uniforms.uColorDeep.value.set(...p.colorDeep);
          s.plasmaMat.uniforms.uColorMid.value.set(...p.colorMid);
          s.plasmaMat.uniforms.uColorBright.value.set(...p.colorBright);
        }
        if (s.shellMat) {
          s.shellMat.uniforms.uEdgeColor.value.set(...p.edgeColor);
          s.shellMat.uniforms.uEdgeOpacity.value = p.edgeOpacity;
        }

        if (s.orbGroup) {
          s.orbGroup.rotation.x += p.rotSpeedX * 0.016;
          s.orbGroup.rotation.y += p.rotSpeedY * 0.016;

          if (s.shakeActive) {
            s.shakeOffset += 1;
            const intensity = Math.max(0, 1 - s.shakeOffset / 30);
            s.orbGroup.position.x = (Math.random() - 0.5) * 0.12 * intensity;
            s.orbGroup.position.y = (Math.random() - 0.5) * 0.08 * intensity;
            if (intensity <= 0) {
              s.shakeActive = false;
              s.orbGroup.position.x = 0;
              s.orbGroup.position.y = 0;
            }
          }
        }

        renderer.render(scene, camera);
        s.animId = requestAnimationFrame(animate);
      };

      s.animId = requestAnimationFrame(animate);
    } catch {
      handleFail();
      return;
    }

    return () => {
      s.disposed = true;
      if (s.animId) cancelAnimationFrame(s.animId);
      s.plasmaMat?.dispose();
      s.shellMat?.dispose();
      s.plasmaGeo?.dispose();
      s.shellGeo?.dispose();
      if (s.renderer) {
        s.renderer.dispose();
        const c = s.renderer.domElement;
        c.parentNode?.removeChild(c);
      }
      s.initialized = false;
    };
  }, [failed, onError]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s.initialized) return;
    const target = STAGE_PRESETS[orbState] || STAGE_PRESETS.pure;
    s.fromParams = { ...s.currentParams };
    s.targetParams = { ...target };
    s.transitionStart = performance.now() / 1000;
    s.isTransitioning = true;
  }, [orbState]);

  useEffect(() => {
    if (shake) {
      const s = stateRef.current;
      s.shakeActive = true;
      s.shakeOffset = 0;
    }
  }, [shake]);

  if (failed) return null;

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center"
      style={{ width: 280, height: 280 }}
      data-testid="plasma-orb"
    />
  );
}
