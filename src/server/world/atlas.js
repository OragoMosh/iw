let childProcess = require('child_process');
let objects = require('../objects/objects');
let mapList = require('../config/maps/mapList');
let connections = require('../security/connections');
let serverConfig = require('../config/serverConfig');

module.exports = {
	nextId: 0,
	lastCallbackId: 0,
	threads: [],
	callbacks: [],

	init: function () {
		this.getMapFiles();
	},

	addObject: function (obj, keepPos, transfer) {
		let thread = this.getThreadFromName(obj.zoneName);

		let instanceId = obj.instanceId;
		if ((!thread) || (obj.zoneName !== thread.name))
			instanceId = -1;

		if (!thread) {
			thread = this.getThreadFromName(serverConfig.defaultZone);
			obj.zoneName = thread.name;
		}

		obj.zone = thread.id;
		this.send(obj.zone, {
			method: 'addObject',
			args: {
				keepPos: keepPos,
				obj: obj.getSimple ? obj.getSimple(true, true) : obj,
				instanceId: instanceId,
				transfer: transfer
			}
		});
	},
	removeObject: function (obj, skipLocal, callback) {
		if (!skipLocal)
			objects.removeObject(obj);

		let thread = this.getThreadFromName(obj.zoneName);
		if (!thread)
			return;

		let callbackId = null;
		if (callback)
			callbackId = this.registerCallback(callback);

		obj.zone = thread.id;
		this.send(obj.zone, {
			method: 'removeObject',
			args: {
				obj: obj.getSimple(true),
				instanceId: obj.instanceId,
				callbackId: callbackId
			}
		});
	},
	updateObject: function (obj, msgObj) {
		this.send(obj.zone, {
			method: 'updateObject',
			args: {
				id: obj.id,
				instanceId: obj.instanceId,
				obj: msgObj
			}
		});
	},
	queueAction: function (obj, action) {
		this.send(obj.zone, {
			method: 'queueAction',
			args: {
				id: obj.id,
				instanceId: obj.instanceId,
				action: action
			}
		});
	},
	performAction: function (obj, action) {
		this.send(obj.zone, {
			method: 'performAction',
			args: {
				id: obj.id,
				instanceId: obj.instanceId,
				action: action
			}
		});
	},

	relog: function (obj) {
		this.send(obj.zone, {
			method: 'performAction',
			args: {
				id: obj.id,
				instanceId: obj.instanceId,
				action: {
					cpn: 'player',
					method: 'relog'
				}
			}
		});
	},

	registerCallback: function (callback) {
		this.callbacks.push({
			id: ++this.lastCallbackId,
			callback: callback
		});

		return this.lastCallbackId;
	},
	resolveCallback: function (msg) {
		let callback = this.callbacks.spliceFirstWhere(c => c.id === msg.msg.id);
		if (!callback)
			return;

		callback.callback(msg.msg.result);
	},

	send: function (zone, msg) {
		let thread = this.getThreadFromId(zone);
		if (thread)
			thread.worker.send(msg);
	},

	getThreadFromId: function (id) {
		return this.threads.find(t => t.id === id);
	},
	getThreadFromName: function (name) {
		return this.threads.find(t => t.name === name);
	},

	getMapFiles: function () {
		mapList.forEach(m => this.spawnMap(m));
	},
	spawnMap: function (name) {
		let worker = childProcess.fork('./world/worker');
		let thread = {
			id: this.nextId++,
			name: name.replace('.json', ''),
			worker: worker
		};

		let onMessage = this.onMessage.bind(this, thread);
		worker.on('message', function (m) {
			onMessage(m);
		});

		this.threads.push(thread);
	},
	onMessage: function (thread, message) {
		if (message.module)
			global[message.module][message.method](message);
		else if (message.event === 'onCrashed') {
			thread.worker.kill();
			process.exit();
		} else
			this.thread[message.method].call(this, thread, message);
	},
	thread: {
		onReady: function (thread) {
			thread.worker.send({
				method: 'init',
				args: {
					name: thread.name,
					zoneId: thread.id
				}
			});
		},
		event: function (thread, message) {
			objects.sendEvent(message);
		},
		events: function (thread, message) {
			objects.sendEvents(message);
		},
		object: function (thread, message) {
			objects.updateObject(message);
		},
		callDifferentThread: function (thread, message) {
			let obj = connections.players.find(p => (p.name === message.playerName));
			if (!obj)
				return;
			let newThread = this.getThreadFromName(obj.zoneName);
			if (!newThread)
				return;

			newThread.worker.send({
				module: message.data.module,
				method: message.data.method,
				args: message.data.args
			});
		},
		rezone: function (thread, message) {
			let obj = message.args.obj;
			obj.destroyed = false;
			obj.zoneName = message.args.newZone;
			obj.id = obj.serverId;

			let serverObj = objects.objects.find(o => o.id === obj.id);
			serverObj.zoneName = obj.zoneName;

			let newThread = this.getThreadFromName(obj.zoneName);

			if (!newThread) {
				newThread = this.getThreadFromName(serverConfig.defaultZone);
				obj.zoneName = newThread.name;
				serverObj.zoneName = newThread.name;
			}

			serverObj.zone = newThread.id;
			obj.zone = newThread.id;

			serverObj.player.broadcastSelf();

			this.addObject(obj, true, true);
		}
	}
};
