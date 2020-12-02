function getGL(){
    const canvas = document.querySelector("#glCanvas");
    // Initialize the GL context
    const gl = canvas.getContext("webgl");
    if(gl === null){
	alert("Unable to initialize WebGL, your browser or machine may not support it");
	return null ;
    }
    return gl;
}



async function tracerMain(){
    //fetch shader source
    var fetch_vert = fetch("tracer_vert.glsl").then(r => r.text());
    var fetch_frag = fetch("tracer_frag.glsl").then(r => r.text());

    //get WebGL context
    const gl = getGL();

    //get shader source 
    var tracerVertexSource = await fetch_vert; 
    var tracerFragSource = await fetch_frag;

    // compile and link shader source 
    const tracerProgram = initShaderProgram(gl, tracerVertexSource, tracerFragSource);
    const tracerInfo = {
	program: tracerProgram,
	attribLocations: {
	    vertexPosition: gl.getAttribLocation(tracerProgram, 'vertex'),
	},
	uniformLocations: {
	    eye: gl.getUniformLocation(tracerProgram, 'eye'),
	    ray00: gl.getUniformLocation(tracerProgram, 'ray00'),
	    ray01: gl.getUniformLocation(tracerProgram, 'ray01'),
	    ray10: gl.getUniformLocation(tracerProgram, 'ray10'),
	    ray11: gl.getUniformLocation(tracerProgram, 'ray11'),
	    sphereCenterRadius: gl.getUniformLocation(tracerProgram, "sphereCenterRadius"),
	    sphereMaterial: gl.getUniformLocation(tracerProgram, "sphereMaterial"),
	    sphereColor: gl.getUniformLocation(tracerProgram, "sphereColor")
	},
    };

    eye = {
	pos: vec3.fromValues(0.0,0.0,0.0),
	center: vec3.fromValues(0.0,0.0,-1.0),
	up: vec3.fromValues(0.0,1.0,0.0)
    };

    //set ray directions
    const viewProjectionMatrix = getViewProjMat(gl,eye);
    const r00 = getEyeRay(viewProjectionMatrix,eye,-1,-1);
    const r01 = getEyeRay(viewProjectionMatrix,eye,-1,1);
    const r10 = getEyeRay(viewProjectionMatrix,eye,1,-1);
    const r11 = getEyeRay(viewProjectionMatrix,eye,1,1);

    //set sphere position and radius
    var sphereCenterRadius = [0.0,-10.0,10.0,0.0,0.0,0.0,5.0,1.0];
    for(var i=0;i<8*4;i++){
	sphereCenterRadius.push(Infinity);
    }
    
    //set sphere color 
    var sphereColor = [0.5,0.7,1.0,1.0,0.3,0.3];
    for(var i=0;i<8*3;i++){
	sphereCenterRadius.push(0.0);
    }

    var sphereMaterial = [Number.NEGATIVE_INFINITY,Number.NEGATIVE_INFINITY];
    for(var i=0;i<8;i++){
	sphereMaterial.push(0.0);
    }
    
    //Tell WebGL to use the program when drawing
    gl.useProgram(tracerInfo.program);

    //bind vertex attribute to shader (simple square attribute with four corner)
    enableSquareVAO(gl,tracerInfo);
    
    //Set the shader uniforms
    gl.uniform3fv(tracerInfo.uniformLocations.eye,eye.pos);
    gl.uniform3fv(tracerInfo.uniformLocations.ray00,r00);
    gl.uniform3fv(tracerInfo.uniformLocations.ray01,r01);
    gl.uniform3fv(tracerInfo.uniformLocations.ray10,r10);
    gl.uniform3fv(tracerInfo.uniformLocations.ray11,r11);    
    gl.uniform4fv(tracerInfo.uniformLocations.sphereCenterRadius,new Float32Array(sphereCenterRadius));
    gl.uniform3fv(tracerInfo.uniformLocations.sphereColor,sphereColor);
    gl.uniform1fv(tracerInfo.uniformLocations.sphereMaterial,sphereMaterial);    

    //clear framebuffer
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0); // clear anyting
    gl.enable(gl.DEPTH_TEST); // Enable Depth Testing 
    gl.depthFunc(gl.LEQUAL);// Near things obscure far things    
    gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);
    {
	const offset = 0;
	const vertextCount =4;
	gl.drawArrays(gl.TRIANGLE_STRIP,offset,vertextCount);
    }
    
}


tracerMain();
function enableSquareVAO(gl, tracerInfo){
    //create a buffer for square's positions.
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
	-1.0, 1.0,
	1.0,  1.0,
	-1.0, -1.0,
	1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER,
		  new Float32Array(positions),
		  gl.STATIC_DRAW);
    
    //Tell WebGL how to pull out the position from the position buffer to the
    //vertexPosition attribute
    {
	const numComponents = 2; // pull out 2 variables per iteration
	const type = gl.FLOAT; // the data in buffer is 32bit floats
	const normalize = false; // don't normalize
	const stride = 0;// how many bytes to get from one set of values to the next
	const offset = 0;// how many bytes inside the buffer to start from;
	
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.vertexAttribPointer(
	    tracerInfo.attribLocations.vertexPosition,
	    numComponents,
	    type,
	    normalize,
	    stride,
	    offset
	);
	gl.enableVertexAttribArray(
	    tracerInfo.attribLocations.vertexPosition);
    }

}



const getViewProjMat = function (gl, eye){
    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix,
		     fieldOfView,
		     aspect,
		     zNear,
		     zFar);
    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix,eye.pos,eye.center,eye.up);
    console.log(viewMatrix);
    const ans = mat4.create();
    return mat4.multiply(ans,viewMatrix, projectionMatrix);
}

function getEyeRay(matrix,eye, x, y){
    const p0 = vec4.create();
    const inv = mat4.create();
    mat4.invert(inv,matrix)
    vec4.transformMat4(p0, vec4.fromValues(x, y, -1.0, 1.0),inv );
    console.log(x,y,p0)
    const p1 = vec3.create();
    vec3.scale(p1, vec3.fromValues(p0[0],p0[1],p0[2]), (1.0/p0[3]));
    const ans = vec3.create();
    vec3.subtract(ans,p1,eye.pos);
    return ans;
}

function initShaderProgram(gl,vsSource,fsSource){
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    
    // create shader program
    
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    
    if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
	aler('Uable to initialize the shader program: '+ gl.getProgramInfoLog(shaderProgram));
	return null;
    }
    return shaderProgram;
}

//
//create a shader of the given type, upload the source
//and compiles it
function loadShader(gl, type, source){
    const shader = gl.createShader(type);
    // send the source to the shader object
    gl.shaderSource(shader,source);
    
    // compile the shader program
    gl.compileShader(shader);
    
    //see if it compiled successfully
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
	alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
	gl.deleteShader(shader);
	return null;
    }
    
    return shader;
}




