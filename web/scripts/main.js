var g_canvas;
var g_canvas2;
var g_video;
var g_debug = false;

var g_midi;
var g_baseTiltX = 0;
var g_baseTiltY = 0;
var g_tiltX = 0;
var g_tiltY = 0;
var g_scale = 2.;
var g_translate = [0, 0];
var g_mousePressing = false;
var g_center = [0, 0];
var g_mousePos = [0, 0];

var g_isOscTiltX = false;
var g_isOscTiltY = false;
var g_xyReverse = 0;
var g_mixFactor = 0;
var g_drawLine = 0;
var g_rotation = 0;
var g_rotationStep = 0;
var g_hueStep = 0.2;
var g_drawOuter = 0;
var g_maxIterations = 20;
var g_circleDist = 10;
var g_baseCircleDist = 0;
var g_isOscCircleDist = false;
var g_isOscSphereDist = false;
var g_initialHue = 0.04;
var g_tileTheta = Math.PI / 4.;
var g_sphereFactor = 1;

var KorgNanoKontrol = new Object();
KorgNanoKontrol.knob = new Object();
KorgNanoKontrol.slider = new Object();
KorgNanoKontrol.buttonS = new Object();
KorgNanoKontrol.buttonM = new Object();
KorgNanoKontrol.buttonR = new Object();
KorgNanoKontrol.buttonCycle = 46;
KorgNanoKontrol.controlListeners = new Object();
for(var i = 0 ; i < 8 ; i++){
    KorgNanoKontrol.slider[i] = i;
    KorgNanoKontrol.knob[i] = 16 + i;
    KorgNanoKontrol.buttonS[i] = 32 + i;
    KorgNanoKontrol.buttonM[i] = 48 + i;
    KorgNanoKontrol.buttonR[i] = 64 + i;
}

KorgNanoKontrol.addControlListaner = function(inputId, listener){
    KorgNanoKontrol.controlListeners[inputId] = listener;
}
KorgNanoKontrol.onMidiMessage = function(inputId, value){
    if(KorgNanoKontrol.controlListeners[inputId] != undefined)
        KorgNanoKontrol.controlListeners[inputId](value);
}

function success(midiAccess){
    g_midi = midiAccess;
    console.log("MIDI SUCCESS");
    setInputs(midiAccess);
}

function failure(msg){
    console.log("MIDI FAILED - " + msg);
}

function setInputs(midiAccess){
    var inputs = midiAccess.inputs;
    inputs.forEach(function(key, port){
        console.log("[" + key.state + "] manufacturer:" + key.manufacturer + " / name:" + key.name + " / port:" + port);
        key.onmidimessage = onMidiMessage;
    });
}

function onMidiMessage(event){
//    console.log(event);
    var str = '';
    for (var i = 0; i < event.data.length; i++) {
        str += event.data[i] + ':';
    }
//    console.log(str);
    KorgNanoKontrol.onMidiMessage(event.data[1], event.data[2]);
}

function setWebcam(){
    navigator.getUserMedia = (
	navigator.getUserMedia ||
	    navigator.webkitGetUserMedia ||
	    navigator.mozGetUserMedia
    );

    if(navigator.getUserMedia){
	navigator.getUserMedia(
	    {video: true,
	     audio: false},
	    function(localMediaStream){
		var url = (
		    window.URL ||
			window.webkitURL
		);
		g_video = document.createElement('video');
		g_video.addEventListener('canplay', function(){
		    g_video.removeEventListener('canplay', arguments.callee, true);
		    g_video.play();
		    render();
		}, true);

		g_video.src = url.createObjectURL(localMediaStream);
	    },
	    function(err){
		if(err.name === 'PermissionDeniedError'){
		    alert('denied permission');
		}else{
		    alert('can not be used webcam');
		}
	    }
	);
    }else{
	alert('not supported getUserMedia');
    }
}

