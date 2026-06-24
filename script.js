/* ─── Neuro canvas WebGL controller ────────────────────────────── */

const canvasEl = document.querySelector("canvas#neuro");
const devicePixelRatio = Math.min(window.devicePixelRatio, 2);

// ─── Pointer state ───────────────────────────────────────────────
// tX/tY = true/target mouse position
// x/y   = smoothly interpolated current position (lags behind)
const pointer = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  tX: window.innerWidth / 2,
  tY: window.innerHeight / 2,
};

// How quickly the shader position chases the real cursor.
// Lower = more lag/trail. Range: 0.01 (very sluggish) → 1 (instant).
const POINTER_EASE = 0.06;

let uniforms;
const gl = initShader();

setupEvents();
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
render();

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
      console.error(
        "Shader compile error: " + gl.getShaderInfoLog(shader)
      );
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
      console.error(
        "Shader program link error: " + gl.getProgramInfoLog(program)
      );
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

  const vertexShader = createShader(gl, vsSource, gl.VERTEX_SHADER);
  const fragmentShader = createShader(gl, fsSource, gl.FRAGMENT_SHADER);
  const shaderProgram = createShaderProgram(gl, vertexShader, fragmentShader);

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
  if (!gl) return;

  const currentTime = performance.now();

  // Smooth cursor lag — eases toward the real pointer each frame
  pointer.x += (pointer.tX - pointer.x) * POINTER_EASE;
  pointer.y += (pointer.tY - pointer.y) * POINTER_EASE;

  gl.uniform1f(uniforms.u_time, currentTime);
  gl.uniform2f(
    uniforms.u_pointer_position,
    pointer.x / window.innerWidth,
    1 - pointer.y / window.innerHeight
  );

  // Slowly cycle colours independently of scroll
  const colorCycle = (Math.sin(currentTime * 0.0004) + 1) / 2;
  gl.uniform1f(uniforms.u_scroll_progress, colorCycle);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  requestAnimationFrame(render);
}

// ─── Resize handler ───────────────────────────────────────────────
function resizeCanvas() {
  if (!gl) return;
  canvasEl.width = window.innerWidth * devicePixelRatio;
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
    updateMousePosition(
      e.targetTouches[0].clientX,
      e.targetTouches[0].clientY
    );
  }, { passive: false });

  window.addEventListener("click", (e) => {
    updateMousePosition(e.clientX, e.clientY);
  });
}

function updateMousePosition(eX, eY) {
  pointer.tX = eX;
  pointer.tY = eY;
}
