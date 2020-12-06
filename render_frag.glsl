precision highp float;
varying vec2 textCoord;
uniform sampler2D texture;
void main(){
  gl_FragColor = vec4(texture2D(texture, textCoord).rgb, 1.0);
  //gl_FragColor = vec4(1.0,0.0,0.0,1.0);
}