var g_oscPort;
var g_tiltXFactor = 5.5;
window.addEventListener('load', function(event){
    g_oscPort = new osc.WebSocketPort({
        url: "ws://127.0.0.1:8081"
    });

    g_oscPort.on("message", function (oscMessage) {
//        console.log("message", oscMessage);
        if(oscMessage['address'] == '/audio/loud'){
            if(g_isOscTiltX){
                g_tiltX = g_baseTiltX + oscMessage['args'][0];
            }
            if(g_isOscTiltY){
                g_tiltY = g_baseTiltY + oscMessage['args'][0];
            }
            if(g_isOscCircleDist){
                g_circleDist = 0.72 + (g_baseCircleDist + 0.001) / (oscMessage['args'][0] * 0.1);
            }
	    if(g_isOscSphereDist){
		g_circleDist = 1. + g_sphereFactor * 300 * oscMessage['args'][0] * 1.5;
		console.log(g_circleDist);
	    }
            g_tileTheta = Math.PI / 16 + Math.PI / 2 * oscMessage['args'][0];
        }
    });

    g_oscPort.open();

    var i = 0;
    KorgNanoKontrol.addControlListaner(KorgNanoKontrol.knob[0],
                                       function(value){
                                           if(renderMode == RENDER_SG){
                                               if(g_isOscTiltX){
                                                   g_baseTiltX = (value - 64) / 64 * Math.PI / 5.5;
                                               }else{
                                                   g_tiltX = g_baseTiltX + (value - 64) / 64 * Math.PI / 5.5;
                                               }
                                           }else if(renderMode == RENDER_KS){
                                               g_circleDist = .72 + value / 10;
                                           }else if(renderMode == RENDER_TRI){
                                               g_tileTheta = Math.PI / 16 + Math.PI / 2 * value / 150;
                                           }else if(renderMode == RENDER_3D){
                                               g_circleDist = 400 * value / 127;
                                           }
                                       });
    KorgNanoKontrol.addControlListaner(KorgNanoKontrol.buttonS[0],
                                       function(value){
                                           if(value == 127){
                                               if(renderMode == RENDER_SG){
                                                   g_isOscTiltX = !g_isOscTiltX;
                                               }else if(renderMode == RENDER_KS){
                                                   g_isOscCircleDist = !g_isOscCircleDist;
                                               }else if(renderMode == RENDER_3D){
						   g_isOscSphereDist = !g_isOscSphereDist;
					       }
                                           }
                                       });
    KorgNanoKontrol.addControlListaner(KorgNanoKontrol.buttonM[0],
                                       function(value){
                                           if(value == 127)
                                               g_drawLine = !g_drawLine;
                                       });
    KorgNanoKontrol.addControlListaner(KorgNanoKontrol.buttonM[1],
                                       function(value){
                                           if(value == 127)
                                               g_drawOuter = !g_drawOuter;
                                       });
    KorgNanoKontrol.addControlListaner(KorgNanoKontrol.buttonM[2],
                                       function(value){
                                           if(value == 127)
                                               g_maxIterations++;
                                       });
    KorgNanoKontrol.addControlListaner(KorgNanoKontrol.buttonR[2],
                                       function(value){
                                           if(value == 127 && g_maxIterations > 0)
                                              g_maxIterations--;
                                       });
    KorgNanoKontrol.addControlListaner(KorgNanoKontrol.buttonR[0],
                                       function(value){
                                           if(value == 127)
                                               g_xyReverse = !g_xyReverse;
                                       });
    KorgNanoKontrol.addControlListaner(KorgNanoKontrol.knob[1],
                                       function(value){
                                           if(renderMode == RENDER_SG){
                                               if(g_isOscTiltY){
                                                   g_baseTiltY = (value - 64) / 64 * Math.PI / 5.5;
                                               }else{
                                                   g_tiltY = g_baseTiltY + (value - 64) / 64 * Math.PI / 5.5;
                                               }
                                           }else if(renderMode == RENDER_KS){
                                               g_baseCircleDist = value / 100;
                                           }else if(renderMode == RENDER_3D){
					       g_sphereFactor = 0.01 + value / 64;
					   }
                                       });
    KorgNanoKontrol.addControlListaner(KorgNanoKontrol.buttonS[1],
                                       function(value){
                                           if(value == 127)
                                               g_isOscTiltY = !g_isOscTiltY;
                                        });
    KorgNanoKontrol.addControlListaner(KorgNanoKontrol.knob[2],
                                       function(value){

                                           g_scale = .1 + value / 10;
					   if(renderMode == RENDER_3D)
					       g_scale = (value - 127);
                                       });
    KorgNanoKontrol.addControlListaner(KorgNanoKontrol.knob[3],
                                       function(value){
                                           if(renderMode == RENDER_SG){
                                               g_baseTiltX = (value) / 127 * Math.PI / 5.5;
                                               g_tiltX = g_baseTiltX + (value - 64) / 64 * Math.PI / 5.5;
                                           }else if(renderMode == RENDER_KS ||
                                                    renderMode == RENDER_TRI){
                                               g_initialHue = value / 257;
                                           }else if(renderMode == RENDER_3D){
					       g_rotation = (value - 64) / 64
					   }
                                       });
    KorgNanoKontrol.addControlListaner(KorgNanoKontrol.knob[4],
                                       function(value){
                                           if(renderMode == RENDER_SG){
                                               g_baseTiltY = (value) / 127 * Math.PI / 5.5;
                                               g_tiltY = g_baseTiltY + (value - 64) / 64 * Math.PI / 5.5;
                                           }else if(renderMode == RENDER_KS ||
                                                    renderMode == RENDER_TRI){
                                               g_hueStep = 0.01 +  value / 257;
                                           }
                                       });
    KorgNanoKontrol.addControlListaner(KorgNanoKontrol.knob[5],
                                       function(value){
                                           g_mixFactor = (value) / 127;
                                       });
    KorgNanoKontrol.addControlListaner(KorgNanoKontrol.buttonCycle,
                                       function(value){
//                                           location.reload();
                                           g_translate[0] = 0;
                                           g_translate[1] = 0;
                                           g_rotation = 0 ;
					   g_scale = 1;
                                       });
    KorgNanoKontrol.addControlListaner(KorgNanoKontrol.knob[6],
                                       function(value){
                                           g_rotationStep = value / 127;
                                       });
    KorgNanoKontrol.addControlListaner(KorgNanoKontrol.knob[7],
                                       function(value){
                                           g_hueStep = 0.01 + value / 257;
                                       });
    navigator.requestMIDIAccess().then(success, failure)
    g_canvas = document.getElementById('canvas');
    g_canvas2 = document.getElementById('canvas2');
    if(!g_debug){
        resizeCanvasFullscreen();
    }
    setWebcam();

}, false);

