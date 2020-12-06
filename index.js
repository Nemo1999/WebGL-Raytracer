
var gameState = new Object;
gameState.startTime = new Date() ;
var sceneData = new Object;

var tracerProgram;
var renderProgram;

async function tracerMain(){
    //fetch shader source
    var fetch_tracer_vert = fetch("tracer_vert.glsl").then(r => r.text());
    var fetch_tracer_frag = fetch("tracer_frag.glsl").then(r => r.text());
    var fetch_render_vert = fetch("render_vert.glsl").then(r => r.text());
    var fetch_render_frag = fetch("render_frag.glsl").then(r => r.text());

    //get WebGL context
    const gl = getGL();

    //get shader source 
    var tracerVertexSource = await fetch_tracer_vert; 
    var tracerFragSource = await   fetch_tracer_frag;
    var renderVertexSource = await fetch_render_vert; 
    var renderFragSource = await   fetch_render_frag;

    
    // compile and link shader source 
    tracerProgram = initShaderProgram(gl, tracerVertexSource, tracerFragSource);
    renderProgram = initShaderProgram(gl, renderVertexSource, renderFragSource);
    initSceneData(gl,sceneData);
    initGameState(gameState);
    
    // clear screen;
    clearFrameBuffer(gl);
   
    setInterval(()=>{render(gl, renderProgram, sceneData); update(gl,tracerProgram, gameState, sceneData); },500);
    
}


tracerMain()

function update(gl, tracerProgram, gameState, sceneData){
    
    //set ray directions
    gameState.viewProjectionMatrix = getViewProjMat(gl,gameState.eyePos, gameState.eyeCenter, gameState.eyeUp);
    gameState.ray00 = getEyeRay(gameState.viewProjectionMatrix,gameState.eyePos,-1,-1);
    gameState.ray01 = getEyeRay(gameState.viewProjectionMatrix,gameState.eyePos,-1,1);
    gameState.ray10 = getEyeRay(gameState.viewProjectionMatrix,gameState.eyePos,1,-1);
    gameState.ray11 = getEyeRay(gameState.viewProjectionMatrix,gameState.eyePos,1,1);
    gameState.timeSinceStart = (new Date() - gameState.startTime)* 0.01;
    gameState.textureWeight = sceneData.frameCount / (sceneData.frameCount + 1.0);
    
    gl.useProgram(tracerProgram);
    // bind texture[0] to fragmentshader 
    gl.bindTexture(gl.TEXTURE_2D, sceneData.textures[0]);
    //bind fragmentshader output framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneData.framebuffer);
    // bind framebuffer color data  to texture[1]
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneData.textures[1], 0);
    
    enableSquareVAO(gl,tracerProgram);

    setUniforms(gl, tracerProgram, gameState);
    
    const offset = 0;
    const vertextCount =4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertextCount);
    

    sceneData.frameCount++;
    sceneData.textures.reverse();
}
 
