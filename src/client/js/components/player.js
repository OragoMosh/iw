define([
	'js/rendering/renderer',
	'js/system/events',
	'js/misc/physics',
	'js/sound/sound',
	'js/system/client'
], function (
	renderer,
	events,
	physics,
	sound,
	client
) {
	return {
		type: 'player',

		oldPos: {
			x: 0,
			y: 0
		},

		lastPing: null,
		pingDelay: 5000,

		init: function () {
			const obj = this.obj;

			obj.addComponent('keyboardMover');
			obj.addComponent('mouseMover');
			obj.addComponent('serverActions');
			obj.addComponent('pather');

			events.on('onRespawn', this.onRespawn.bind(this));

			events.emit('onGetPortrait', obj.portrait);
		},

		extend: function (blueprint) {
			let collisionChanges = blueprint.collisionChanges;
			delete blueprint.collisionChanges;

			if (collisionChanges)
				collisionChanges.forEach(c => physics.setCollision(c));
		},

		update: function () {
			this.ping();

			const obj = this.obj;
			const x = obj.x;
			const y = obj.y;

			let oldPos = this.oldPos;

			if ((oldPos.x === x) && (oldPos.y === y))
				return;

			oldPos.x = x;
			oldPos.y = y;

			sound.update(x, y);

			this.positionCamera(x, y);
		},

		ping: function () {
			let time = +new Date();
			if (time - this.lastPing > this.pingDelay) {
				this.lastPing = time;

				client.request({
					cpn: 'player',
					method: 'performAction',
					data: {
						cpn: 'auth',
						method: 'ping'
					}
				});
			}
		},

		positionCamera: function (x, y, instant) {
			renderer.setPosition({
				x: (x - (renderer.width / (scale * 2))) * scale,
				y: (y - (renderer.height / (scale * 2))) * scale
			}, instant);		
		},

		onRespawn: function (position) {
			this.positionCamera(position.x, position.y, true);
		}
	};
});
