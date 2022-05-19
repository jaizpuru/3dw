    var scene, camera, renderer, light;
    var stadium, ground;

    var screenHeight = 0.273, //mts
    	initial = {x: -100, y: 60, f: 10};

	function load(callback) {
		var loader = new THREE.OBJMTLLoader();
		loader.load( 'models/Petco Park.obj', 'models/Petco Park.mtl', callback);
	}

	function connectToKinect() {
		var kinectService = new Alchemy({ 
		    Server: 'localhost',
		    Port: 9001,
		    DebugMode: false
		});

		kinectService.Connected = function(){
		    console.log("Connected!");
		    window.onmousemove = null;
		};

		kinectService.Disconnected = function() {
		    //throw "Server Down";
		    console.log('Disconnected');
		};

		kinectService.MessageReceived = function(event) {
			//console.log(event.data);
			var coords = event.data.split('|');
			doMove(parseFloat(coords[0]), parseFloat(coords[1]), parseFloat(coords[2]));
		};

		kinectService.Start();
	}


    function init(model) {

        scene = new THREE.Scene();

		stadium = model;
		stadium.scale.x = stadium.scale.y = stadium.scale.z = 0.1;
        scene.add(stadium);

        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 20, 2000 );

        camera.position.set(initial.x, initial.y, -1220);
		camera.lookAt(new THREE.Vector3(stadium.position.x, initial.y, stadium.position.z));

		// LIGHTS
		var dirLight = new THREE.PointLight( 0xff0000, 1, 500 );
		dirLight.position.set( 0, 250, 0 );
		scene.add(dirLight);
		scene.add(new THREE.AmbientLight( 0x666666));

	    light = new THREE.DirectionalLight(0xffffff, 1);
		light.target = stadium;
		light.shadowCameraNear = 100;
	    light.shadowCameraFar = 1200;
        scene.add(light);

		ground = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.MeshLambertMaterial({color: 0x0000aa}));
		ground.rotation.x = -Math.PI/2;
		scene.add(ground);

        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setSize( window.innerWidth, window.innerHeight );

        document.body.appendChild(renderer.domElement);

        // Init handlers
		window.onmousemove = moveMouse;
        connectToKinect();
        render();
    }

    function moveMouse(e) {
    	var x = (0.5 - e.screenX / window.innerWidth) * 3;
    	var y = 0;//initial.y;//(0.5 - e.screenY / window.innerHeight) * 2;
    	var z = 0.1 + e.screenY / window.innerHeight;
    	doMove(x, y, z);
    }

    function doMove(x, y, z) {
		var viewingAngleH = Math.atan(x/z);
		var viewingScaleH = Math.cos(viewingAngleH);

    	// Horizontal
    	camera.lookAt(new THREE.Vector3(x, y, z).add(camera.position));
		//camera.scale.x = viewingScaleH;

		var relativeScreenWidth = viewingScaleH * screenWidth;
		// Vertical
		//var angleV = Math.atan(y/z);

		// Depth
		var distance = new THREE.Vector3(x,y,z).length();
		var fov = Math.atan(screenHeight / 2 / distance) * 2;
		camera.fov = fov / Math.PI * 180;

		camera.updateProjectionMatrix();
    }

    function render() {
        requestAnimationFrame(render);

		//controls.update();
		light.position = camera.position;

        renderer.render( scene, camera );
    }



$(function() {
	load(init);
});