function render(gl, renderProgram, sceneData){
    gl.useProgram(renderProgram);
    gl.bindTexture(gl.TEXTURE_2D, sceneData.textures[0]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    enableSquareVAO(gl,renderProgram);
    const offset = 0;
    const vertextCount =4;
    gl.drawArrays(gl.TRIANGLE_STRIP,offset,vertextCount);
}

function initSceneData(gl, sceneData){
    sceneData.framebuffer = gl.createFramebuffer();
    // create textures
    var type = gl.getExtension('OES_texture_float') ? gl.FLOAT : gl.UNSIGNED_BYTE;
    sceneData.textures = [];
    for(var i = 0; i < 2; i++) {
	sceneData.textures.push(gl.createTexture());
	gl.bindTexture(gl.TEXTURE_2D, sceneData.textures[i]);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1000, 700, 0, gl.RGB, type, null);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    sceneData.frameCount = 0.0;
}

function initGameState(gameState){
    gameState.eyePos = vec3.fromValues(0.0,0.0,0.0);
    gameState.eyeCenter = vec3.fromValues(0.0,0.0,-1.0);
    gameState.eyeUp = vec3.fromValues(0.0,1.0,0.0);

    gameState.lightPos = vec3.fromValues(10.0,10.0,10.0);
    gameState.lightSize = 0.5;
    
    //set sphere position and radius
    gameState.sphereCenterRadius = [0.0,-100.0,-10.0,100.0,
			      0.0,1.0,-5.0,1.0,
			      0.5,0.3,-2.0,0.5,
			      -3.0,0.7,-6.0,0.7];
    for(var i=0;i<6*4;i++){
	gameState.sphereCenterRadius.push(Infinity);
    }
    
    //set sphere color 
    gameState.sphereColor = [0.5,0.7,1.0,
		       0.7,0.3,0.3,
		       1.0,1.0,1.0,
		       1.0,1.0,1.0];
    for(var i=0;i<6*3;i++){
	gameState.sphereColor.push(0.0);
    }

    gameState.sphereMaterial = [Number.NEGATIVE_INFINITY,Number.NEGATIVE_INFINITY, -2.3, -2.3];
    for(var i=0;i<6;i++){
	gameState.sphereMaterial.push(0.0);
    }
}


function setUniforms(gl, program, data){
    for(var name in data){
	var value =  data[name];
	var location = gl.getUniformLocation(program, name);
	if(location == null) continue;
	if(typeof(value) == 'number'){
	    gl.uniform1f(location, value);
	}
	else if(value instanceof Array){
	    if(value.length % 3 == 0)
		gl.uniform3fv(location, value);
	    else if( value.length % 4 == 0)
		gl.uniform4fv(location, value);
	    else
		gl.uniform1fv(location, value);
	    
	}
	else if(value instanceof Float32Array){
	    if(value.length == 3)
		gl.uniform3fv(location, value);
	    else if(value.length == 4)
		gl.uniform4fv(location, value);
	    else
	     {continue;}
	}
	else{
	    {continue;}
	}
    }

}

// clear gl canvas(default framebuffer) if no framebuffer is bind
function clearFrameBuffer(gl){
    //clear framebuffer
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0); // clear anyting
    gl.enable(gl.DEPTH_TEST); // Enable Depth Testing 
    gl.depthFunc(gl.LEQUAL);// Near things obscure far things    
    gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);
}

// setup VAO for a single square in gl state machine
function enableSquareVAO(gl, tracerProgram){
    vertexPosition = gl.getAttribLocation(tracerProgram, 'vertex');
    //create a buffer for square's positions.
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    const vertexes = [
	-1.0, 1.0,
	1.0,  1.0,
	-1.0, -1.0,
	1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER,
		  new Float32Array(vertexes),
		  gl.STATIC_DRAW);
    
    //Tell WebGL how to pull out the position from the position buffer to the
    //vertexPosition attribute
    {
	const numComponents = 2; // pull out 2 variables per iteration
	const type = gl.FLOAT; // the data in buffer is 32bit floats
	const normalize = false; // don't normalize
	const stride = 0;// how many bytes to get from one set of values to the next
	const offset = 0;// how many bytes inside the buffer to start from;
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.vertexAttribPointer(
	    vertexPosition,
	    numComponents,
	    type,
	    normalize,
	    stride,
	    offset
	);
	gl.enableVertexAttribArray(vertexPosition);
    }

}



const getViewProjMat = function (gl, eyePos, eyeCenter, eyeUp){
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
    mat4.lookAt(viewMatrix,eyePos,eyeCenter,eyeUp);
    const ans = mat4.create();
    return mat4.multiply(ans,viewMatrix, projectionMatrix);
}

function getEyeRay(matrix,eyePos, x, y){
    const p0 = vec4.create();
    const inv = mat4.create();
    mat4.invert(inv,matrix)
    vec4.transformMat4(p0, vec4.fromValues(x, y, -1.0, 1.0),inv );
    const p1 = vec3.create();
    vec3.scale(p1, vec3.fromValues(p0[0],p0[1],p0[2]), (1.0/p0[3]));
    const ans = vec3.create();
    vec3.subtract(ans,p1,eyePos);
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

function getGL(){
    const canvas = document.querySelector("#glCanvas");
    // Initialize the GL context
    const gl = canvas.getContext("webgl2");
    if(gl === null){
	alert("Unable to initialize WebGL, your browser or machine may not support it");
	return null ;
    }
    return gl;
}
