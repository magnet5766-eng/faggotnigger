/* ─── Neuro canvas WebGL controller ────────────────────────────── */

const canvasEl = document.querySelector("canvas#neuro");

// Cap pixel ratio at 1 on low-end devices (saves ~4x fill-rate on 2x screens)
// A Chromebook typically reports 1 anyway, but this guards against 1.5x panels
const devicePixelRatio = Math.min(window.devicePixelRatio, 1);

// ─── Pointer state ───────────────────────────────────────────────
const pointer = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  tX: window.innerWidth / 2,
  tY: window.innerHeight / 2,
};

const POINTER_EASE = 0.06;

let uniforms;
let rafId = null;       // track the RAF so we can cancel it
let isRunning = false;

const gl = initShader();

setupEvents();
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Start loop only if not in perf mode
if (!document.body.classList.contains("perf-mode")) {
  startRender();
}

// ─── Perf mode watcher — pause/resume the render loop ────────────
const perfBtn = document.getElementById("perfBtn");
if (perfBtn) {
  perfBtn.addEventListener("click", () => {
    // Give the inline script a tick to toggle the class first
    requestAnimationFrame(() => {
      if (document.body.classList.contains("perf-mode")) {
        stopRender();
      } else {
        startRender();
      }
    });
  });
}

// Also pause when tab is hidden (saves CPU/GPU when user switches tabs)
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopRender();
  } else if (!document.body.classList.contains("perf-mode")) {
    startRender();
  }
});

function startRender() {
  if (isRunning || !gl) return;
  isRunning = true;
  rafId = requestAnimationFrame(render);
}

function stopRender() {
  if (!isRunning) return;
  isRunning = false;
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}

// ─── WebGL initialisation ────────────────────────────────────────
function initShader() {
  const vsSource = document.getElementById("vertShader").innerHTML;
  const fsSource = document.getElementById("fragShader").innerHTML;

  const gl =
    canvasEl.getContext("webgl") ||
    canvasEl.getContext("experimental-webgl");

  if (!gl) {
    console.warn("WebGL is not supported by your browser.");
    return null;
  }

  function createShader(gl, sourceCode, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, sourceCode);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compile error: " + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createShaderProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Shader program link error: " + gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }

  function getUniforms(program) {
    const uniforms = {};
    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
      const uniformName = gl.getActiveUniform(program, i).name;
      uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
    }
    return uniforms;
  }

  const vertexShader   = createShader(gl, vsSource, gl.VERTEX_SHADER);
  const fragmentShader = createShader(gl, fsSource, gl.FRAGMENT_SHADER);
  const shaderProgram  = createShaderProgram(gl, vertexShader, fragmentShader);

  uniforms = getUniforms(shaderProgram);

  const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  gl.useProgram(shaderProgram);

  const positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  return gl;
}

// ─── Render loop ─────────────────────────────────────────────────
function render() {
  if (!gl || !isRunning) return;

  const currentTime = performance.now();

  // Only update pointer uniform if it actually moved (skip redundant GPU uploads)
  const dx = pointer.tX - pointer.x;
  const dy = pointer.tY - pointer.y;
  if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
    pointer.x += dx * POINTER_EASE;
    pointer.y += dy * POINTER_EASE;
    gl.uniform2f(
      uniforms.u_pointer_position,
      pointer.x / window.innerWidth,
      1 - pointer.y / window.innerHeight
    );
  }

  gl.uniform1f(uniforms.u_time, currentTime);

  const colorCycle = (Math.sin(currentTime * 0.0004) + 1) / 2;
  gl.uniform1f(uniforms.u_scroll_progress, colorCycle);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  rafId = requestAnimationFrame(render);
}

// ─── Resize handler ───────────────────────────────────────────────
function resizeCanvas() {
  if (!gl) return;
  canvasEl.width  = window.innerWidth  * devicePixelRatio;
  canvasEl.height = window.innerHeight * devicePixelRatio;
  gl.uniform1f(uniforms.u_ratio, canvasEl.width / canvasEl.height);
  gl.viewport(0, 0, canvasEl.width, canvasEl.height);
}

// ─── Input events ─────────────────────────────────────────────────
function setupEvents() {
  window.addEventListener("pointermove", (e) => {
    updateMousePosition(e.clientX, e.clientY);
  });

  window.addEventListener("touchmove", (e) => {
    e.preventDefault();
    updateMousePosition(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
  }, { passive: false });

  window.addEventListener("click", (e) => {
    updateMousePosition(e.clientX, e.clientY);
  });
}

function updateMousePosition(eX, eY) {
  pointer.tX = eX;
  pointer.tY = eY;
}
