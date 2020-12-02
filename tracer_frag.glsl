// start of fragment shader
#define numSphere 10
#define maxDepth 3
precision highp float;
uniform vec3 eye;
varying vec3 initialRay;
//uniform float textureWeight;
//uniform float timeSinceStart;
//uniform sampler2D texture;

//light position
uniform vec3 lightPos;

// record the position of the spheres
// value of infinity  means the sphere should not be shown
uniform vec4 sphereCenterRadius[numSphere];

// record the material of the sphere
// -inf for diffuse material
// -k for glass with refractive constant k (k>0)
//  0 for mirror material  
//  g for glossiness of mirror material (g = random noise magnitude added to the reflected ray)
uniform float sphereMaterial[numSphere];
//record the color of each sphere
uniform vec3 sphereColor[numSphere];

const float inf = 1000000000000000.0;


// find the intersection index of the given ray
// t = inf means no intersection in the given direction
float intersectSphere(vec3 origin, vec3 dir, vec3 center, float radius){
  // length( (origin + t * dir) - center ) = radius
  // to solve t, square both sides and solve the quadratic formula
  float a = dot(dir,dir);
  float b = 2.0 * dot(dir,origin - center);
  float c = dot(origin - center,origin - center) - radius * radius;
  float discriminate = b*b - 4.0 * a * c;
  if(discriminate < 0.0) return inf;
  float tNear = (-b - sqrt(discriminate))/ (2.0 * a);
  if(tNear > 0.0 ) return tNear;
  float tFar = (-b + sqrt(discriminate))/(2.0 * a);
  if(tFar > 0.0) return tFar;
  return inf;
}

// find intersection with multiple objects, return hitObjIndex and t 
float intersectObjects(vec3 origin, vec3 dir, inout int hitObjIndex){
  float tMin = inf;
    for(int j=0;j < numSphere;j++){
      //infinity radius means the sphere should not be drawn
      if(sphereCenterRadius[j].w > inf)continue;
      float t = intersectSphere(origin, dir, sphereCenterRadius[j].xyz,sphereCenterRadius[j].w);
      if(t < tMin) {tMin = t; hitObjIndex = j;}
    }
    return tMin;
}

//
//vec3 materialDiffuse(){;}

vec3 findBackGround(vec3 origin, vec3 dir){
  return mix(vec3(1.0,1.0,1.0),vec3(0.5,0.7,1.0),(dir.y+1.0)*0.5);
}


//find pixel color iteratively
vec3 findColor(vec3  origin,vec3 dir ){
  vec3 o = origin;
  vec3 d = dir;
  vec3 colorMask = vec3(1.0,1.0,1.0);
  vec3 accumColor = vec3(0.0,0.0,0.0);
  for(int i=0;i < maxDepth ;i++){
    int hitObjIndex;
    //record the nearest hit so far
    float t = intersectObjects(o,d,hitObjIndex);
    
    
  }
  return accumColor;
}

void main(){
  float t = intersectSphere(eye, initialRay, vec3(0.0,0.0,-9.0), 2.0);
  if(  t != inf )
    gl_FragColor = vec4(1.0, 0.0, 0.0,1.0);//vec4(vec3((atan(t)/3.1415)+0.5),1.0);
  else
    gl_FragColor = vec4(mix(vec3(1.0,1.0,1.0),vec3(0.5,0.7,1.0),(initialRay.y+1.0)*0.5) , 1.0);
  //gl_FragColor = vec4(initialRay,1.0);
}
