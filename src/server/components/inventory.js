let generator = require('../items/generator');
let salvager = require('../items/salvager');
let enchanter = require('../items/enchanter');
let classes = require('../config/spirits');
let mtx = require('../mtx/mtx');
let factions = require('../config/factions');
let itemEffects = require('../items/itemEffects');

module.exports = {
	type: 'inventory',

	inventorySize: 50,
	items: [],

	blueprint: null,

	init: function (blueprint, isTransfer) {
		let items = blueprint.items || [];
		let iLen = items.length;

		//Spells should be sorted so they're EQ'd in the right order
		items.sort(function (a, b) {
			let aId = a.has('spellId') ? ~~a.spellId : 9999;
			let bId = b.has('spellId') ? ~~b.spellId : 9999;
			return (aId - bId);
		});

		for (let i = 0; i < iLen; i++) {
			let item = items[i];
			if ((item.pos >= this.inventorySize) || (item.eq))
				delete item.pos;

			while (item.name.indexOf('\'\'') > -1) 
				item.name = item.name.replace('\'\'', '\'');
		}

		this.hookItemEvents(items);

		//Hack to skip attr checks on equip
		let oldFn = this.canEquipItem;
		this.canEquipItem = () => {
			return true; 
		};

		for (let i = 0; i < iLen; i++) {
			let item = items[i];
			let pos = item.pos;

			let newItem = this.getItem(item, true, true);
			newItem.pos = pos;
		}

		//Hack to skip attr checks on equip
		this.canEquipItem = oldFn.bind(this);

		if ((this.obj.player) && (!isTransfer) && (this.obj.stats.values.level === 1))
			this.getDefaultAbilities();

		delete blueprint.items;

		this.blueprint = blueprint;

		if (this.obj.equipment)
			this.obj.equipment.unequipAttrRqrGear();
	},

	transfer: function () {
		this.hookItemEvents();
	},

	save: function () {
		return {
			type: 'inventory',
			items: this.items
		};
	},

	simplify: function (self) {
		if (!self)
			return null;

		return {
			type: 'inventory',
			items: this.items.map(this.simplifyItem.bind(this))
		};
	},

	simplifyItem: function (item) {
		let result = extend({}, item);

		if (result.effects) {
			result.effects = result.effects.map(e => ({
				factionId: e.factionId,
				text: e.text,
				properties: e.properties,
				mtx: e.mtx,
				type: e.type,
				rolls: e.rolls
			}));
		}

		if (result.factions) {
			let reputation = this.obj.reputation;

			result.factions = result.factions.map(function (f) {
				let faction = reputation.getBlueprint(f.id);
				let factionTier = reputation.getTier(f.id);

				let noEquip = null;
				if (factionTier < f.tier)
					noEquip = true;

				return {
					id: f.id,
					name: faction.name,
					tier: f.tier,
					tierName: ['Hated', 'Hostile', 'Unfriendly', 'Neutral', 'Friendly', 'Honored', 'Revered', 'Exalted'][f.tier],
					noEquip: noEquip
				};
			}, this);
		}

		return result;
	},

	update: function () {
		let items = this.items;
		let iLen = items.length;
		for (let i = 0; i < iLen; i++) {
			let item = items[i];
			if (!item.cd)
				continue;

			item.cd--;

			this.obj.syncer.setArray(true, 'inventory', 'getItems', item);
		}
	},

	enchantItem: function (msg) {
		let item = this.findItem(msg.itemId);
		if ((!item) || (!item.slot) || (item.eq) || (item.noAugment) || ((msg.action === 'scour') && (item.power === 0))) {
			this.resolveCallback(msg);
			return;
		}

		enchanter.enchant(this.obj, item, msg);
	},

	getEnchantMaterials: function (msg) {
		let result = [];
		let item = this.findItem(msg.itemId);
		if ((item) && (item.slot))
			result = enchanter.getEnchantMaterials(item, msg.action);

		this.resolveCallback(msg, result);
	},

	learnAbility: function (itemId, runeSlot) {
		if (itemId.has('itemId')) {
			let msg = itemId;
			itemId = msg.itemId;
			runeSlot = msg.slot;
		}

		let item = this.findItem(itemId);
		let statValues = this.obj.stats.values;
		if (!item)
			return;
		else if (!item.spell) {
			item.eq = false;
			return;
		} else if (item.level > statValues.level) {
			item.eq = false;
			return;
		}

		let learnMsg = {
			success: true,
			item: item
		};
		this.obj.fireEvent('beforeLearnAbility', learnMsg);
		if (!learnMsg.success) {
			this.obj.instance.syncer.queue('onGetMessages', {
				id: this.obj.id,
				messages: [{
					class: 'color-redA',
					message: learnMsg.msg || 'you cannot learn that ability',
					type: 'info'
				}]
			}, [this.obj.serverId]);

			return;
		}

		let spellbook = this.obj.spellbook;

		if ((item.slot === 'twoHanded') || (item.slot === 'oneHanded'))
			runeSlot = 0;
		else if (!runeSlot) {
			runeSlot = 4;
			for (let i = 1; i <= 4; i++) {
				if (!this.items.some(j => (j.runeSlot === i))) {
					runeSlot = i;
					break;
				}
			}
		}

		let currentEq = this.items.find(i => (i.runeSlot === runeSlot));
		if (currentEq) {
			spellbook.removeSpellById(runeSlot);
			delete currentEq.eq;
			delete currentEq.runeSlot;
			this.setItemPosition(currentEq.id);
			this.obj.syncer.setArray(true, 'inventory', 'getItems', currentEq);
		}

		item.eq = true;
		item.runeSlot = runeSlot;
		delete item.pos;

		spellbook.addSpellFromRune(item.spell, runeSlot);
		this.obj.syncer.setArray(true, 'inventory', 'getItems', item);
	},

	activateMtx: function (itemId) {
		let item = this.findItem(itemId);
		if (!item)
			return;
		else if (item.type !== 'mtx') {
			delete item.active;
			return;
		}

		item.active = !item.active;

		this.obj.syncer.setArray(true, 'inventory', 'getItems', item);
	},

	splitStack: function (msg) {
		let item = this.findItem(msg.itemId);
		if (!item || !item.quantity || item.quantity <= msg.stackSize || msg.stackSize < 1)
			return;

		const hasSpace = this.hasSpace(item, true);
		if (!hasSpace) {
			this.obj.instance.syncer.queue('onGetMessages', {
				id: this.obj.id,
				messages: [{
					class: 'color-redA',
					message: 'Your bags are too full to split that stack',
					type: 'info'
				}]
			}, [this.obj.serverId]);

			return;
		}

		let newItem = extend({}, item);
		item.quantity -= msg.stackSize;
		newItem.quantity = msg.stackSize;

		this.getItem(newItem, true, true);

		this.obj.syncer.setArray(true, 'inventory', 'getItems', item);
	},

	combineStacks: function (msg) {
		let fromItem = this.findItem(msg.fromId);
		let toItem = this.findItem(msg.toId);

		if ((!fromItem) || (!toItem))
			return;
		else if ((!fromItem.quantity) || (!toItem.quantity))
			return;

		toItem.quantity += fromItem.quantity;
		this.obj.syncer.setArray(true, 'inventory', 'getItems', toItem);
		this.destroyItem(fromItem.id, null, true);
	},

	useItem: function (itemId) {
		let item = this.findItem(itemId);
		if (!item)
			return;

		let obj = this.obj;

		if (item.cdMax) {
			if (item.cd) {
				process.send({
					method: 'events',
					data: {
						onGetAnnouncement: [{
							obj: {
								msg: 'That item is on cooldown'
							},
							to: [obj.serverId]
						}]
					}
				});

				return;
			}

			item.cd = item.cdMax;

			//Find similar items and put them on cooldown too
			this.items.forEach(function (i) {
				if ((i.name === item.name) && (i.cdMax === item.cdMax))
					i.cd = i.cdMax;
			});
		}

		let result = {};
		obj.instance.eventEmitter.emit('onBeforeUseItem', obj, item, result);

		let effects = (item.effects || []);
		let eLen = effects.length;
		for (let j = 0; j < eLen; j++) {
			let effect = effects[j];
			if (!effect.events)
				continue;

			let effectEvent = effect.events.onConsumeItem;
			if (!effectEvent)
				continue;

			let effectResult = {
				success: true,
				errorMessage: null
			};

			effectEvent.call(obj, effectResult, item, effect);

			if (!effectResult.success) {
				obj.instance.syncer.queue('onGetMessages', {
					id: obj.id,
					messages: [{
						class: 'color-redA',
						message: effectResult.errorMessage,
						type: 'info'
					}]
				}, [obj.serverId]);

				return;
			}
		}

		if (item.type === 'consumable') {
			if (item.uses) {
				item.uses--;

				if (item.uses) {
					obj.syncer.setArray(true, 'inventory', 'getItems', item);
					return;
				}
			}

			this.destroyItem(itemId, 1);
			if (item.has('quickSlot'))
				this.obj.equipment.replaceQuickSlot(item);
		}
	},

	unlearnAbility: function (itemId) {
		if (itemId.has('itemId'))
			itemId = itemId.itemId;

		let item = this.findItem(itemId);
		if (!item)
			return;
		else if (!item.spell) {
			item.eq = false;
			return;
		}

		let spellbook = this.obj.spellbook;
		spellbook.removeSpellById(item.runeSlot);
		delete item.eq;
		delete item.runeSlot;
		if (!item.slot)
			this.setItemPosition(itemId);
		this.obj.syncer.setArray(true, 'inventory', 'getItems', item);
	},

	stashItem: function (id) {
		let item = this.findItem(id);
		if (!item || item.quest || item.noStash)
			return;

		delete item.pos;

		let stash = this.obj.stash;
		if (!stash.active)
			return;

		let clonedItem = extend({}, item);
		const success = stash.deposit(clonedItem);
		if (!success)
			return;

		this.destroyItem(id, null, true);
	},

	salvageItem: function (id) {
		let item = this.findItem(id);
		if ((!item) || (item.material) || (item.quest) || (item.noSalvage) || (item.eq))
			return;

		let messages = [];

		let items = salvager.salvage(item);
		let iLen = items.length;

		if (!iLen)
			return;

		for (let i = 0; i < iLen; i++) {
			let material = items[i];

			this.getItem(material, true);

			messages.push({
				class: 'q' + material.quality,
				message: 'salvage (' + material.name + ' x' + material.quantity + ')'
			});
		}

		this.obj.instance.syncer.queue('onGetMessages', {
			id: this.obj.id,
			messages: messages
		}, [this.obj.serverId]);

		this.destroyItem(id);
	},

	destroyItem: function (id, amount, force) {
		let item = this.findItem(id);
		if ((!item) || ((item.noDestroy) && (!force)))
			return;

		amount = amount || item.quantity;

		if (item.eq)
			this.obj.equipment.unequip(id);

		if ((item.quantity) && (amount)) {
			item.quantity -= amount;
			if (item.quantity <= 0) {
				this.items.spliceWhere(i => i.id === id);
				this.obj.syncer.setArray(true, 'inventory', 'destroyItems', id);
			} else
				this.obj.syncer.setArray(true, 'inventory', 'getItems', item);
		} else {
			this.items.spliceWhere(i => i.id === id);
			this.obj.syncer.setArray(true, 'inventory', 'destroyItems', id);
		}

		this.obj.fireEvent('afterDestroyItem', item, amount);

		return item;
	},

	dropItem: function (id) {
		let item = this.findItem(id);
		if ((!item) || (item.noDrop) || (item.quest))
			return;

		if (item.has('quickSlot')) {
			this.obj.equipment.setQuickSlot({
				itemId: null,
				slot: item.quickSlot
			});

			delete item.quickSlot;
		}

		delete item.pos;

		//Find close open position
		let x = this.obj.x;
		let y = this.obj.y;
		let dropCell = this.obj.instance.physics.getOpenCellInArea(x - 1, y - 1, x + 1, y + 1);
		if (!dropCell)
			return;

		if (item.eq)
			this.obj.equipment.unequip(id);

		this.items.spliceWhere(i => i.id === id);

		this.obj.syncer.setArray(true, 'inventory', 'destroyItems', id);

		this.createBag(dropCell.x, dropCell.y, [item]);
	},

	moveItem: function (msgs) {
		msgs.forEach(function (m) {
			let item = this.findItem(m.id);
			if (!item)
				return;

			item.pos = m.pos;
		}, this);
	},

	mailItem: function (msg) {
		let item = this.findItem(msg.itemId);
		if ((!item) || (item.noDrop) || (item.quest)) {
			this.resolveCallback(msg);
			return;
		}

		delete item.pos;

		io.get({
			ent: msg.recipient,
			field: 'character',
			callback: this.onCheckCharExists.bind(this, msg, item)
		});
	},

	onCheckCharExists: async function (msg, item, res) {
		if (!res) {
			this.resolveCallback(msg, 'Recipient does not exist');
			return;
		}

		let blocked = false;
		if (res.components) {
			let social = res.components.find(f => f.type === 'social');
			if (!social.blockedPlayers && social.blockedPlayers.includes(this.obj.name))
				blocked = true;
		}

		if (!blocked)
			this.obj.instance.mail.sendMail(msg.recipient, [extend({}, item)]);
		this.destroyItem(item.id);

		this.resolveCallback(msg);
	},

	hookItemEvents: function (items) {
		items = items || this.items;
		let iLen = items.length;
		for (let i = 0; i < iLen; i++) {
			let item = items[i];

			if (item.effects) {
				item.effects.forEach(function (e) {
					if (e.mtx) {
						let mtxUrl = mtx.get(e.mtx);
						let mtxModule = require('../' + mtxUrl);

						e.events = mtxModule.events;
					} else if (e.factionId) {
						let faction = factions.getFaction(e.factionId);
						let statGenerator = faction.uniqueStat;
						statGenerator.generate(item);
					} else {
						let effectUrl = itemEffects.get(e.type);
						try {
							let effectModule = require('../' + effectUrl);
							e.events = effectModule.events;
						} catch (error) {}
					}
				});
			}

			if (!item.has('pos') && !item.eq) {
				let pos = i;
				for (let j = 0; j < iLen; j++) {
					if (!items.some(fj => (fj.pos === j))) {
						pos = j;
						break;
					}
				}
				item.pos = pos;
			} else if ((!item.eq) && (items.some(ii => ((ii !== item) && (ii.pos === item.pos))))) {
				let pos = item.pos;
				for (let j = 0; j < iLen; j++) {
					if (!items.some(fi => ((fi !== item) && (fi.pos === j)))) {
						pos = j;
						break;
					}
				}
				item.pos = pos;
			}
		}
	},

	setItemPosition: function (id) {
		let item = this.findItem(id);
		if (!item)
			return;

		let iSize = this.inventorySize;
		for (let i = 0; i < iSize; i++) {
			if (!this.items.some(j => (j.pos === i))) {
				item.pos = i;
				break;
			}
		}
	},

	resolveCallback: function (msg, result) {
		let callbackId = msg.has('callbackId') ? msg.callbackId : msg;
		result = result || [];

		if (!callbackId)
			return;

		process.send({
			module: 'atlas',
			method: 'resolveCallback',
			msg: {
				id: callbackId,
				result: result
			}
		});
	},

	findItem: function (id) {
		if (id === null)
			return null;

		return this.items.find(i => i.id === id);
	},

	getDefaultAbilities: function () {
		let hasWeapon = this.items.some(function (i) {
			return (
				(i.spell) &&
				(i.spell.rolls) &&
				(i.spell.rolls.has('damage')) &&
				((i.slot === 'twoHanded') || (i.slot === 'oneHanded'))
			);
		});

		if (!hasWeapon) {
			let item = generator.generate({
				type: classes.weapons[this.obj.class],
				quality: 0,
				spellQuality: 'basic'
			});
			item.eq = true;
			item.noSalvage = true;
			this.getItem(item);
		}

		classes.spells[this.obj.class].forEach(function (spellName) {
			let hasSpell = this.items.some(function (i) {
				return (
					(i.spell) &&
					(i.spell.name.toLowerCase() === spellName)
				);
			});

			if (!hasSpell) {
				let item = generator.generate({
					spell: true,
					spellQuality: 'basic',
					spellName: spellName
				});
				item.eq = true;
				item.noSalvage = true;
				this.getItem(item);
			}
		}, this);
	},

	createBag: function (x, y, items, ownerName) {
		let bagCell = 50;

		let topQuality = 0;
		let iLen = items.length;
		for (let i = 0; i < iLen; i++) {
			let quality = items[i].quality;
			items[i].fromMob = !!this.obj.mob;
			if (quality > topQuality)
				topQuality = quality;
		}

		if (topQuality === 0)
			bagCell = 50;
		else if (topQuality === 1)
			bagCell = 51;
		else if (topQuality === 2)
			bagCell = 128;
		else if (topQuality === 3)
			bagCell = 52;
		else
			bagCell = 53;

		let obj = this.obj.instance.objects.buildObjects([{
			sheetName: 'objects',
			cell: bagCell,
			x: x,
			y: y,
			properties: {
				cpnChest: {
					ownerName: ownerName,
					ttl: 1710
				},
				cpnInventory: {
					items: extend([], items)
				}
			}
		}]);

		return obj;
	},

	hasSpace: function (item, noStack) {
		if (this.inventorySize !== -1) {
			if (item) {
				let exists = this.items.find(i => (i.name === item.name));
				if (exists && !noStack && (exists.quantity || item.quantity))
					return true;
			}

			let nonEqItems = this.items.filter(f => !f.eq).length;
			return (nonEqItems < this.inventorySize);
		} return true;
	},

	getItem: function (item, hideMessage, noStack, hideAlert) {
		this.obj.instance.eventEmitter.emit('onBeforeGetItem', item, this.obj);

		//We need to know if a mob dropped it for quest purposes
		let fromMob = item.fromMob;

		if (!item.has('quality'))
			item.quality = 0;

		//Players can't have fromMob items in their inventory but bags can (dropped by a mob)
		if (this.obj.player)
			delete item.fromMob;

		//Store the quantity to send to the player
		let quantity = item.quantity;

		let exists = false;
		if ((item.material || item.quest || item.quantity) && !item.noStack && !item.uses && !noStack) {
			let existItem = this.items.find(i => i.name === item.name);
			if (existItem) {
				exists = true;
				existItem.quantity = (existItem.quantity || 1) + (item.quantity || 1);
				item = existItem;
			}
		}

		if (!exists)
			delete item.pos;

		//Get next id
		if (!exists) {
			let id = 0;
			let items = this.items;
			let iLen = items.length;

			if (!this.hasSpace(item)) {
				if (!hideMessage) {
					this.obj.instance.syncer.queue('onGetMessages', {
						id: this.obj.id,
						messages: [{
							class: 'color-redA',
							message: 'Your bags are too full to loot any more items',
							type: 'info'
						}]
					}, [this.obj.serverId]);
				}

				return false;
			}

			for (let i = 0; i < iLen; i++) {
				let fItem = items[i];
				if (fItem.id >= id) 
					id = fItem.id + 1;
			}
			item.id = id;

			if (item.eq)
				delete item.pos;

			if (!item.has('pos') && !item.eq) {
				let pos = iLen;
				for (let i = 0; i < iLen; i++) {
					if (!items.some(fi => (fi.pos === i))) {
						pos = i;
						break;
					}
				}
				item.pos = pos;
			}
		}

		if (this.obj.player) {
			let messages = [];

			let msg = item.name;
			if (quantity)
				msg += ' x' + quantity;
			else if ((item.stats) && (item.stats.weight))
				msg += ` ${item.stats.weight}lb`;
			messages.push({
				class: 'q' + item.quality,
				message: 'loot: {' + msg + '}',
				item: item,
				type: 'loot'
			});

			if (!hideAlert) {
				this.obj.instance.syncer.queue('onGetDamage', {
					id: this.obj.id,
					event: true,
					text: 'loot'
				}, -1);
			}

			if (!hideMessage) {
				this.obj.instance.syncer.queue('onGetMessages', {
					id: this.obj.id,
					messages: messages
				}, [this.obj.serverId]);
			}
		}

		if (item.effects) {
			item.effects.forEach(function (e) {
				if (e.mtx) {
					let mtxUrl = mtx.get(e.mtx);
					let mtxModule = require('../' + mtxUrl);

					e.events = mtxModule.events;
				} else if (e.type) {
					let effectUrl = itemEffects.get(e.type);
					try {
						let effectModule = require('../' + effectUrl);
						e.text = effectModule.events.onGetText(item, e);
						e.events = effectModule.events;
					} catch (error) {}
				}
			});
		}

		if (!exists)
			this.items.push(item);

		if (item.eq) {
			if (item.ability)
				this.learnAbility(item.id, item.runeSlot);
			else
				this.obj.equipment.equip(item.id);
		} else if (item.has('quickSlot')) {
			this.obj.equipment.setQuickSlot({
				itemId: item.id,
				slot: item.quickSlot
			});
		} else 
			this.obj.syncer.setArray(true, 'inventory', 'getItems', this.simplifyItem(item), true);

		if (!hideMessage) {
			if (fromMob)
				this.obj.fireEvent('afterLootMobItem', item);
		}

		return item;
	},

	dropBag: function (ownerName, killSource) {
		if (!this.blueprint)
			return;

		//Only drop loot if this player is in the zone
		let playerObject = this.obj.instance.objects.find(o => o.name === ownerName);
		if (!playerObject)
			return;

		let items = this.items;
		let iLen = items.length;
		for (let i = 0; i < iLen; i++) {
			delete items[i].eq;
			delete items[i].pos;
		}

		let blueprint = this.blueprint;
		let magicFind = (blueprint.magicFind || 0);

		let savedItems = extend([], this.items);
		this.items = [];

		let dropEvent = {
			chanceMultiplier: 1,
			source: this.obj
		};
		playerObject.fireEvent('beforeGenerateLoot', dropEvent);

		if ((!blueprint.noRandom) || (blueprint.alsoRandom)) {
			let bonusMagicFind = killSource.stats.values.magicFind;

			let rolls = blueprint.rolls;
			let itemQuantity = killSource.stats.values.itemQuantity;
			rolls += ~~(itemQuantity / 100);
			if ((Math.random() * 100) < (itemQuantity % 100))
				rolls++;

			for (let i = 0; i < rolls; i++) {
				if (Math.random() * 100 >= (blueprint.chance || 35) * dropEvent.chanceMultiplier)
					continue;

				let itemBlueprint = {
					level: this.obj.stats.values.level,
					magicFind: magicFind,
					bonusMagicFind: bonusMagicFind
				};

				let statValues = this.obj.stats.values;
				let useItem = generator.generate(itemBlueprint, statValues.level);

				this.getItem(useItem);
			}
		}

		if (blueprint.noRandom) {
			let blueprints = blueprint.blueprints;
			for (let i = 0; i < blueprints.length; i++) {
				let drop = blueprints[i];
				if ((blueprint.chance) && (~~(Math.random() * 100) >= blueprint.chance * dropEvent.chanceMultiplier))
					continue;
				else if ((drop.maxLevel) && (drop.maxLevel < killSource.stats.values.level))
					continue;
				else if ((drop.chance) && (~~(Math.random() * 100) >= drop.chance * dropEvent.chanceMultiplier)) 
					continue;

				drop.level = drop.level || this.obj.stats.values.level;
				drop.magicFind = magicFind;

				let item = drop;
				if ((!item.quest) && (item.type !== 'key'))
					item = generator.generate(drop);

				if (!item.slot)
					delete item.level;

				this.getItem(item, true);
			}
		}

		playerObject.fireEvent('beforeTargetDeath', this.obj, this.items);
		this.obj.instance.eventEmitter.emit('onBeforeDropBag', this.obj, this.items, killSource);

		if (this.items.length > 0)
			this.createBag(this.obj.x, this.obj.y, this.items, ownerName);

		this.items = savedItems;
	},

	giveItems: function (obj, hideMessage) {
		let objInventory = obj.inventory;

		let items = this.items;
		let iLen = items.length;
		for (let i = 0; i < iLen; i++) {
			let item = items[i];

			if (objInventory.getItem(item, hideMessage)) {
				items.splice(i, 1);
				i--;
				iLen--;
			}
		}

		return !iLen;
	},

	fireEvent: function (event, args) {
		let items = this.items;
		let iLen = items.length;
		for (let i = 0; i < iLen; i++) {
			let item = items[i];

			if (!item.eq && !item.active) {
				if (event !== 'afterUnequipItem' || item !== args[0])
					continue;
			}

			let effects = item.effects;
			if (!effects)
				continue;

			let eLen = effects.length;
			for (let j = 0; j < eLen; j++) {
				let effect = effects[j];

				let effectEvent = effect.events[event];
				if (!effectEvent)
					continue;

				effectEvent.apply(this.obj, [item, ...args]);
			}
		}
	},

	clear: function () {
		delete this.items;
		this.items = [];
	},

	equipItemErrors: function (item) {
		let errors = [];

		if (!this.obj.player)
			return [];

		let stats = this.obj.stats.values;

		if (item.level > stats.level)
			errors.push('level');

		if ((item.requires) && (stats[item.requires[0].stat] < item.requires[0].value))
			errors.push(item.requires[0].stat);

		if (item.factions) {
			if (item.factions.some(function (f) {
				return f.noEquip;
			}))
				errors.push('faction');
		}

		return errors;
	},

	canEquipItem: function (item) {
		return (this.equipItemErrors(item).length === 0);
	}
};
