(function () {
  const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

  const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaveScale;
uniform float uWaveRatio;
uniform float uSwell;
uniform float uTurbulence;
uniform float uTilt;
uniform float uZoom;
uniform float uHeight;
uniform float uFogDepth;
uniform float uSteps;
uniform float uBrightness;
uniform float uOpacity;
uniform float uGrain;
uniform float uGrainIntensity;
uniform vec2 uMouse;
uniform float uParallax;
uniform bool uEnableMouse;
uniform vec3 uHorizonColor;
uniform vec3 uWaveColor;
uniform vec3 uCrestColor;
out vec4 fragColor;

const float MAX_DIST = 20000.0;

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float plasma(vec3 r, vec2 freq, vec4 tc) {
  float mx = r.x + tc.x;
  mx += uSwell * sin((r.y + mx) / 20.0 + tc.y);
  float my = r.y - tc.z;
  my += uTurbulence * cos(r.x / 23.0 + tc.w);
  return r.z - (sin(mx * freq.x) * uAmplitude + sin(my * freq.y) * uAmplitude + uHeight);
}

float raymarch(vec3 pos, vec3 dir, vec2 freq, vec4 tc) {
  float dist = 0.0;
  for (int i = 0; i < 128; i++) {
    if (float(i) >= uSteps) break;
    float dscene = plasma(pos + dist * dir, freq, tc);
    if (abs(dscene) < 0.1) break;
    dist += 0.9 * dscene;
    if (!(abs(dist) < MAX_DIST)) return MAX_DIST;
  }
  return dist;
}

void main() {
  float T = iTime * uSpeed;
  vec2 freq = vec2(uWaveScale / 7.0, (uWaveScale * uWaveRatio) / 3.0);
  vec4 tc = vec4(T / 0.130, T / 0.810, T / 0.200, T / 0.710);
  float c, s;
  float vfov = (3.14159 / 2.3) / max(uZoom, 0.05);
  vec3 cam = vec3(0.0, 0.0, 30.0);
  vec2 uv = (gl_FragCoord.xy / iResolution.xy) - 0.5;
  uv.x *= iResolution.x / iResolution.y;
  uv.y *= -1.0;

  vec3 dir = vec3(0.0, 0.0, -1.0);
  float ulen = length(uv);
  float xrot = vfov * ulen;
  c = cos(xrot); s = sin(xrot);
  dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;
  vec2 nuv = ulen > 1e-5 ? uv / ulen : vec2(1.0, 0.0);
  c = nuv.x; s = nuv.y;
  dir = mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0) * dir;
  c = cos(uTilt); s = sin(uTilt);
  dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;

  if (uEnableMouse) {
    float yaw = (uMouse.x - 0.5) * uParallax * 0.4;
    float pitch = (uMouse.y - 0.5) * uParallax * 0.4;
    c = cos(yaw); s = sin(yaw);
    dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;
    c = cos(pitch); s = sin(pitch);
    dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;
  }

  float dist = raymarch(cam, dir, freq, tc);
  vec3 pos = cam + dist * dir;

  float t = clamp(uFogDepth / max(dist, 0.001), 0.0, 1.0);
  vec3 body = mix(uWaveColor, uCrestColor, clamp(pos.z * 0.08 + 0.5, 0.0, 1.0));
  vec3 col = mix(uHorizonColor, body, t);
  col *= uBrightness;
  col = clamp(col, 0.0, 1.0);

  float alpha = clamp(t, 0.0, 1.0) * uOpacity;
  if (uGrain > 0.5) {
    float g = hash21(gl_FragCoord.xy + mod(iTime, 64.0) * 11.0);
    alpha += (g - 0.5) * uGrainIntensity;
  }
  alpha = clamp(alpha, 0.0, 1.0);
  fragColor = vec4(col * alpha, alpha);
}
`;

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [1, 1, 1];
    return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
  }

  function compile(gl, type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("GradientWaves shader", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function initGradientWaves(container, opts) {
    if (!container || container.dataset.wavesReady) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const options = Object.assign({
      horizonColor: "#05080c",
      waveColor: "#1db98d",
      crestColor: "#f4f1eb",
      speed: 0.4,
      amplitude: 2.5,
      waveScale: 0.6,
      waveRatio: 0.9,
      swell: 35,
      turbulence: 20,
      tilt: 1.11,
      zoom: 1.0,
      height: 5.5,
      fogDepth: 15,
      detail: window.innerWidth < 760 ? "low" : "medium",
      brightness: 1.05,
      opacity: 0.92,
      mouseInteraction: true,
      parallaxStrength: 0.5,
      grain: true,
      grainIntensity: 0.05
    }, opts || {});

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;";

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      powerPreference: "low-power"
    });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, vertex);
    const fs = compile(gl, gl.FRAGMENT_SHADER, fragment);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, "position");
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("GradientWaves program", gl.getProgramInfoLog(program));
      return;
    }
    container.appendChild(canvas);
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const loc = (name) => gl.getUniformLocation(program, name);
    const u = {
      iTime: loc("iTime"),
      iResolution: loc("iResolution"),
      uSpeed: loc("uSpeed"),
      uAmplitude: loc("uAmplitude"),
      uWaveScale: loc("uWaveScale"),
      uWaveRatio: loc("uWaveRatio"),
      uSwell: loc("uSwell"),
      uTurbulence: loc("uTurbulence"),
      uTilt: loc("uTilt"),
      uZoom: loc("uZoom"),
      uHeight: loc("uHeight"),
      uFogDepth: loc("uFogDepth"),
      uSteps: loc("uSteps"),
      uBrightness: loc("uBrightness"),
      uOpacity: loc("uOpacity"),
      uGrain: loc("uGrain"),
      uGrainIntensity: loc("uGrainIntensity"),
      uMouse: loc("uMouse"),
      uParallax: loc("uParallax"),
      uEnableMouse: loc("uEnableMouse"),
      uHorizonColor: loc("uHorizonColor"),
      uWaveColor: loc("uWaveColor"),
      uCrestColor: loc("uCrestColor")
    };

    const steps = options.detail === "low" ? 40 : options.detail === "high" ? 110 : 70;
    const horizon = hexToRgb(options.horizonColor);
    const wave = hexToRgb(options.waveColor);
    const crest = hexToRgb(options.crestColor);

    gl.uniform1f(u.uSpeed, options.speed);
    gl.uniform1f(u.uAmplitude, options.amplitude);
    gl.uniform1f(u.uWaveScale, options.waveScale);
    gl.uniform1f(u.uWaveRatio, options.waveRatio);
    gl.uniform1f(u.uSwell, options.swell);
    gl.uniform1f(u.uTurbulence, options.turbulence);
    gl.uniform1f(u.uTilt, options.tilt);
    gl.uniform1f(u.uZoom, options.zoom);
    gl.uniform1f(u.uHeight, options.height);
    gl.uniform1f(u.uFogDepth, options.fogDepth);
    gl.uniform1f(u.uSteps, steps);
    gl.uniform1f(u.uBrightness, options.brightness);
    gl.uniform1f(u.uOpacity, options.opacity);
    gl.uniform1f(u.uGrain, options.grain ? 1 : 0);
    gl.uniform1f(u.uGrainIntensity, options.grainIntensity);
    gl.uniform1f(u.uParallax, options.parallaxStrength);
    gl.uniform1i(u.uEnableMouse, options.mouseInteraction ? 1 : 0);
    gl.uniform3fv(u.uHorizonColor, horizon);
    gl.uniform3fv(u.uWaveColor, wave);
    gl.uniform3fv(u.uCrestColor, crest);

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const currentMouse = [0.5, 0.5];
    const targetMouse = [0.5, 0.5];

    const setSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u.iResolution, w, h);
    };

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      targetMouse[0] = (e.clientX - rect.left) / rect.width;
      targetMouse[1] = 1.0 - (e.clientY - rect.top) / rect.height;
    };
    const onPointerLeave = () => {
      targetMouse[0] = 0.5;
      targetMouse[1] = 0.5;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    container.addEventListener("pointerleave", onPointerLeave);

    let raf = 0;
    let visible = true;
    const t0 = performance.now();

    const loop = (t) => {
      gl.uniform1f(u.iTime, (t - t0) * 0.001);
      currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
      currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
      gl.uniform2f(u.uMouse, currentMouse[0], currentMouse[1]);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (visible && !document.hidden && raf === 0) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const ro = new ResizeObserver(() => { setSize(); });
    ro.observe(container);
    setSize();

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      visible ? start() : stop();
    }, { threshold: 0 });
    io.observe(container);

    document.addEventListener("visibilitychange", () => {
      document.hidden ? stop() : start();
    });

    container.dataset.wavesReady = "1";
    start();
  }

  function boot() {
    document.querySelectorAll("[data-gradient-waves]").forEach((el) => initGradientWaves(el));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
