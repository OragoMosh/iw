define([
	'config/roles',
	'world/atlas',
	'items/generator',
	'misc/random',
	'items/config/slots',
	'security/io',
	'config/factions'
], function (
	roles,
	atlas,
	generator,
	random,
	configSlots,
	io,
	factions
) {
	var commandRoles = {
		arena: 0,
		join: 0,
		leave: 0,
		unEq: 0,
		getItem: 10,
		getGold: 10,
		setLevel: 10,
		godMode: 10,
		clearInventory: 10,
		completeQuests: 10,
		getReputation: 10,
		loseReputation: 10
	};

	var localCommands = [
		'join',
		'leave'
	];

	return {
		customChannels: [],
		roleLevel: null,

		init: function (blueprint) {
			if (this.customChannels) {
				this.customChannels = this.customChannels
					.filter((c, i) => (this.customChannels.indexOf(c) == i));
			}

			this.roleLevel = roles.getRoleLevel(this.obj);
		},

		onBeforeChat: function (msg) {
			var messageText = msg.message;
			if (messageText[0] != '/')
				return;

			messageText = messageText.substr(1).split(' ');
			var actionName = messageText.splice(0, 1)[0].toLowerCase();
			actionName = Object.keys(commandRoles).find(a => (a.toLowerCase() == actionName));

			if (!actionName)
				return;
			else if (this.roleLevel < commandRoles[actionName])
				return;

			msg.ignore = true;

			var config = {};
			if ((messageText.length == 1) && (messageText[0].indexOf('=') == -1))
				config = messageText[0];
			else {
				messageText.forEach(function (m) {
					m = m.split('=');
					config[m[0]] = m[1];
				});
			}

			if (localCommands.indexOf(actionName) > -1) {
				this[actionName].call(this, config);
			} else {
				atlas.performAction(this.obj, {
					cpn: 'social',
					method: actionName,
					data: config
				});
			}
		},

		//actions
		arena: function (team) {
			var obj = this.obj;

			var fnRezone = function (zone, x, y) {
				obj.fireEvent('beforeRezone');

				obj.destroyed = true;

				var simpleObj = obj.getSimple(true, true);
				simpleObj.x = x;
				simpleObj.y = y;

				var e = simpleObj.components.find(c => (c.type == 'effects'));
				if (zone == 'arena-1') {
					e.effects.push({
						type: 'pvp',
						team: team,
						ttl: 99999999
					});
				} else
					e.effects.spliceWhere(e => (e.type == 'pvp'));

				process.send({
					method: 'rezone',
					id: obj.serverId,
					args: {
						obj: simpleObj,
						newZone: zone
					}
				});
			};

			if (team == 'leave') {
				fnRezone('tutorial', 132, 118);

				return;
			}

			fnRezone('arena-1', 14, 19);
		},

		join: function (value) {
			if (typeof (value) != 'string')
				return;

			value = value.split(' ').join('');
			if (value.lengh == 0)
				return;

			var obj = this.obj;

			var channels = obj.auth.customChannels;
			if (!channels.some(c => (c == value)))
				channels.push(value);
			else
				return;

			channels.push(value);

			var charname = obj.auth.charname;
			io.set({
				ent: charname,
				field: 'customChannels',
				value: JSON.stringify(channels)
			});

			obj.socket.emit('events', {
				onGetMessages: [{
					messages: [{
						class: 'q0',
						message: 'joined channel: ' + value,
						type: 'info'
					}]
				}]
			});

			obj.socket.emit('event', {
				event: 'onJoinChannel',
				data: value
			});
		},

		leave: function (value) {
			if (typeof (value) != 'string')
				return;

			var obj = this.obj;

			var channels = obj.auth.customChannels;
			if (!channels.some(c => (c == value))) {
				obj.socket.emit('events', {
					onGetMessages: [{
						messages: [{
							class: 'q0',
							message: 'you are not currently in that channel',
							type: 'info'
						}]
					}]
				});

				return;
			}

			var channels = obj.auth.customChannels;
			channels.spliceWhere(c => (c == value));

			var charname = obj.auth.charname;
			io.set({
				ent: charname,
				field: 'customChannels',
				value: JSON.stringify(channels)
			});

			obj.socket.emit('event', {
				event: 'onLeaveChannel',
				data: value
			});

			this.obj.socket.emit('events', {
				onGetMessages: [{
					messages: [{
						class: 'q0',
						message: 'left channel: ' + value,
						type: 'info'
					}]
				}]
			});
		},

		isInChannel: function (character, channel) {
			return character.auth.customChannels.some(c => (c == channel));
		},

		unEq: function () {
			var eq = this.obj.equipment;
			Object.keys(eq.eq).forEach(function (slot) {
				eq.unequip(eq.eq[slot]);
			});
		},

		clearInventory: function () {
			var inventory = this.obj.inventory;

			inventory.items
				.filter(i => !i.eq)
				.map(i => i.id)
				.forEach(i => inventory.destroyItem(i, null, true));
		},

		getItem: function (config) {
			if (config.slot == 'set') {
				configSlots.slots.forEach(function (s) {
					if (s == 'tool')
						return;

					var newConfig = extend(true, {}, config, {
						slot: s
					});

					this.getItem(newConfig);
				}, this);

				return;
			}

			if (config.stats)
				config.stats = config.stats.split(',');

			if (config.name)
				config.name = config.name.split('_').join(' ');

			if (config.type)
				config.type = config.type.split('_').join(' ');

			if (config.sprite)
				config.sprite = config.sprite.split('_');

			var spritesheet = config.spritesheet;
			delete config.spritesheet;

			var factions = (config.factions || '').split(',');
			delete config.factions;

			var safe = config.safe;
			delete config.safe;

			var item = generator.generate(config);

			if (safe) {
				item.noDrop = true;
				item.noDestroy = true;
				item.noSalvage = true;
			}

			factions.forEach(function (f) {
				if (f == '')
					return;

				var faction = factions.getFaction(f);
				faction.uniqueStat.generate(item);

				item.factions = [];
				item.factions.push({
					id: f,
					tier: 3
				});
			});

			if (spritesheet)
				item.spritesheet = spritesheet;

			this.obj.inventory.getItem(item);
		},

		getGold: function (amount) {
			this.obj.trade.gold += ~~amount;
			this.obj.syncer.set(true, 'trade', 'gold', this.obj.trade.gold);
		},

		setLevel: function (level) {
			var obj = this.obj;
			var syncer = obj.syncer;

			level = Math.max(1, ~~level);

			var stats = obj.stats;
			var values = stats.values;
			var oldLevel = values.level;

			values.level = level;

			var delta = level - oldLevel;

			values.hpMax += (40 * delta);

			syncer.setObject(true, 'stats', 'values', 'level', level);
			syncer.setObject(true, 'stats', 'values', 'hpMax', values.hpMax);

			process.send({
				method: 'object',
				serverId: obj.serverId,
				obj: {
					level: level
				}
			});

			stats.calcXpMax();
		},

		godMode: function () {
			var obj = this.obj;

			var statValues = obj.stats.values;
			var newValues = {
				int: 10000000,
				str: 10000000,
				dex: 10000000,
				hpMax: 10000000,
				hp: 10000000,
				manaMax: 10000000,
				mana: 10000000,
				sprintChance: 100
			};

			var syncer = obj.syncer;

			for (var s in newValues) {
				var newValue = newValues[s];
				statValues[s] = newValue;

				syncer.setObject(true, 'stats', 'values', s, newValue);
			}

			obj.spellbook.calcDps();
		},

		completeQuests: function () {
			var obj = this.obj;
			var quests = obj.quests;

			quests.quests.forEach(function (q) {
				q.isReady = true;
				q.complete();
			}, this);

			quests.quests = [];
			obj.instance.questBuilder.obtain(obj);
		},

		getReputation: function (faction) {
			if (typeof (faction) != 'string')
				return;

			this.obj.reputation.getReputation(faction, 50000);
		},

		loseReputation: function (faction) {
			if (typeof (faction) != 'string')
				return;

			this.obj.reputation.getReputation(faction, -50000);
		}
	};
});
