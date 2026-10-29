import React, { useEffect, useRef } from 'react';
import './LiquidBackground.css';

/**
 * LiquidBackground
 * Ultra-smooth interactive liquid obsidian / dark fluid background.
 * Uses hardware-accelerated WebGL with mouse displacement and wave physics,
 * falling back gracefully to Canvas 2D if WebGL is unavailable.
 */
export const LiquidBackground = ({ className = '', interactive = true }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId;
    let gl = null;
    let program = null;

    // Mouse tracking with viscous damping
    const mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
    const mouseVel = { x: 0, y: 0 };
    let lastTime = performance.now();
    let startTime = performance.now();

    const handleMouseMove = (e) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      // Calculate normalized coordinates relative to canvas
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height; // WebGL Y is inverted

      // Calculate instantaneous velocity
      const dt = Math.max(1, performance.now() - lastTime);
      mouseVel.x = (x - mouse.targetX) / (dt * 0.05);
      mouseVel.y = (y - mouse.targetY) / (dt * 0.05);

      // Clamp velocity to prevent excessive distortion
      mouseVel.x = Math.max(-1.5, Math.min(1.5, mouseVel.x));
      mouseVel.y = Math.max(-1.5, Math.min(1.5, mouseVel.y));

      mouse.targetX = Math.max(0, Math.min(1, x));
      mouse.targetY = Math.max(0, Math.min(1, y));
      lastTime = performance.now();
    };

    const handleTouchMove = (e) => {
      if (!canvas || !e.touches || e.touches.length === 0) return;
      const touch = e.touches[0];
      handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
    }

    // Try initializing WebGL
    try {
      gl = canvas.getContext('webgl', { powerPreference: 'high-performance', alpha: false, antialias: false });
    } catch (_) {
      gl = null;
    }

    if (gl) {
      // ----------------------------------------------------------------------
      // WEBGL LIQUID SHADER IMPLEMENTATION
      // ----------------------------------------------------------------------
      const vsSource = `
        attribute vec2 position;
        varying vec2 vUv;
        void main() {
          vUv = (position + 1.0) * 0.5;
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `;

      const fsSource = `
        precision highp float;
        varying vec2 vUv;
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;
        uniform vec2 u_mouse_vel;
        uniform float u_time;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p = rot * p * 2.02;
            a *= 0.5;
          }
          return v;
        }

        float liquidHeight(vec2 uv, float t, vec2 mouse, vec2 vel) {
          vec2 q = vec2(
            fbm(uv * 2.0 + vec2(t * 0.12, t * 0.08)),
            fbm(uv * 2.0 + vec2(t * -0.09, t * 0.14))
          );

          vec2 r = vec2(
            fbm(uv * 2.6 + 2.8 * q + vec2(t * 0.14, -t * 0.1)),
            fbm(uv * 2.6 + 2.8 * q + vec2(-t * 0.1, t * 0.16))
          );

          float baseWave = fbm(uv * 1.6 + 2.2 * r);

          vec2 diff = uv - mouse;
          float dist = length(diff);
          float mousePush = exp(-dist * 4.2);
          float ripple = sin(dist * 24.0 - t * 3.5) * exp(-dist * 3.5) * length(vel) * 2.0;
          float wake = dot(normalize(diff + 0.001), vel) * mousePush * 2.2;

          return baseWave + mousePush * 0.45 + ripple + wake;
        }

        void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          float aspect = u_resolution.x / u_resolution.y;
          vec2 p = uv;
          p.x *= aspect;
          vec2 m = u_mouse;
          m.x *= aspect;

          float t = u_time * 0.75;
          vec2 eps = vec2(0.0035, 0.0);

          float h = liquidHeight(p, t, m, u_mouse_vel);
          float hx = liquidHeight(p + eps.xy, t, m, u_mouse_vel) - liquidHeight(p - eps.xy, t, m, u_mouse_vel);
          float hy = liquidHeight(p + eps.yx, t, m, u_mouse_vel) - liquidHeight(p - eps.yx, t, m, u_mouse_vel);

          vec3 normal = normalize(vec3(-hx * 3.5, -hy * 3.5, 1.0));

          vec3 lightDir1 = normalize(vec3(0.4, 0.75, 0.8));
          vec3 lightDir2 = normalize(vec3(-0.6, -0.4, 0.6));
          vec3 viewDir = vec3(0.0, 0.0, 1.0);

          float diff1 = max(0.0, dot(normal, lightDir1));
          vec3 half1 = normalize(lightDir1 + viewDir);
          float spec1 = pow(max(0.0, dot(normal, half1)), 38.0);

          float diff2 = max(0.0, dot(normal, lightDir2));
          vec3 half2 = normalize(lightDir2 + viewDir);
          float spec2 = pow(max(0.0, dot(normal, half2)), 22.0);

          float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 3.2);

          // Liquid Obsidian Black palette
          vec3 deepBlack   = vec3(0.04, 0.045, 0.055);
          vec3 richCharcoal = vec3(0.085, 0.095, 0.125);
          vec3 liquidSheen = vec3(0.18, 0.22, 0.28);
          vec3 silverSpec  = vec3(0.85, 0.90, 0.98);
          vec3 cyanSpec    = vec3(0.22, 0.74, 0.97);

          vec3 col = mix(deepBlack, richCharcoal, h * 0.5 + 0.5);
          col += liquidSheen * (diff1 * 0.35 + diff2 * 0.15);
          col += silverSpec * (spec1 * 0.7);
          col += cyanSpec * (spec2 * 0.3 + fresnel * 0.22);

          // Subtle vignette
          float vig = 1.0 - length((uv - 0.5) * 1.15);
          col *= clamp(vig + 0.35, 0.0, 1.0);

          gl_FragColor = vec4(col, 1.0);
        }
      `;

      const createShader = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.warn('[LiquidShader]', gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vs = createShader(gl.VERTEX_SHADER, vsSource);
      const fs = createShader(gl.FRAGMENT_SHADER, fsSource);

      if (vs && fs) {
        program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          console.warn('[LiquidProgram]', gl.getProgramInfoLog(program));
          program = null;
        }
      }

      if (program) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
          gl.STATIC_DRAW
        );

        const posAttr = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(posAttr);
        gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

        const uRes = gl.getUniformLocation(program, 'u_resolution');
        const uMouse = gl.getUniformLocation(program, 'u_mouse');
        const uMouseVel = gl.getUniformLocation(program, 'u_mouse_vel');
        const uTime = gl.getUniformLocation(program, 'u_time');

        const resize = () => {
          if (!canvas) return;
          const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
          const width = canvas.clientWidth;
          const height = canvas.clientHeight;
          if (width > 0 && height > 0) {
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            gl.viewport(0, 0, canvas.width, canvas.height);
          }
        };

        resize();
        window.addEventListener('resize', resize);

        const render = () => {
          // Viscous spring interpolation for liquid momentum
          mouse.x += (mouse.targetX - mouse.x) * 0.08;
          mouse.y += (mouse.targetY - mouse.y) * 0.08;
          mouseVel.x *= 0.92;
          mouseVel.y *= 0.92;

          gl.useProgram(program);
          gl.uniform2f(uRes, canvas.width, canvas.height);
          gl.uniform2f(uMouse, mouse.x, mouse.y);
          gl.uniform2f(uMouseVel, mouseVel.x, mouseVel.y);
          gl.uniform1f(uTime, (performance.now() - startTime) * 0.001);

          gl.drawArrays(gl.TRIANGLES, 0, 6);
          animId = requestAnimationFrame(render);
        };

        animId = requestAnimationFrame(render);

        return () => {
          cancelAnimationFrame(animId);
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('touchmove', handleTouchMove);
          window.removeEventListener('resize', resize);
          if (program) gl.deleteProgram(program);
        };
      }
    }

    // ----------------------------------------------------------------------
    // CANVAS 2D FALLBACK (If WebGL is unavailable)
    // ----------------------------------------------------------------------
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.clientWidth);
    let height = (canvas.height = canvas.clientHeight);

    const onResize2D = () => {
      width = canvas.width = canvas.clientWidth;
      height = canvas.height = canvas.clientHeight;
    };
    window.addEventListener('resize', onResize2D);

    const render2D = (time) => {
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.fillStyle = '#08090d';
      ctx.fillRect(0, 0, width, height);

      // Layered liquid waves with radial gradient highlights
      const t = time * 0.001;
      const mx = mouse.x * width;
      const my = (1.0 - mouse.y) * height;

      // Mouse interactive liquid ripple
      const radialGrad = ctx.createRadialGradient(mx, my, 10, mx, my, 320);
      radialGrad.addColorStop(0, 'rgba(56, 189, 248, 0.16)');
      radialGrad.addColorStop(0.4, 'rgba(30, 41, 59, 0.12)');
      radialGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radialGrad;
      ctx.beginPath();
      ctx.arc(mx, my, 320, 0, Math.PI * 2);
      ctx.fill();

      // Ambient undulating liquid blobs
      for (let i = 0; i < 3; i++) {
        const bx = width * 0.5 + Math.sin(t * 0.7 + i * 2) * (width * 0.3);
        const by = height * 0.5 + Math.cos(t * 0.5 + i * 2) * (height * 0.25);
        const bGrad = ctx.createRadialGradient(bx, by, 20, bx, by, 260);
        bGrad.addColorStop(0, 'rgba(99, 102, 241, 0.1)');
        bGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(bx, by, 260, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render2D);
    };

    animId = requestAnimationFrame(render2D);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', onResize2D);
    };
  }, [interactive]);

  return (
    <div className={`liquid-background-container ${className}`}>
      <canvas ref={canvasRef} className="liquid-canvas" />
      <div className="liquid-overlay-sheen" />
    </div>
  );
};

export default LiquidBackground;
