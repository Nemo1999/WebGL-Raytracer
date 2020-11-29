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

async function fetchSources(){
    
    var tracerVertexSource = await fetch("tracer_vert.glsl").then(r => r.text());
    var tracerFragSource = await fetch("tracer_frag.glsl").then(r => r.text());

    const gl = getGL();
    
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
	    ray11: gl.getUniformLocation(tracerProgram, 'ray11')
	    
	},
    };
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

    eye = {
	pos: vec3.fromValues(0.0,0.0,0.0),
	center: vec3.fromValues(0.0,0.0,-1.0),
	up: vec3.fromValues(0.0,1.0,0.0)
    };

    const getViewProjMat = function (eye){
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
	vec4.transformMat4(p0, vec4.fromValues(x, y, 0.0, 1.0),inv );
	console.log(x,y,p0)
	const p1 = vec3.create();
	vec3.scale(p1, vec3.fromValues(p0[0],p0[1],p0[2]), (1.0/p0[3]));
	const ans = vec3.create();
	vec3.subtract(ans,p1,eye.pos);
	return ans;
    }
    const viewProjectionMatrix = getViewProjMat(eye);
    console.log(viewProjectionMatrix);
    const r00 = getEyeRay(viewProjectionMatrix,eye,-1,-1);
    const r01 = getEyeRay(viewProjectionMatrix,eye,-1,1);
    const r10 = getEyeRay(viewProjectionMatrix,eye,1,-1);
    const r11 = getEyeRay(viewProjectionMatrix,eye,1,1);
    console.log(r00,r01,r10,r11);
    //Tell WebGL to use the program when drawing
    gl.useProgram(tracerInfo.program);
    
    //Set the shader uniforms
    gl.uniform3fv(
	tracerInfo.uniformLocations.eye,
	eye.pos);
    //Set the shader uniforms
    gl.uniform3fv(
	tracerInfo.uniformLocations.ray00,
	r00);
    //Set the shader uniforms
    gl.uniform3fv(
	tracerInfo.uniformLocations.ray01,
	r01);
    gl.uniform3fv(
	tracerInfo.uniformLocations.ray10,
	r10);
    gl.uniform3fv(
	tracerInfo.uniformLocations.ray11,
	r11);
    
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


fetchSources();


//main();
function main(){
    const gl = getGL();
    //var a = fetchSources();
    const vsSource=`
	attribute vec2 aVertexPosition;
	
	uniform mat4 uModelViewMatrix;
	uniform mat4 uProjectionMatrix;
	
	void main(){
	gl_Position =  uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition,0.0,1.0);
	}`;
    const fsSource=`
	void main(){
	gl_FragColor = vec4(1.0,0.0,1.0,1.0);
	}
	`;
    
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    const programInfo = {
	program: shaderProgram,
	attribLocations: {
	    vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
	},
	uniformLocations: {
	    projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
	    modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix')
	},
    };
    
    const buffers = initBuffers(gl);
    

    //draw the scenes
    
    drawScene(gl, programInfo, buffers);
    //gl.clearColor(0.0,0.0,0.0,1.0);
    //gl.clear(gl.COLOR_BUFFER_BIT);
    console.log('done');
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



function initBuffers(gl){
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

    return {position: positionBuffer,};
}

function drawScene(gl, programInfo, buffer){
    console.log(programInfo);
    console.log(buffer);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0); // clear anyting
    gl.enable(gl.DEPTH_TEST); // Enable Depth Testing 
    gl.depthFunc(gl.LEQUAL);// Near things obscure far things
    
    // Clear the canvas before we start drawing on it.
    
    gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);
    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.
    
    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
    
    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix,
		     fieldOfView,
		     aspect,
		     zNear,
		     zFar);
    
    //Set the drawing postion to the "identity" point, which is
    //the center of the scene
    const modelViewMatrix = mat4.create();
    
    //Now move the drawing potition a bit to where we want to
    //start drawing the square
    mat4.translate(modelViewMatrix,
		   modelViewMatrix,
		   [-0.0 , 0.0 , -6.5]);
    
    
    

    //Tell WebGL how to pull out the position from the position buffer to the
    //vertexPosition attribute
    
    const numComponents = 2; // pull out 2 variables per iteration
    const type = gl.FLOAT; // the data in buffer is 32bit floats
    const normalize = false; // don't normalize
    const stride = 0;// how many bytes to get from one set of values to the next
    const offset = 0;// how many bytes inside the buffer to start from;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.position);
    gl.vertexAttribPointer(
	programInfo.attribLocations.vertexPosition,
	numComponents,
	type,
	normalize,
	stride,
	offset
    );
    gl.enableVertexAttribArray(
	programInfo.attribLocations.vertexPosition);
    
    //Tell WebGL to use the program when drawing
    gl.useProgram(programInfo.program);
    
    //Set the shader uniforms
    gl.uniformMatrix4fv(
	programInfo.uniformLocations.projectionMatrix,
	false,
	projectionMatrix);
    
    gl.uniformMatrix4fv(
	programInfo.uniformLocations.modelViewMatrix,
	false,
	modelViewMatrix);
    
    {
	const offset = 0;
	const vertextCount =4;
	gl.drawArrays(gl.TRIANGLE_STRIP,offset,vertextCount);
    }
    
}