window.addEventListener('resize', function(event){
    if(!g_debug){
        resizeCanvasFullscreen();
    }
}, false);

window.addEventListener('mousedown', function(event){
    g_mousePressing = true;
}, false);

window.addEventListener('mouseup', function(event){
    g_mousePressing = false;
}, false);

window.addEventListener('mousemove', function(event){
    g_mousePos = [event.clientX * 2 - g_center[0], g_canvas.height - event.clientY * 2 - g_center[1]];
}, false);

window.addEventListener('beforeunload', function(event){
    g_oscPort.close()
}, false);

window.addEventListener('keydown', function(event){
    if(event.key == '1'){
        switchingFunctions[RENDER_SG]();
        renderMode = RENDER_SG;
    }else if(event.key == '2'){
        switchingFunctions[RENDER_KS]();
        renderMode = RENDER_KS;
    }else if(event.key == '3'){
        switchingFunctions[RENDER_TRI]();
        renderMode = RENDER_TRI;
    }else if(event.key == '4'){
	switchingFunctions[RENDER_3D]();
	renderMode = RENDER_3D;
    }
}, false);


var g_scaleFactor = 1;
// window.addEventListener('mousewheel', function(event){
//     if(event.wheelDelta < 0.){
//         g_scaleFactor --;
//         g_scale = 1/ Math.abs(g_scaleFactor);
//     }else{
//         g_scaleFactor ++;
//         g_scale = 1/ Math.abs(g_scaleFactor);
//     }
// }, false);


