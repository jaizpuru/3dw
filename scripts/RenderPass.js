/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.RenderPass = function ( scene, camera, overrideMaterial, clearColor ) {
	this.scene = scene;
	this.camera = camera;
};

THREE.RenderPass.prototype = {

	render: function ( renderer, writeBuffer, readBuffer, delta ) {

		renderer.render( this.scene, this.camera, readBuffer, true );

	}

};
