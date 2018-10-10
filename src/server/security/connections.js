let objects = require('../objects/objects');

module.exports = {
	players: [],

	sockets: null,

	onHandshake: function (socket) {
		let p = objects.build();
		p.socket = socket;
		p.addComponent('auth');
		p.addComponent('player');

		this.players.push(p);
	},
	onDisconnect: function (socket) {
		let player = this.players.find(p => p.socket.id === socket.id);

		if (!player)
			return;

		let sessionDuration = 0;

		if (player.has('id')) {
			if (player.social)
				player.social.dc();
			sessionDuration = ~~(((+new Date()) - player.player.sessionStart) / 1000);
			atlas.updateObject(player, {
				components: [{
					type: 'stats',
					sessionDuration: sessionDuration
				}]
			});
			atlas.removeObject(player);
		}

		if (player.name) {
			this.emit('events', {
				onGetMessages: [{
					messages: [{
						class: 'color-blueB',
						message: player.name + ' has gone offline'
					}]
				}],
				onGetDisconnectedPlayer: [player.name]
			});
		}

		this.players.spliceWhere(p => p.socket.id === socket.id);
	},
	route: function (socket, msg) {
		let player = null;

		if (msg.id) {
			player = this.players.find(p => p.id === msg.id);
			let source = this.players.find(p => p.socket.id === socket.id);
			if (!source)
				return;
			if (!msg.data)
				msg.data = {};
			msg.data.sourceId = source.id;
		} else
			player = this.players.find(p => p.socket.id === socket.id);

		if (
			(!player) ||
			(
				(player.permadead) &&
				(['getCharacterList', 'getCharacter', 'deleteCharacter'].indexOf(msg.method) === -1)
			) ||
			(
				(player.dead) &&
				(msg.data.method !== 'respawn')
			)
		)
			return;

		let cpn = player[msg.cpn];
		if (!cpn)
			return;

		if (cpn[msg.method])
			cpn[msg.method](msg);
	},
	unzone: function (msg) {
		let socket = msg.socket;
		let player = this.players.find(p => p.socket.id === socket.id);

		if (!player)
			return;

		if (player.social)
			player.social.dc();

		atlas.removeObject(player, true, this.onUnzone.bind(this, msg));

		let keys = Object.keys(player);
		keys.forEach(function (k) {
			let val = player[k];
			if (val && val.type) {
				if (['player', 'auth', 'syncer'].indexOf(val.type) === -1)
					delete player[k];
			}
		});

		this.emit('events', {
			onGetMessages: [{
				messages: [{
					class: 'color-blueB',
					message: player.name + ' has gone offline'
				}]
			}],
			onGetDisconnectedPlayer: [player.name]
		});

		//If we don't do this, the atlas will try to remove it from the thread
		player.zoneName = null;
		player.name = null;

		//A hack to allow us to actually call methods again (like retrieve the player list)
		player.dead = false;
	},

	onUnzone: function (msg) {
		msg.callback();
	},

	logOut: function (exclude) {
		let players = this.players;
		let pLen = players.length;
		for (let i = 0; i < pLen; i++) {
			let p = players[i];

			if ((!p) || (p === exclude) || (!p.auth))
				continue;

			if (p.auth.username === exclude.auth.username) {
				p.socket.emit('dc', {});
				console.log(p.name, exclude.name);
				if (p.name === exclude.name)
					return p.id;
			}
		}
	},

	emit: function (event, msg) {
		this.sockets.emit(event, msg);
	},

	getCharacterList: function () {
		let result = [];
		let players = this.players;
		let pLen = players.length;
		for (let i = 0; i < pLen; i++) {
			let p = players[i];
			if (!p.name)
				continue;

			result.push({
				zone: p.zone,
				name: p.name,
				level: p.level,
				class: p.class,
				id: p.id
			});
		}

		return result;
	}
};
