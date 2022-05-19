var scene, camera, renderer, postProcessor, postProcUniforms;
var room, chair, ground, frame;

// Full HD monitor
/*
var screenParams = {
	diag: 21.5 * 0.0254, //mts
	altitude: 1.15, //mts
	sensorAltitude: 1.1 //mts
};
*/

// Full HD TV
var screenParams = {
	diag: 40 * 0.0254, //mts
	altitude: 1.15, //mts
	sensorAltitude: 1.1, //mts
	sensorOffsetZ: -0.05 //mts
};

	screenParams.aspectRatio = screen.width / screen.height;
screenParams.diagAngle = Math.atan(1/screenParams.aspectRatio);
screenParams.height = Math.sin(screenParams.diagAngle) * screenParams.diag; //mts
screenParams.width = Math.cos(screenParams.diagAngle) * screenParams.diag; //mts

function dummyScene(cb) {
	ground = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.MeshLambertMaterial({color: 0x0000aa}));
	ground.rotation.x = -Math.PI/2;
	scene.add(ground);

	wall = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.MeshLambertMaterial({color: 0x00aa22}));
	wall.rotation.y = Math.PI;
	wall.position.z = 200;
	scene.add(wall);

	cb();
}

function storageScene(cb) {
	var loader = new THREE.OBJMTLLoader();
	loader.load( 'models/Storage.obj', 'models/Storage.mtl', function(_room) {
		loader.load('models/Chair.obj', 'models/Chair.mtl', function(_chair) {
			room = _room;
			chair = _chair;

	        // Model
	        scene.add(room);

	        chair.scale.x = chair.scale.y = chair.scale.z = 0.1;
	        chair.position.set(0, 0, 60);
	        scene.add(chair);
	        
			cb();
		});
	});
}

function connectToKinect() {
	var kinectService = new Alchemy({ 
	    Server: '127.0.0.1',
	    Port: 9001,
	    DebugMode: true
	});

	kinectService.Connected = function(){
	    window.onmousemove = null;
	};

	kinectService.Disconnected = function() {
	};

	kinectService.MessageReceived = function(event) {
		//console.log(event.data);
		var rCoords = event.data.split('|');
		var coords = {x: parseFloat(rCoords[0]), y: parseFloat(rCoords[1]), z: parseFloat(rCoords[2])};
		coords.y += screenParams.sensorAltitude;
		coords.z += screenParams.sensorOffsetZ;

		doMove(coords.x, coords.y, coords.z);
	};

	kinectService.Start();
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	renderer.setSize( window.innerWidth, window.innerHeight );
	postProcessor.reset();

	camera.updateProjectionMatrix();
	env = {
    	availableHeight: window.innerHeight/screen.height,
    	availableWidth: window.innerWidth/screen.width,
    	frameHalfWidth: screenParams.width/2 * window.innerWidth/screen.width,
    	frameHalfHeight: screenParams.height/2 * window.innerHeight/screen.height
    };
    frame.scale.x = env.availableWidth;
    frame.scale.y = env.availableHeight;
    for(var i = 0; i < 4; i++) {
    	frame.children[i].scale.x = 1 / env.availableWidth;
    	frame.children[i].scale.y = 1 / env.availableHeight;
    }
}

function init() {
    scene = new THREE.Scene();

    // Frame
    var mat = new THREE.MeshBasicMaterial({/*transparent: true, opacity: 0.6, */color: 0xff0000});
    var geo = new THREE.SphereGeometry(0.004, 4, 4);
    frame = new THREE.Object3D();

    for (var i = 0; i < 4; i++) {
    	var y = screenParams.height/2 * (i < 2 ? 1 : -1);
    	var x = screenParams.width/2 * ((i % 2 > 0) ?  1 : -1);
        var frameVertex = new THREE.Mesh(geo, mat);
        frameVertex.position.set(x, y, 0);
        frame.add(frameVertex);
    }
    frame.position.set(0, screenParams.altitude + screenParams.height / 2, 0);
    scene.add(frame);

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 2000 );
    camera.position.set(0, screenParams.altitude + screenParams.height/2, -2);
	camera.lookAt(frame.position);

	// LIGHTS
	var pointLight = new THREE.PointLight( 0xffffff, 1, 500 );
	pointLight.position.set( 0, 5, 4 );
	scene.add(pointLight);
	scene.add(new THREE.AmbientLight( 0x666666));

    storageScene(completeInitialization);
}