function resizeCanvasFullscreen(){
    g_canvas.style.width = window.innerWidth + 'px';
    g_canvas.style.height = window.innerHeight + 'px';
    g_canvas.width = window.innerWidth * window.devicePixelRatio;
    g_canvas.height = window.innerHeight * window.devicePixelRatio;
    g_center = [g_canvas.width / 2, g_canvas.height / 2];
}


function setupShaderGraphicProgram(gl, fragId){
    var program = gl.createProgram();
    attachShader(gl, fragId, program, gl.FRAGMENT_SHADER);
    attachShader(gl, 'vs', program, gl.VERTEX_SHADER);
    program = linkProgram(gl, program);

    var uniLocation = new Array();
    uniLocation[0] = gl.getUniformLocation(program, 'texture');
    uniLocation[1] = gl.getUniformLocation(program, 'iResolution');
    uniLocation[2] = gl.getUniformLocation(program, 'camResolution');
    uniLocation[3] = gl.getUniformLocation(program, 'iGlobalTime');
    uniLocation[4] = gl.getUniformLocation(program, 'tilt');
    uniLocation[5] = gl.getUniformLocation(program, 'scale');
    uniLocation[6] = gl.getUniformLocation(program, 'translate');
    uniLocation[7] = gl.getUniformLocation(program, 'xyReverse');
    uniLocation[8] = gl.getUniformLocation(program, 'mixFactor');
    uniLocation[9] = gl.getUniformLocation(program, 'drawLine');
    uniLocation[10] = gl.getUniformLocation(program, 'rotation');
    uniLocation[11] = gl.getUniformLocation(program, 'drawOuter');
    uniLocation[12] = gl.getUniformLocation(program, 'hueStep');
    uniLocation[13] = gl.getUniformLocation(program, 'maxIterations');

    var position = [-1.0, 1.0, 0.0,
                    1.0, 1.0, 0.0,
	            -1.0, -1.0,  0.0,
	            1.0, -1.0, 0.0
                   ];
    var index = [
	0, 2, 1,
	1, 2, 3
    ];
    var vPosition = createVbo(gl, position);
    var vIndex = createIbo(gl, index);
    var vAttLocation = gl.getAttribLocation(program, 'position');
    gl.bindBuffer(gl.ARRAY_BUFFER, vPosition);
    gl.enableVertexAttribArray(vAttLocation);
    gl.vertexAttribPointer(vAttLocation, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vIndex);

    var switchSg = function(){
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, vPosition);
        gl.enableVertexAttribArray(vAttLocation);
        gl.vertexAttribPointer(vAttLocation, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vIndex);
    }

    var render = function(elapsedTime){
        gl.viewport(0, 0, g_canvas.width, g_canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniform2fv(uniLocation[1], [g_canvas.width, g_canvas.height]);
        gl.uniform2fv(uniLocation[2], [g_video.videoWidth, g_video.videoHeight]);
        gl.uniform1f(uniLocation[3], elapsedTime * 0.001);
        gl.uniform2fv(uniLocation[4], [g_tiltX, g_tiltY]);
        gl.uniform1f(uniLocation[5], g_scale);
        gl.uniform2fv(uniLocation[6], g_translate);
        gl.uniform1i(uniLocation[7], g_xyReverse);
        gl.uniform1f(uniLocation[8], g_mixFactor);
        gl.uniform1i(uniLocation[9], g_drawLine);
        gl.uniform1f(uniLocation[10], g_rotation);
        gl.uniform1i(uniLocation[11], g_drawOuter);
        gl.uniform1f(uniLocation[12], g_hueStep);
        gl.uniform1i(uniLocation[13], g_maxIterations);

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, g_video);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

	gl.flush();
    }

    return [program, uniLocation, vPosition, vIndex, vAttLocation, switchSg, render];
}

