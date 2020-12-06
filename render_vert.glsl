attribute vec3 vertex;
varying vec2 textCoord;
void main(){
  textCoord = (vertex.xy + 1.0) * 0.5;
  gl_Position = vec4(vertex, 1.0);
}
