/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.PostProcessor = function ( renderer, scene, camera, material ) {
	this.material = material;
	THREE.PostProcessor.quad.material = this.material;
	this.renderer = renderer;
	this.scene = scene;
	this.camera = camera;
};

THREE.PostProcessor.prototype = {

	render: function () {

		// Render target scene
		renderer.render( this.scene, this.camera, this.renderTarget, true );

		// Project current frame onto the "screen texture"
		this.material.uniforms["tDiffuse"].value = this.renderTarget;

		// Apply filter and re-render
		renderer.render( THREE.PostProcessor.scene, THREE.PostProcessor.camera );
	},

	reset: function () {
		this.renderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false } );
	}
};

// shared ortho camera
THREE.PostProcessor.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
THREE.PostProcessor.quad = new THREE.Mesh(new THREE.PlaneGeometry( 2, 2 ), null);
THREE.PostProcessor.scene = new THREE.Scene();
THREE.PostProcessor.scene.add(THREE.PostProcessor.quad);
