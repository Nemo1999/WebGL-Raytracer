// vertex shader, interpolate ray per-pixel
attribute vec3 vertex;
uniform vec3 eye, ray00, ray01, ray10, ray11;
varying vec3 initialRay;
void main() {
  vec2 percent = vertex.xy * 0.5 + 0.5;
  initialRay = normalize(mix(mix(ray00, ray01, percent.y), mix(ray10, ray11, percent.y), percent.x));
  gl_Position = vec4(vertex, 1.0);
}
