// start of fragment shader
precision highp float;
uniform vec3 eye;
varying vec3 initialRay;
//uniform float textureWeight;
//uniform float timeSinceStart;
//uniform sampler2D texture;
//uniform float glossiness;

void main(){
  gl_FragColor = vec4(mix(vec3(1.0,1.0,1.0),vec3(0.0,0.0,1.0),(initialRay.y+1.0)*0.5) , 1.0);
  //gl_FragColor = vec4(initialRay,1.0);
}
