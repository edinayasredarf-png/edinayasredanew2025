const vertexSource = `
  attribute vec2 aUv;
  uniform vec4 uPose;
  uniform vec2 uExpression;
  varying mediump vec2 vUv;

  float softArea(vec2 p, vec2 origin, vec2 extent) {
    vec2 d = (p - origin) / extent;
    return 1.0 - smoothstep(0.15, 1.0, length(d));
  }

  float volume(vec2 p, vec2 origin, vec2 extent) {
    vec2 d = (p - origin) / extent;
    return exp(-dot(d, d));
  }

  vec2 eye(vec2 p, vec2 pupil, vec2 lids, float closed) {
    // Keep the iris shift inside the exposed eye and close the lids around its seam.
    float iris = softArea(p, pupil, vec2(0.032, 0.018));
    vec2 eyeDistance = (p - lids) / vec2(0.057, 0.042);
    float opening = 1.0 - smoothstep(0.47, 1.0, length(eyeDistance));
    vec2 offset = iris * uPose.zw * vec2(0.009, 0.005) * (1.0 - closed);
    offset.y += (lids.y + 0.007 - p.y) * opening * 0.98 * closed;
    return offset;
  }

  void main() {
    vec2 p = aUv;
    vUv = p;
    vec2 face = p;
    face += eye(p, vec2(0.393, 0.440), vec2(0.399, 0.444), uExpression.y);
    face += eye(p, vec2(0.620, 0.435), vec2(0.616, 0.440), uExpression.y * 0.13);

    float leftCorner = volume(p, vec2(0.423, 0.680), vec2(0.055, 0.050));
    float rightCorner = volume(p, vec2(0.599, 0.673), vec2(0.056, 0.052));
    float cheeks =
      volume(p, vec2(0.359, 0.573), vec2(0.063, 0.094)) +
      volume(p, vec2(0.661, 0.568), vec2(0.062, 0.092));
    face.x += uExpression.x * (rightCorner - leftCorner) * 0.013;
    face.y -= uExpression.x * (0.022 * (leftCorner + rightCorner) + 0.010 * cheeks);

    // The rounded face has more parallax than the ears and the neck.
    // The motion falls off through the collar, keeping the silhouette continuous.
    float head = softArea(p, vec2(0.506, 0.445), vec2(0.53, 0.74));
    float neck = volume(p, vec2(0.508, 0.846), vec2(0.22, 0.16));
    float depth = 0.148 * volume(p, vec2(0.503, 0.46), vec2(0.227, 0.40))
      + 0.073 * volume(p, vec2(0.502, 0.563), vec2(0.062, 0.092))
      + 0.025 * neck;
    vec2 pivot = vec2(0.507, 0.540);
    vec2 pos = face - pivot;
    float yaw = uPose.x * head;
    float pitch = uPose.y * head;
    float horizontal = pos.x * cos(yaw) + depth * sin(yaw);
    float rotatedDepth = depth * cos(yaw) - pos.x * sin(yaw);
    float vertical = pos.y * cos(pitch) + rotatedDepth * sin(pitch);
    float perspective = 1.0 + (rotatedDepth - depth) * 0.32;
    vec2 projected = vec2(horizontal, vertical) * perspective + pivot;
    projected += vec2(uPose.x * 0.054, uPose.y * 0.036) * (head + neck * 0.25);
    gl_Position = vec4(projected.x * 2.0 - 1.0, 1.0 - projected.y * 2.0, 0.0, 1.0);
  }
`;

const fragmentSource = `
  precision mediump float;
  uniform sampler2D uPortrait;
  varying mediump vec2 vUv;
  void main() {
    gl_FragColor = texture2D(uPortrait, vUv);
  }
`;

export function createPortraitRenderer(canvas: HTMLCanvasElement, photo: HTMLImageElement) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: true });
  if (!gl) return null;

  const vertex = gl.createShader(gl.VERTEX_SHADER);
  const fragment = gl.createShader(gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  const texture = gl.createTexture();
  const vertices = gl.createBuffer();
  const faces = gl.createBuffer();
  if (!vertex || !fragment || !program || !texture || !vertices || !faces) return null;

  const dispose = () => {
    gl.deleteTexture(texture);
    gl.deleteBuffer(vertices);
    gl.deleteBuffer(faces);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    gl.deleteProgram(program);
  };

  gl.shaderSource(vertex, vertexSource);
  gl.shaderSource(fragment, fragmentSource);
  gl.compileShader(vertex);
  gl.compileShader(fragment);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    dispose();
    return null;
  }

  const divisions = 144;
  const stride = divisions + 1;
  const grid = new Float32Array(stride * stride * 2);
  const triangles = new Uint16Array(divisions * divisions * 6);
  let index = 0;
  let face = 0;
  for (let row = 0; row < stride; row++) {
    for (let column = 0; column < stride; column++) {
      grid[index++] = column / divisions;
      grid[index++] = row / divisions;
      if (row === divisions || column === divisions) continue;
      const i = row * stride + column;
      triangles.set([i, i + 1, i + stride, i + 1, i + stride + 1, i + stride], face);
      face += 6;
    }
  }

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
  gl.bufferData(gl.ARRAY_BUFFER, grid, gl.STATIC_DRAW);
  const aUv = gl.getAttribLocation(program, 'aUv');
  gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aUv);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, faces);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangles, gl.STATIC_DRAW);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, photo);

  const pose = gl.getUniformLocation(program, 'uPose');
  const expression = gl.getUniformLocation(program, 'uExpression');
  return {
    draw(x: number, y: number, eyesX: number, eyesY: number, smile: number, wink: number) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform4f(pose, x * 0.33, y * 0.25, eyesX, eyesY);
      gl.uniform2f(expression, smile, wink);
      gl.drawElements(gl.TRIANGLES, triangles.length, gl.UNSIGNED_SHORT, 0);
    },
    dispose,
  };
}