function setupSchottkyProgram(gl, fragId){
    var program = gl.createProgram();
    attachShader(gl, fragId, program, gl.FRAGMENT_SHADER);
    attachShader(gl, 'vs', program, gl.VERTEX_SHADER);
    program = linkProgram(gl, program);

    var uniLocation = new Array();
    uniLocation[0] = gl.getUniformLocation(program, 'iResolution');
    uniLocation[1] = gl.getUniformLocation(program, 'iGlobalTime');
    uniLocation[2] = gl.getUniformLocation(program, 'rotation');
    uniLocation[3] = gl.getUniformLocation(program, 'translate');
    uniLocation[4] = gl.getUniformLocation(program, 'scale');
    uniLocation[5] = gl.getUniformLocation(program, 'circleDist');
    uniLocation[6] = gl.getUniformLocation(program, 'initialHue');
    uniLocation[7] = gl.getUniformLocation(program, 'hueStep');
    uniLocation[8] = gl.getUniformLocation(program, 'tileTheta');

    var position = [-1.0, 1.0, 0.0,
                    1.0, 1.0, 0.0,
	            -1.0, -1.0,  0.0,
	            1.0, -1.0, 0.0
                   ];
    var index = [
	0, 2, 1,
	1, 2, 3
    ];
    var vPosition = createVbo(gl, position);
    var vIndex = createIbo(gl, index);
    var vAttLocation = gl.getAttribLocation(program, 'position');
    gl.bindBuffer(gl.ARRAY_BUFFER, vPosition);
    gl.enableVertexAttribArray(vAttLocation);
    gl.vertexAttribPointer(vAttLocation, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vIndex);

    var switchProgram = function(){
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, vPosition);
        gl.enableVertexAttribArray(vAttLocation);
        gl.vertexAttribPointer(vAttLocation, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vIndex);
    }

    var render = function(elapsedTime){
        gl.viewport(0, 0, g_canvas.width, g_canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniform2fv(uniLocation[0], [g_canvas.width, g_canvas.height]);
        gl.uniform1f(uniLocation[1], elapsedTime * 0.001);
        gl.uniform1f(uniLocation[2], g_rotation);
        gl.uniform2fv(uniLocation[3], g_translate);
        gl.uniform1f(uniLocation[4], g_scale);
        gl.uniform1f(uniLocation[5], g_circleDist);
        gl.uniform1f(uniLocation[6], g_initialHue);
        gl.uniform1f(uniLocation[7], g_hueStep);
        gl.uniform1f(uniLocation[8], g_tileTheta);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, g_video);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

	gl.flush();
    }

    return [program, uniLocation, vPosition, vIndex, vAttLocation, switchProgram, render];
}


function setupOptProgram(gl, fragId, vertId){
    var program = gl.createProgram();
    attachShader(gl, fragId, program, gl.FRAGMENT_SHADER);
    attachShader(gl, vertId, program, gl.VERTEX_SHADER);
    program = linkProgram(gl, program);

    var uniLocation = new Array();

    var attLocation = new Array();
    attLocation[0] = gl.getAttribLocation(program, 'position');


    var position = [];
    var resolutionX = 10;
    var resolutionY = 10;
    var intervalX = 1.0 / resolutionX;
    var intervalY = 1.0 / resolutionY;
    var i, j, x, y;
    for(i = 0; i < resolutionX; i++){
	for(j = 0; j < resolutionY; j++){
	    x = i * intervalX * 2.0 - 1.0;
	    y = j * intervalY * 2.0 - 1.0;
	    position.push(x, y);
	}
    }
    var cp = new ComplexProbability(new Complex(0.25, 0),
                                    new Complex(0.25, 0),
                                    Complex.ZERO);
    cp.setQ(new Complex(0.25, 0.25));
    var ex = new OptLimitSetExplorer(cp.getGens());
//    console.log(ex.gens);
    //    console.log('calc');
    ex.run(10, 0.01);
    console.log(ex.points);
    var numPoints = ex.points.length / 2;
    var pointPosition = new Float32Array(ex.points);
    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.enableVertexAttribArray(attLocation[0]);
    gl.vertexAttribPointer(attLocation[0], 2, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, pointPosition, gl.DYNAMIC_DRAW);

    return [program, uniLocation, vbo, attLocation, pointPosition, numPoints];
}