function completeInitialization() {
    renderer = new THREE.WebGLRenderer({antialias: true});
    document.body.appendChild(renderer.domElement);

	//POST PROCESSING
	//Create Shader Passes
	postProcUniforms = {
		tDiffuse: {type: "t", value: null},
		tl:     {type: "v2", value: new THREE.Vector2(0, 1)},
		tr:     {type: "v2", value: new THREE.Vector2(1, 1)},
		bl:     {type: "v2", value: new THREE.Vector2(0, 0)},
		br:     {type: "v2", value: new THREE.Vector2(1, 0)}
	};
	var material = new THREE.ShaderMaterial( {
		uniforms: postProcUniforms,
		vertexShader: document.getElementById( 'vertexShader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentShader' ).textContent
	});

	postProcessor = new THREE.PostProcessor(renderer, scene, camera, material);

    onWindowResize();
    window.addEventListener('resize', onWindowResize, false );

    // Init handlers
	window.onmousemove = moveMouse;
    connectToKinect();
    render();
}

function moveMouse(e) {
	var x = (0.5 - e.pageX / window.innerWidth) * screenParams.width * 3;
	var y = frame.position.y + (0.5 - e.pageY / window.innerHeight) * screenParams.height * 3;
	var z = 0.8;//0.1 + (e.pageY / window.innerHeight) * 1.8;/*0.2mts - 2mts*/;
	doMove(x, y, z);
}

var projectionMatrix = new THREE.Matrix4();
var unity = new THREE.Vector3(1,1,1);
function doMove(x, y, z) {
	camera.position.set(-x, y, -z);

	var target = frame.position.clone();


	// Adjust camera target based on viewing angle - Where's the frame center if you take the perspective into account?
	var ya1 = Math.atan((y - frame.position.y - env.frameHalfHeight) / z);
	var ya2 = Math.atan((y - frame.position.y + env.frameHalfHeight) / z);
	var yam = (ya2 + ya1)/2;
	target.y = y - Math.tan(yam) * z;

	var xa1 = Math.atan((x - env.frameHalfWidth) / z);
	var xa2 = Math.atan((x + env.frameHalfWidth) / z);
	var xam = (xa2 + xa1) / 2;
	target.x = Math.tan(xam) * z - x;

	camera.lookAt(target);


	// What's the correct viewing angle?
	var distanceVector = camera.position.clone().sub(target);
	var zScale = Math.atan(screenParams.height * env.availableHeight / 2 / distanceVector.length()) * 2;
	camera.fov = zScale / Math.PI * 180;
	camera.updateProjectionMatrix();


	// Project frame vertices onto the screen so as to correctly determine the portion of the rendered picture that should make it to the final picture.
	// Matrix operation where extracted from THREE.Projector, camera.updateWorldMatrix();
	projectionMatrix.compose(camera.position, camera.quaternion, unity);
	var vector = new THREE.Vector3();

	var x0 = 0, x1 = 0, y0 = 0, y1 = 0;
	var dots = [];
	projectionMatrix = new THREE.Matrix4().multiplyMatrices( camera.projectionMatrix, new THREE.Matrix4().getInverse(projectionMatrix) );

	for (var i = 0; i < 4; i++) {
		var dot = vector.clone().setFromMatrixPosition( frame.children[i].matrixWorld ).applyProjection( projectionMatrix );
		dots.push(dot);
		x0 = Math.min(x0, dot.x);
		y0 = Math.min(y0, dot.y);
		x1 = Math.max(x1, dot.x);
		y1 = Math.max(y1, dot.y);
	}

	var scaleX = camera.scale.x = Math.max(x1, -x0);
	var scaleY = camera.scale.y = Math.max(y1, -y0);

	postProcUniforms.tr.value.set(0.5 + dots[0].x / 2 / scaleX, 0.5 + dots[0].y / 2 / scaleY);
	postProcUniforms.tl.value.set(0.5 + dots[1].x / 2 / scaleX, 0.5 + dots[1].y / 2 / scaleY);
	postProcUniforms.br.value.set(0.5 + dots[2].x / 2 / scaleX, 0.5 + dots[2].y / 2 / scaleY);
	postProcUniforms.bl.value.set(0.5 + dots[3].x / 2 / scaleX, 0.5 + dots[3].y / 2 / scaleY);

	$('.stats')
		.find('.x').text(Math.round(x * 100) / 100).end()
		.find('.y').text(Math.round((y - frame.position.y) * 100) / 100).end()
		.find('.z').text(Math.round(z * 100) / 100).end()
		.find('.f').text(Math.round(camera.fov));
}

function render() {
    requestAnimationFrame(render);
	postProcessor.render();
    //renderer.render( scene, camera );
}



$(function() {
	init();
});

