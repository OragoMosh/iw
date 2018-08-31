let spellTemplate = require('../config/spells/spellTemplate');
let animations = require('../config/animations');
let playerSpells = require('../config/spells');
let playerSpellsConfig = require('../config/spellsConfig');

module.exports = {
	type: 'spellbook',

	spells: [],
	auto: [],

	physics: null,
	objects: null,

	closestRange: -1,
	furthestRange: -1,

	callbacks: [],

	init: function (blueprint) {
		this.objects = this.obj.instance.objects;
		this.physics = this.obj.instance.physics;

		this.dmgMult = blueprint.dmgMult;

		(blueprint.spells || []).forEach(s => this.addSpell(s, -1));

		delete blueprint.spells;
	},

	transfer: function () {
		let spells = this.spells;
		this.spells = [];

		spells.forEach(function (s) {
			this.addSpell(s, -1);
		}, this);
	},

	die: function () {
		this.auto = [];

		this.spells.forEach(function (s) {
			let reserve = s.manaReserve;

			if ((reserve) && (reserve.percentage) && (s.active))
				this.obj.stats.addStat('manaReservePercent', -reserve.percentage);

			s.die();
		}, this);
	},

	simplify: function (self) {
		if (!self)
			return null;

		let s = {
			type: this.type,
			closestRange: this.closestRange,
			furthestRange: this.furthestRange
		};

		let spells = this.spells;
		if ((spells.length > 0) && (spells[0].obj)) 
			spells = spells.map(f => f.simplify());
		
		s.spells = spells;

		return s;
	},

	addSpell: function (options, spellId) {
		if (!options.type) {
			options = {
				type: options
			};
		}

		let type = options.type[0].toUpperCase() + options.type.substr(1);

		let typeTemplate = {
			type: type,
			template: null
		};
		this.obj.instance.eventEmitter.emit('onBeforeGetSpellTemplate', typeTemplate);
		if (!typeTemplate.template)
			typeTemplate.template = require('../config/spells/spell' + type);

		let builtSpell = extend({}, spellTemplate, typeTemplate.template, options);
		builtSpell.obj = this.obj;
		builtSpell.baseDamage = builtSpell.damage;
		builtSpell.damage += (options.damageAdd || 0);
		if (options.damage)
			builtSpell.damage = options.damage;

		if (builtSpell.animation) {
			let animation = null;
			let sheetName = this.obj.sheetName || '../../../images/characters.png';
			let animationName = builtSpell.animation;

			if (sheetName === 'mobs')
				animation = animations.mobs;
			else if (sheetName === 'bosses')
				animation = animations.bosses;
			else if (sheetName.indexOf('/') > -1)
				animation = animations.mobs[sheetName];
			else
				animation = animations.classes;

			if ((animation) && (animation[this.obj.cell]) && (animation[this.obj.cell][animationName])) {
				builtSpell.animation = extend({}, animation[this.obj.cell][animationName]);
				builtSpell.animation.name = animationName;
			} else
				builtSpell.animation = null;
		}

		if (!builtSpell.castOnDeath) {
			if ((this.closestRange == -1) || (builtSpell.range < this.closestRange))
				this.closestRange = builtSpell.range;
			if ((this.furthestRange == -1) || (builtSpell.range > this.furthestRange))
				this.furthestRange = builtSpell.range;
		}

		if ((!options.has('id')) && (spellId === -1)) {
			spellId = 0;
			this.spells.forEach(function (s) {
				if (s.id >= spellId)
					spellId = s.id + 1;
			});
		}

		builtSpell.id = !options.has('id') ? spellId : options.id;
		this.spells.push(builtSpell);
		this.spells.sort(function (a, b) {
			return (a.id - b.id);
		});

		builtSpell.calcDps(null, true);
		if (builtSpell.init)
			builtSpell.init();

		if (this.obj.player)
			this.obj.syncer.setArray(true, 'spellbook', 'getSpells', builtSpell.simplify());

		return builtSpell.id;
	},

	addSpellFromRune: function (runeSpell, spellId) {
		let type = runeSpell.type;
		let playerSpell = playerSpells.spells.find(s => (s.name.toLowerCase() === runeSpell.name.toLowerCase())) || playerSpells.spells.find(s => (s.type === type));
		let playerSpellConfig = playerSpellsConfig.spells[runeSpell.name.toLowerCase()] || playerSpellsConfig.spells[runeSpell.type];
		if (!playerSpellConfig)
			return -1;

		if (!runeSpell.rolls)
			runeSpell.rolls = {};

		runeSpell.values = {};

		let builtSpell = extend({
			type: runeSpell.type,
			values: {}
		}, playerSpell, playerSpellConfig, runeSpell);

		for (let r in builtSpell.random) {
			let range = builtSpell.random[r];
			let roll = runeSpell.rolls[r] || 0;
			runeSpell.rolls[r] = roll;

			let int = r.indexOf('i_') === 0;

			let val = range[0] + ((range[1] - range[0]) * roll);
			if (int) {
				val = ~~val;
				r = r.replace('i_', '');
			} else
				val = ~~(val * 100) / 100;

			builtSpell[r] = val;
			builtSpell.values[r] = val;
			runeSpell.values[r] = val;
		}

		if (runeSpell.properties) {
			for (let p in runeSpell.properties) 
				builtSpell[p] = runeSpell.properties[p];
		}

		if (runeSpell.cdMult)
			builtSpell.cdMax *= runeSpell.cdMult;

		delete builtSpell.rolls;
		delete builtSpell.random;

		return this.addSpell(builtSpell, spellId);
	},

	calcDps: function () {
		this.spells.forEach(s => s.calcDps());
	},

	removeSpellById: function (id) {
		let exists = this.spells.spliceFirstWhere(s => (s.id === id));

		if (exists) {
			if ((exists.manaReserve) && (exists.active)) {
				let reserve = exists.manaReserve;

				if (reserve.percentage)
					this.obj.stats.addStat('manaReservePercent', -reserve.percentage);
			}

			if (exists.unlearn)
				exists.unlearn();

			this.obj.syncer.setArray(true, 'spellbook', 'removeSpells', id);
			this.auto.spliceWhere(a => a.spell === id);
		}
	},

	queueAuto: function (action) {
		if (!action.auto)
			return true;

		let exists = this.auto.find(a => (a.spell === action.spell));
		if (!exists) {
			this.auto.push({
				spell: action.spell,
				target: action.target
			});
			return true;
		} exists.target = action.target;
	},

	getRandomSpell: function (target) {
		let valid = [];
		this.spells.forEach(function (s) {
			if (s.castOnDeath)
				return;

			if (s.canCast(target))
				valid.push(s.id);
		});

		if (valid.length > 0)
			return valid[~~(Math.random() * valid.length)];
		return null;
	},
	cast: function (action, isAuto) {
		if (!action.has('spell')) {
			this.auto = [];
			return true;
		}

		let spell = this.spells.find(s => (s.id === action.spell));

		if (!spell)
			return false;

		//Cast on self?
		if (action.self) {
			if (spell.targetGround) {
				action.target = {
					x: this.obj.x,
					y: this.obj.y
				};
			} else if (spell.spellType === 'buff') 
				action.target = this.obj;
		}

		if ((!spell.aura) && (!spell.targetGround)) {
			//Did we pass in the target id?
			if (action.target && !action.target.id) {
				action.target = this.objects.objects.find(o => o.id === action.target);
				if (!action.target)
					return false;
			}

			if ((action.target === this.obj) && (spell.noTargetSelf))
				action.target = null;

			if (!action.target || !action.target.player) {
				if (spell.autoTargetFollower) {
					action.target = this.spells.find(s => (s.minions) && (s.minions.length > 0));
					if (action.target)
						action.target = action.target.minions[0];
					else
						return false;
				}
			}

			if (spell.spellType === 'buff') {
				if (this.obj.aggro.faction !== action.target.aggro.faction)
					return;
			} else if ((action.target.aggro) && (!this.obj.aggro.canAttack(action.target))) {
				if (this.obj.player)
					this.sendAnnouncement("You don't feel like attacking that target");
				return;
			}
		}

		if ((!spell.targetGround) && (action.target) && (!action.target.aggro) && (!spell.aura)) {
			this.sendAnnouncement("You don't feel like attacking that target");
			return;
		}

		let success = true;
		if (spell.cd > 0) {
			if ((!isAuto) && (!spell.isAuto)) {
				let type = (spell.auto) ? 'Weapon' : 'Spell';
				this.sendAnnouncement(`${type} is on cooldown`);
			}
			success = false;
		} else if (spell.manaCost > this.obj.stats.values.mana) {
			if (!isAuto)
				this.sendAnnouncement('Insufficient mana to cast spell');
			success = false;
		} else if (spell.manaReserve) {
			let reserve = spell.manaReserve;

			if (reserve.percentage) {
				if (!spell.active) {
					if (1 - this.obj.stats.values.manaReservePercent < reserve.percentage) {
						this.sendAnnouncement('Insufficient mana to cast spell');
						success = false;
					} else
						this.obj.stats.addStat('manaReservePercent', reserve.percentage);
				} else
					this.obj.stats.addStat('manaReservePercent', -reserve.percentage);
			}
		} else if (spell.has('range')) {
			let distance = Math.max(Math.abs(action.target.x - this.obj.x), Math.abs(action.target.y - this.obj.y));
			let range = spell.range;
			if ((spell.useWeaponRange) && (this.obj.player)) {
				let weapon = this.obj.inventory.findItem(this.obj.equipment.eq.oneHanded) || this.obj.inventory.findItem(this.obj.equipment.eq.twoHanded);
				if (weapon)
					range = weapon.range || 1;
			}

			if (distance > range) {
				if (!isAuto)
					this.sendAnnouncement('Target out of range');
				success = false;
			}
		}

		//LoS check
		//Null means we don't have LoS and as such, we should move
		if ((spell.needLos) && (success)) {
			if (!this.physics.hasLos(~~this.obj.x, ~~this.obj.y, ~~action.target.x, ~~action.target.y)) {
				if (!isAuto)
					this.sendAnnouncement('Target not in line of sight');
				action.auto = false;
				success = null;
			}
		}

		if (!success) {
			this.queueAuto(action);
			return success;
		} else if (!this.queueAuto(action))
			return false;

		let castSuccess = {
			success: true
		};
		this.obj.fireEvent('beforeCastSpell', castSuccess);
		if (!castSuccess.success)
			return false;

		if (spell.targetFurthest)
			spell.target = this.obj.aggro.getFurthest();
		else if (spell.targetRandom)
			spell.target = this.obj.aggro.getRandom();

		success = spell.castBase(action);
		this.stopCasting(spell);

		if (success) {
			spell.consumeMana();
			spell.setCd();
		}

		return success;

		let stats = this.obj.stats.values;
		stats.mana -= spell.manaCost;
		let cd = {
			cd: spell.cdMax
		};

		let isAttack = (spell.type == 'melee');
		if ((Math.random() * 100) < stats[isAttack ? 'attackSpeed' : 'castSpeed'])
			cd.cd = 1;

		this.obj.fireEvent('beforeSetSpellCooldown', cd);

		spell.cd = cd.cd;

		if (this.obj.player) {
			let syncer = this.obj.syncer;
			syncer.setObject(true, 'stats', 'values', 'mana', this.obj.stats.values.mana);
			this.obj.instance.syncer.queue('onGetSpellCooldowns', {
				id: this.obj.id,
				spell: action.spell,
				cd: (spell.cd * 350)
			}, [this.obj.serverId]);
		}

		return true;
	},

	getClosestRange: function (spellNum) {
		if (spellNum)
			return this.spells[spellNum].range;
		return this.closestRange;
	},

	getFurthestRange: function (spellNum) {
		if (spellNum)
			return this.spells[spellNum].range;
		
		let spells = this.spells;
		let sLen = spells.length;
		let furthest = 0;
		for (let i = 0; i < sLen; i++) {
			let spell = spells[i];
			if ((spell.range > furthest) && (spell.canCast()))
				furthest = spell.range;
		}
		if (furthest === 0)
			furthest = this.furthestRange;

		return furthest;
	},

	getCooldowns: function () {
		let cds = [];
		this.spells.forEach(
			s => cds.push({
				cd: s.cd,
				cdMax: s.cdMax,
				canCast: ((s.manaCost <= this.obj.stats.values.mana) && (s.cd === 0))
			}), this);

		return cds;
	},
	update: function () {
		let didCast = false;

		this.spells.forEach(function (s, i) {
			s.updateBase();
			if (s.update)
				s.update();
		});

		let auto = this.auto;
		let aLen = auto.length;
		for (let i = 0; i < aLen; i++) {
			let a = auto[i];
			if ((!a.target) || (a.target.destroyed)) {
				auto.splice(i, 1);
				aLen--;
				i--;
				continue;
			}

			if (this.cast(a, true))
				didCast = true;
		}

		let callbacks = this.callbacks;
		let cLen = callbacks.length;
		for (let i = 0; i < cLen; i++) {
			let c = callbacks[i];

			//If a spellCallback kills a mob he'll unregister his callbacks
			if (!c) {
				i--;
				cLen--;
				continue;
			}

			c.time -= 350;

			if (c.time <= 0) {
				if (c.callback)
					c.callback();
				if (c.destroyCallback)
					c.destroyCallback();
				callbacks.splice(i, 1);
				i--;
				cLen--;
			}
		}

		return didCast;
	},

	registerCallback: function (sourceId, callback, time, destroyCallback, targetId, destroyOnRezone) {
		let obj = {
			sourceId: sourceId,
			targetId: targetId,
			callback: callback,
			destroyCallback: destroyCallback,
			destroyOnRezone: destroyOnRezone,
			time: time
		};

		this.callbacks.push(obj);

		return obj;
	},
	unregisterCallback: function (sourceId, target) {
		let callbacks = this.callbacks;
		let cLen = callbacks.length;
		for (let i = 0; i < cLen; i++) {
			let c = callbacks[i];

			let match = false;
			if (!target)
				match = (c.sourceId === sourceId);
			else 
				match = (c.targetId === sourceId);

			if (match) {
				if (c.destroyCallback)
					c.destroyCallback();
				callbacks.splice(i, 1);
				i--;
				cLen--;
			}
		}
	},

	sendAnnouncement: function (msg) {
		process.send({
			method: 'events',
			data: {
				onGetAnnouncement: [{
					obj: {
						msg: msg
					},
					to: [this.obj.serverId]
				}]
			}
		});
	},

	fireEvent: function (event, args) {
		let spells = this.spells;
		let sLen = spells.length;
		for (let i = 0; i < sLen; i++) {
			let s = spells[i];

			let events = s.events;
			if (events) {
				let callback = events[event];
				if (!callback)
					continue;

				callback.apply(s, args);
			}

			if (s.castEvent === event)
				s.cast();
		}
	},

	stopCasting: function (ignore) {
		this.spells.forEach(function (s) {
			if ((!s.castTimeMax) || (!s.castTime) || (s == ignore))
				return;

			s.castTime = 0;
			s.currentAction = null;

			if (!ignore)
				this.obj.syncer.set(false, null, 'casting', 0);
		}, this);
	},

	events: {
		beforeMove: function () {
			this.stopCasting();
		},

		beforeDeath: function () {
			this.spells.forEach(function (s) {
				if (!s.castOnDeath)
					return;

				s.cast();
			});
		},

		beforeRezone: function () {
			this.spells.forEach(function (s) {
				if (s.active) {
					s.active = false;

					let reserve = s.manaReserve;

					if ((reserve) && (reserve.percentage))
						this.obj.stats.addStat('manaReservePercent', -reserve.percentage);
				}
			}, this);

			let callbacks = this.callbacks;
			let cLen = callbacks.length;
			for (let i = 0; i < cLen; i++) {
				let c = callbacks[i];

				//If a spellCallback kills a mob he'll unregister his callbacks
				//Probably not needed since we aren't supposed to damage mobs in destroyCallback
				if (!c) {
					i--;
					cLen--;
					continue;
				}

				if (c.destroyOnRezone) {
					if (c.destroyCallback)
						c.destroyCallback();
					callbacks.splice(i, 1);
					i--;
					cLen--;
				}
			}
		}
	}
};