function createVideoTexture(gl){
    var videoTexture = gl.createTexture(gl.TEXTURE_2D);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, videoTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, g_video);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return videoTexture;
}

const RENDER_OPT = 0;
const RENDER_SG = 1;
const RENDER_KS = 2;
const RENDER_TRI = 3;
const RENDER_3D = 4;
var renderMode = RENDER_SG;
var switchingFunctions = [];
function render(){
    var startTime = new Date().getTime();
    var gl = g_canvas.getContext('webgl') || g_canvas.getContext('experimental-webgl');
    var [sgProgram, sgUniLocation, sgPositionVbo, sgIndex, sgAttLocation,
        switchSg, renderSg] = setupShaderGraphicProgram(gl, 'fs3');
    //var [optProgram, optUniLocation, optPositionVbo,
   //      optAttLocation, optPointPosition, optNumPoints] = setupOptProgram(gl, 'optfs', 'optvs');
    var videoTexture = createVideoTexture(gl);

    switchingFunctions[RENDER_SG] = switchSg;

    var [sgProgram, sgUniLocation, sgPositionVbo, sgIndex, sgAttLocation,
         switchKs, renderKs] = setupSchottkyProgram(gl, 'kissingSchottky')
    switchingFunctions[RENDER_KS] = switchKs;

    var [triProgram, triUniLocation, triPositionVbo, triIndex, triAttLocation,
         switchTri, renderTri] = setupSchottkyProgram(gl, 'triangularTiling')
    switchingFunctions[RENDER_TRI] = switchTri;

    var [k3dProgram, k3dUniLocation, k3dPositionVbo, k3dIndex, k3dAttLocation,
         switch3D, render3D] = setupSchottkyProgram(gl, 'kissing3d')
    switchingFunctions[RENDER_3D] = switch3D;

    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);

    switchSg();
    renderMode = RENDER_SG;
    (function(){
        var elapsedTime = new Date().getTime() - startTime;
        g_rotation += g_rotationStep;
        if(g_mousePressing){
            if(renderMode == RENDER_SG){
                g_translate[0] += (g_mousePos[0]) / 5000 * g_scale;
                g_translate[1] += (g_mousePos[1]) / 5000 * g_scale;
            }else if(renderMode == RENDER_KS){
                g_translate[0] += (g_mousePos[0]) / 450 * g_scale;
                g_translate[1] += (g_mousePos[1]) / 450 * g_scale;
            }else if(renderMode == RENDER_TRI){
                g_translate[0] += (g_mousePos[0]) / 5000 / g_scale;
                g_translate[1] += (g_mousePos[1]) / 5000 / g_scale;
            }
        }
        if(renderMode == RENDER_SG)
            renderSg(elapsedTime);
        else if(renderMode == RENDER_KS)
            renderKs(elapsedTime);
        else if(renderMode == RENDER_TRI)
            renderTri(elapsedTime);
	else if(renderMode == RENDER_3D)
	    render3D(elapsedTime);
	requestAnimationFrame(arguments.callee);
    })();
}

function attachShader(gl, shaderId, program, shaderType){
    var shader = gl.createShader(shaderType);
    elem = document.getElementById(shaderId).text;
    gl.shaderSource(shader, elem);
    gl.compileShader(shader);
    if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
        gl.attachShader(program, shader);
    }else{
	alert(gl.getShaderInfoLog(shader));
	console.log(gl.getShaderInfoLog(shader));
    }
}

function linkProgram(gl, program){
    gl.linkProgram(program);
    if(gl.getProgramParameter(program, gl.LINK_STATUS)){
	gl.useProgram(program);
	return program;
    }else{
	return null;
    }
}

function createVbo(gl, data){
    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return vbo;
}

function createIbo(gl, data){
    var ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    return ibo;
}
