"use strict";

let gl = initializeWebGL("gl-canvas"); // see webglUtils.js
if (!gl) console.log("Your browser does not support webgl2");

const program = initializeShaders(gl, vertexShaderSource, fragmentShaderSource); // see shaders.js and webglUtils.js
gl.useProgram(program);
gl.enable(gl.DEPTH_TEST);

const vertices = generateMesh(); // see geometryUtils.js
const { p: positionsArray, n: normalsArray } = computeNormals(vertices); // see geometryUtils.js

const vertexBuffer = createBuffer(gl, flatten(positionsArray)); // see MVnew.js
const normalBuffer = createBuffer(gl, flatten(normalsArray));
const aPosition = gl.getAttribLocation(program, "aPosition");
const aNormal = gl.getAttribLocation(program, "aNormal");
bindBuffer(gl, vertexBuffer, aPosition, 4); // see bufferUtls.jsi
bindBuffer(gl, normalBuffer, aNormal, 4);

const uModelViewMatrix = gl.getUniformLocation(program, "uModelViewMatrix");
const uProjectionMatrix = gl.getUniformLocation(program, "uProjectionMatrix");
const uNormalMatrix = gl.getUniformLocation(program, "uNormalMatrix");
const uLightPosition = gl.getUniformLocation(program, "uLightPosition");
const uAmbientProduct = gl.getUniformLocation(program, "uAmbientProduct");
const uDiffuseProduct = gl.getUniformLocation(program, "uDiffuseProduct");
const uSpecularProduct = gl.getUniformLocation(program, "uSpecularProduct");
const uShininess = gl.getUniformLocation(program, "uShininess");

const vertices2 = [
  0, 2, 0, 1, 0, 0, 0, 1, 3, 0, 0, 1, 3, 0, 0, 1, 3, 2, 0, 1, 0, 2, 0, 1, 3, 2,
  1, 1, 3, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 2, 1, 1, 3, 2, 1, 1, 0, 2, 1, 1,
  0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 2, 0, 1, 0, 2, 1, 1, 3, 2, 0, 1, 3, 0,
  0, 1, 3, 0, 1, 1, 3, 0, 1, 1, 3, 2, 1, 1, 3, 2, 0, 1, 0, 2, 0, 1, 0, 2, 1, 1,
  3, 2, 1, 1, 3, 2, 1, 1, 3, 2, 0, 1, 0, 2, 0, 1, 0, 0, 0, 1, 3, 0, 0, 1, 3, 0,
  1, 1, 0, 0, 0, 1, 3, 0, 1, 1, 0, 0, 1, 1,
];

let canvas;

let positionsArray2 = computeNormals(vertices2).p; // see geometryUtils.js
let normalsArray2 = computeNormals(vertices2).n;

// variables for model view and projection matrices
let near = 0.1;
let far = 100.0;
let radius = 1.5;
let theta = 0.0;
let phi = 0.0;
let dr = (5.0 * Math.PI) / 180.0;

let fovy = 80;
let aspect = 16.0 / 9 / 0;
let left = -32.0;
let right = 32.0;
let theTop = 18.0;
let bottom = -18.0;

// lighting
let lightPosition = vec4(5.0, 10.0, 5.0, 1.0);
let lightAmbient = vec4(0.3, 0.3, 0.3, 1.0);
let lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
let lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

// material
let materialAmbient = vec4(0.1, 0.1, 0.3, 1.0);
let materialDiffuse = vec4(0.2, 0.2, 0.6, 1.0);
let materialSpecular = vec4(0.8, 0.8, 0.8, 1.0);
let materialShininess = 50.0;

// variables for gui
let camX = 13;
let camY = 7;
let camZ = -11;
let arm1X = 0;
let arm1Y = 2;
let arm1Z = 0;
let armR = 0;
let j1Ang = 0;
let j2Ang = 0;
let lightX = 2;
let lightY = 4;
let lightZ = 2;
lightPosition = vec4(lightX, lightY, lightZ, 0.0);

// view matricies
let modelViewMatrix, projectionMatrix;
let uModelViewMatrixLoc, uProjectionMatrixLoc;
let normalsMatrix, uNormalMatrixLoc;
let vertexBuffer1, normalsBuffer1;
let vertexBuffer1Loc, normalsBuffer1Loc;
let vertexBuffer2, normalsBuffer2;
let vertexBuffer2Loc, normalsBuffer2Loc;
let uLightPositionLoc;
let uAmbientProductLoc;
let uDiffuseProductLoc;
let uSpecularProductLoc;
let uShininessLoc;

let eye;
let at = vec3(0.0, 0.0, 0.0);
let up = vec3(0.0, 1.0, 0.0);

initialize();

