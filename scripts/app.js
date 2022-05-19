    var scene, camera, renderer, light;
    var park, chair, ground, frame;

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

	function load(callback) {
		var loader = new THREE.OBJMTLLoader();
		//loader.load( 'models/Petco Park.obj', 'models/Petco Park.mtl', function(_park) {
			//loader.load('models/Chair.obj', 'models/Chair.mtl', function(_chair) {
				//park = _park;
				//chair = _chair;
				callback();
			//});
		//});
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
		camera.updateProjectionMatrix();
		env = {
	    	availableHeight: window.innerHeight/screen.height,
	    	availableWidth: window.innerWidth/screen.width
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
        var geo = new THREE.SphereGeometry(0.01, 8, 8);
        frame = new THREE.Object3D();

        for (var i = 0; i < 4; i++) {
        	var y = (i < 2) ? screenParams.height/2 : -screenParams.height/2;
        	var x = (i % 2 == 0) ? -screenParams.width/2 : screenParams.width/2;
	        var frameVertex = new THREE.Mesh(geo, mat);
	        frameVertex.position.set(x, y, 0);
	        frame.add(frameVertex);
        }
        frame.add(new THREE.Mesh(geo, mat));
        frame.position.set(0, screenParams.altitude + screenParams.height / 2, 0);
        scene.add(frame);

        // Model
		//park.scale.x = park.scale.y = park.scale.z = 0.1;
		//park.position.set(0, -60, 1220);
        //scene.add(park);

        //chair.scale.x = chair.scale.y = chair.scale.z = 0.1;
        //chair.position.set(0, 0, 60);
        //scene.add(chair);
        
        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 2000 );
        camera.position.set(0, screenParams.altitude + screenParams.height/2, -2);
		camera.lookAt(frame.position);

		// LIGHTS
		var dirLight = new THREE.PointLight( 0xff0000, 1, 500 );
		dirLight.position.set( 0, 250, 0 );
		scene.add(dirLight);
		scene.add(new THREE.AmbientLight( 0x666666));

	    light = new THREE.DirectionalLight(0xffffff, 1);
		//light.target = park;
		light.shadowCameraNear = 100;
	    light.shadowCameraFar = 1200;
        scene.add(light);

		ground = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.MeshLambertMaterial({color: 0x0000aa}));
		ground.rotation.x = -Math.PI/2;
		scene.add(ground);

		wall = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.MeshLambertMaterial({color: 0x00aa22}));
		wall.rotation.y = Math.PI;
		wall.position.z = 200;
		scene.add(wall);

        renderer = new THREE.WebGLRenderer({antialias: true});
        composer = new THREE.EffectComposer( renderer);
        document.body.appendChild(renderer.domElement);

		//POST PROCESSING
		//Create Shader Passes
		//renderPass = new THREE.RenderPass( scene, camera );

		//composer = new THREE.EffectComposer( renderer);
		//composer.addPass(renderPass);
		//var mirror = new THREE.ShaderPass(THREE.MirrorShader);
		//composer.addPass(mirror);
		//mirror.renderToScreen = true;

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
    	var z = 0.5;//0.1 + (e.pageY / window.innerHeight) * 1.8;/*0.2mts - 2mts*/;
    	doMove(x, y, z);
    }

    function doMove(x, y, z) {
    	$('.stats')
    		.find('.x').text(x).end()
    		.find('.y').text(y).end()
    		.find('.z').text(z).end();

    	camera.position.set(-x, y, -z);

		var target = frame.position.clone();

    	var distanceVector = camera.position.clone().sub(target);

    	var zScale = Math.atan(screenParams.height * env.availableHeight / 2 / distanceVector.length()) * 2;
    	camera.fov = zScale / Math.PI * 180;
		//camera.updateProjectionMatrix();

		// Correct camera target based on viewing angle - Real deal
		var y0 = frame.position.y + frame.scale.y * screenParams.height/2;
		var yf = frame.position.y - frame.scale.y * screenParams.height/2;

		var ya1 = Math.atan((y - y0) / z);
		var ya2 = Math.atan((y - yf) / z);
		var yam = (ya2 + ya1)/2;

		target.y = y - Math.tan(yam) * z;

		//Target X
		var x0 = frame.scale.x * screenParams.width/2;
		var xf = -frame.scale.x * screenParams.width/2;

		var xa1 = Math.atan((x - x0) / z);
		var xa2 = Math.atan((x - xf) / z);
		var xam = (xa2 + xa1)/2;

		target.x = Math.tan(xam) * z - x;

    	camera.lookAt(target);

    	// Project frame vertices onto the screen so as to correctly determine the portion of the rendered picture that should make it to the final picture.
    	var projCamera = camera.clone();
    	projCamera.scale.x = projCamera.scale.y = 1;

    	projCamera.updateMatrixWorld();

		var projector = new THREE.Projector();
		var vector = new THREE.Vector3();

		var x0 = 0, x1 = 0, y0 = 0, y1 = 0;
		var dot;
		var inverseMatrix = new THREE.Matrix4().getInverse(projCamera.matrixWorld);
		var projectorMatrix = new THREE.Matrix4().multiplyMatrices( projCamera.projectionMatrix, inverseMatrix );

		for (var i = 0; i < 4; i++) {
			dot = vector.setFromMatrixPosition( frame.children[i].matrixWorld ).applyProjection( projectorMatrix );
			x0 = Math.min(x0, dot.x);
			y0 = Math.min(y0, dot.y);
			x1 = Math.max(x1, dot.x);
			y1 = Math.max(y1, dot.y);
		}

		camera.scale.x = Math.max(x1, -x0);
		camera.scale.y = Math.max(y1, -y0);
    }

    function render() {
        requestAnimationFrame(render);

		//controls.update();
		//light.position = camera.position;
		//composer.render(0.1);
        renderer.render( scene, camera );
    }



$(function() {
	load(init);
});

