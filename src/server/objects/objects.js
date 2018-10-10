let objBase = require('./objBase');

module.exports = {
	lastId: 0,

	objects: [],

	init: function (_instance) {
		this.instance = _instance;
		this.physics = this.instance.physics;
	},

	getNextId: function () {
		return ++this.lastId;
	},

	build: function (skipPush, clientObj) {
		let o = extend({}, objBase);

		if (clientObj)
			o.update = null;
		else {
			o.id = this.getNextId();
			o.addComponent('syncer');
			o.instance = this.instance;

			if (!skipPush)
				this.objects.push(o);
		}

		return o;
	},

	transferObject: function (o) {
		let obj = this.build();

		let components = o.components;
		delete o.components;
		delete o.id;

		for (let p in o) 
			obj[p] = o[p];

		let cLen = components.length;
		for (let i = 0; i < cLen; i++) {
			let c = components[i];

			let cpn = obj.addComponent(c.type, null, true);

			for (let p in c) 
				cpn[p] = c[p];

			if (cpn.transfer)
				cpn.transfer();
		}

		return obj;
	},

	buildObjects: function (list, skipPush) {
		let lLen = list.length;
		for (let i = 0; i < lLen; i++) {
			let l = list[i];

			let obj = this.build(skipPush, l.clientObj);

			obj.sheetName = l.sheetName;
			obj.cell = l.cell;
			obj.name = l.name;

			obj.x = l.x;
			obj.y = l.y;

			if (l.ttl)
				obj.ttl = l.ttl;

			if (l.width) {
				obj.width = l.width;
				obj.height = l.height;
			}

			if (l.area)
				obj.area = l.area;

			//Add components (certain ones need to happen first)
			//TODO: Clean this part up
			let properties = extend({}, l.properties);
			['cpnMob'].forEach(function (c) {
				let blueprint = properties[c] || null;
				if ((blueprint) && (typeof (blueprint) === 'string'))
					blueprint = JSON.parse(blueprint);

				if (!blueprint)
					return;

				delete properties[c];

				let type = c.replace('cpn', '').toLowerCase();

				obj.addComponent(type, blueprint);
			}, this);

			for (let p in properties) {
				if (p.indexOf('cpn') === -1) {
					obj[p] = properties[p];
					continue;
				}

				let type = p.replace('cpn', '');
				type = type[0].toLowerCase() + type.substr(1);
				let blueprint = properties[p] || null;
				if ((blueprint) && (typeof (blueprint) === 'string'))
					blueprint = JSON.parse(blueprint);

				obj.addComponent(type, blueprint);
			}

			let extraProperties = l.extraProperties || {};
			for (let p in extraProperties) {
				let cpn = obj[p];
				let e = extraProperties[p];
				for (let pp in e) 
					cpn[pp] = e[pp];
				
				if (cpn.init)
					cpn.init();
			}

			if ((this.physics) && (!obj.dead)) {
				if (!obj.width)
					this.physics.addObject(obj, obj.x, obj.y);
				else
					this.physics.addRegion(obj);
			}

			if (obj.aggro)
				obj.aggro.move();

			if (lLen === 1)
				return obj;
		}
	},

	find: function (callback) {
		return this.objects.find(callback);
	},

	removeObject: function (obj, callback, useServerId) {
		let found = this.objects.spliceFirstWhere(o => obj.id === (useServerId ? o.serverId : o.id));
		if (!found)
			return;

		let physics = this.physics;
		if (physics) {
			if (!found.width)
				physics.removeObject(found, found.x, found.y);
			else
				physics.removeRegion(found);
		}

		found.destroy();

		if (callback)
			callback(found);
	},

	addObject: function (o, callback) {
		let newO = this.build(true);

		let components = o.components;

		delete o.components;

		for (let p in o) 
			newO[p] = o[p];

		let len = components.length;
		for (let i = 0; i < len; i++) {
			let c = components[i];

			let newC = newO.addComponent(c.type, c);
			extend(newC, c);
		}

		this.objects.push(newO);
		if (!newO.dead)
			this.physics.addObject(newO, newO.x, newO.y);

		callback(newO);

		return newO;
	},
	sendEvent: function (msg) {
		let player = this.objects.find(p => p.id === msg.id);
		if (!player)
			return;

		player.socket.emit('event', {
			event: msg.data.event,
			data: msg.data.data
		});
	},
	sendEvents: function (msg) {
		let players = {};
		let objects = this.objects;

		let data = msg.data;
		for (let e in data) {
			let event = data[e];
			let eLen = event.length;

			for (let j = 0; j < eLen; j++) {
				let eventEntry = event[j];

				let obj = eventEntry.obj;

				if (e !== 'serverModule') {
					let to = eventEntry.to;
					let toLen = to.length;
					for (let i = 0; i < toLen; i++) {
						let toId = to[i];

						let player = players[toId];
						if (!player) {
							let findPlayer = objects.find(o => o.id === toId);
							if (!findPlayer)
								continue;
							else {
								player = (players[toId] = {
									socket: findPlayer.socket,
									events: {}
								});
							}
						}

						let eventList = player.events[e] || (player.events[e] = []);
						eventList.push(obj);
					}
				} else
					global[obj.module][obj.method](obj.msg);
			}
		}

		for (let p in players) {
			let player = players[p];
			player.socket.emit('events', player.events);
		}
	},
	updateObject: async function (msg) {
		let player = this.objects.find(p => p.id === msg.serverId);
		if (!player)
			return;

		let obj = msg.obj;
		if (obj.offline) {
			cons.unzone({
				socket: player.socket,
				callback: () => {}
			});

			player.socket.emit('dc', {});

			return;
		}

		for (let p in obj) 
			player[p] = obj[p];

		if (obj.permadead)
			await leaderboard.killCharacter(player.name);

		if (obj.level) {
			await leaderboard.setLevel(player.name, obj.level);

			cons.emit('events', {
				onGetMessages: [{
					messages: [{
						class: 'color-blueB',
						message: player.name + ' has reached level ' + obj.level
					}]
				}],
				onGetConnectedPlayer: [cons.getCharacterList()]
			});
		}
	},

	notifyCollisionChange: function (x, y, collides) {
		this.objects
			.filter(o => o.player)
			.forEach(function (o) {
				o.syncer.setArray(true, 'player', 'collisionChanges', {
					x: x,
					y: y,
					collides: collides
				});
			});
	},

	update: function () {
		let objects = this.objects;
		let len = objects.length;

		for (let i = 0; i < len; i++) {
			let o = objects[i];

			//Don't remove it from the list if it's destroyed, but don't update it either
			//That's syncer's job
			if ((o.update) && (!o.destroyed))
				o.update();

			if (o.ttl) {
				o.ttl--;
				if (!o.ttl)
					o.destroyed = true;
			}

			o.fireEvent('afterTick');
		}
	}
};