//init
function initialize() {
  //for terrain mesh
  normalsBuffer1 = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer1);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
  normalsBuffer1Loc = gl.getAttribLocation(program, "aNormal");
  gl.vertexAttribPointer(normalsBuffer1Loc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(normalsBuffer1Loc);

  vertexBuffer1 = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer1);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);
  vertexBuffer1Loc = gl.getAttribLocation(program, "aPosition");
  gl.vertexAttribPointer(vertexBuffer1Loc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertexBuffer1Loc);

  // for arm1
  normalsBuffer2 = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer2);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray2), gl.STATIC_DRAW);
  normalsBuffer2Loc = gl.getAttribLocation(program, "aNormal");

  // bind buffers for each mesh
  vertexBuffer2 = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer2);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray2), gl.STATIC_DRAW);
  vertexBuffer2Loc = gl.getAttribLocation(program, "aPosition");

  // Get the location of the uniform variables
  uModelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
  uProjectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");
  uNormalMatrixLoc = gl.getUniformLocation(program, "uNormalMatrix");
  uLightPositionLoc = gl.getUniformLocation(program, "uLightPosition");
  uAmbientProductLoc = gl.getUniformLocation(program, "uAmbientProduct");
  uDiffuseProductLoc = gl.getUniformLocation(program, "uDiffuseProduct");
  uSpecularProductLoc = gl.getUniformLocation(program, "uSpecularProduct");
  uShininessLoc = gl.getUniformLocation(program, "uShininess");

  // wire up the gui controls
  addEventListeners(); // see eventHandlers.js

  // Start the render loop
  render();
}

// render
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //set up for model view and projection matrix calcs
  eye = vec3(camX, camY, camZ);
  modelViewMatrix = lookAt(eye, at, up);
  let fovy = 60;
  let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  let near = 0.1;
  let far = 100.0;
  projectionMatrix = perspective(fovy, aspect, near, far); // see MVnew.js

  // set up for lighting model
  lightPosition = vec4(lightX, lightY, lightZ, 0.0);

  gl.uniform4fv(uLightPositionLoc, flatten(lightPosition));

  // Pass the updated model-view matrix to the shader
  gl.uniformMatrix4fv(uModelViewMatrixLoc, false, flatten(modelViewMatrix));
  gl.uniformMatrix4fv(uProjectionMatrixLoc, false, flatten(projectionMatrix));
  gl.uniformMatrix3fv(
    uNormalMatrixLoc,
    false,
    flatten(normalMatrix(modelViewMatrix, true))
  );
  gl.uniform4fv(
    uAmbientProductLoc,
    flatten(mult(lightAmbient, materialAmbient))
  );
  gl.uniform4fv(
    uDiffuseProductLoc,
    flatten(mult(lightDiffuse, materialDiffuse))
  );
  gl.uniform4fv(
    uSpecularProductLoc,
    flatten(mult(lightSpecular, materialSpecular))
  );
  gl.uniform1f(uShininessLoc, materialShininess);

  // terrain mesh
  // Pass uniforms for position and normal for terrain mesh
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer1);
  gl.vertexAttribPointer(vertexBuffer1Loc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertexBuffer1Loc);
  gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer1);
  gl.vertexAttribPointer(normalsBuffer1Loc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(normalsBuffer1Loc);
  // draw terrain mesh
  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 4);

  // arm1
  // Pass uniforms for arm1
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer2);
  gl.vertexAttribPointer(vertexBuffer2Loc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertexBuffer2Loc);
  gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer2);
  gl.vertexAttribPointer(normalsBuffer2Loc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(normalsBuffer2Loc);
  // calculate position of arm1
  modelViewMatrix = mult(modelViewMatrix, translate(arm1X, arm1Y, arm1Z));
  // Translate to the point of rotation
  modelViewMatrix = mult(modelViewMatrix, translate(0.1, 0.5, 1));
  // Apply the rotations
  modelViewMatrix = mult(modelViewMatrix, rotateY(armR));
  // Translate to the point of rotation
  modelViewMatrix = mult(modelViewMatrix, translate(-0.1, -1, -0.5));
  gl.uniformMatrix4fv(uModelViewMatrixLoc, false, flatten(modelViewMatrix));
  // draw arm 1
  gl.drawArrays(gl.TRIANGLES, 0, vertices2.length / 4);

  // arm2
  // calculate position of arm2 from end of arm1
  modelViewMatrix = mult(modelViewMatrix, translate(3, 0, 0));
  // Translate to the point of rotation
  modelViewMatrix = mult(modelViewMatrix, translate(0.1, 0.5, 1));
  // Apply the rotations
  modelViewMatrix = mult(modelViewMatrix, rotateZ(j1Ang));
  // Translate back to the original position
  modelViewMatrix = mult(modelViewMatrix, translate(-0.1, -0.5, -1));
  gl.uniformMatrix4fv(uModelViewMatrixLoc, false, flatten(modelViewMatrix));
  // draw arm 2
  gl.drawArrays(gl.TRIANGLES, 0, vertices2.length / 4);

  //arm3
  // Pass uniforms for arm3
  // calculate position of arm3 from end of arm2
  modelViewMatrix = mult(modelViewMatrix, translate(3, 0, 0));
  // Translate to the point of rotation
  modelViewMatrix = mult(modelViewMatrix, translate(0.1, 0.5, 1));
  // Apply the rotations
  modelViewMatrix = mult(modelViewMatrix, rotateZ(j2Ang));
  // Translate back to the original position
  modelViewMatrix = mult(modelViewMatrix, translate(-0.1, -0.5, -1));
  gl.uniformMatrix4fv(uModelViewMatrixLoc, false, flatten(modelViewMatrix));
  // draw arm 3
  gl.drawArrays(gl.TRIANGLES, 0, vertices2.length / 4);

  requestAnimationFrame(render);
}
