let generator = require('../items/generator');
let salvager = require('../items/salvager');
let enchanter = require('../items/enchanter');
let classes = require('../config/spirits');
let mtx = require('../mtx/mtx');
let factions = require('../config/factions');
let itemEffects = require('../items/itemEffects');

const { applyItemStats } = require('./equipment/helpers');

const getItem = require('./inventory/getItem');
const dropBag = require('./inventory/dropBag');
const useItem = require('./inventory/useItem');

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
			let pos = item.has('pos') ? item.pos : null;

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
			items: this.items.map(this.simplifyItem.bind(this))
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
				factionId: e.factionId || null,
				text: e.text || null,
				properties: e.properties || null,
				mtx: e.mtx || null,
				type: e.type || null,
				rolls: e.rolls || null
			}));
		}

		let reputation = this.obj.reputation;
		if (result.factions) {
			result.factions = result.factions.map(function (f) {
				let res = {
					id: f.id,
					tier: f.tier,
					tierName: ['Hated', 'Hostile', 'Unfriendly', 'Neutral', 'Friendly', 'Honored', 'Revered', 'Exalted'][f.tier]
				};

				if (reputation) {
					let faction = reputation.getBlueprint(f.id);
					let factionTier = reputation.getTier(f.id);

					let noEquip = null;
					if (factionTier < f.tier)
						noEquip = true;

					res.name = faction.name;
					res.noEquip = noEquip;
				}

				return res;
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
		const { itemId, action } = msg;
		const item = this.findItem(itemId);
		if (!item)
			return;

		const { eq, slot, power, noAugment } = item;

		if (!slot || noAugment || (action === 'scour' && !power)) {
			this.resolveCallback(msg);
			return;
		}

		const obj = this.obj;

		if (eq) {
			applyItemStats(obj, item, false);
			enchanter.enchant(obj, item, msg);
			applyItemStats(obj, item, true);

			if (item.slot !== slot)
				obj.equipment.unequip(itemId);
			else
				obj.spellbook.calcDps();
		} else
			enchanter.enchant(obj, item, msg);

		obj.equipment.unequipAttrRqrGear();
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
		if (!item || !item.quantity || item.quantity <= msg.stackSize || msg.stackSize < 1 || item.quest)
			return;

		const hasSpace = this.hasSpace(item, true);
		if (!hasSpace) {
			this.notifyNoBagSpace();
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
		useItem(this, itemId);
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

	mailItem: async function (msg) {
		return;
		let item = this.findItem(msg.itemId);
		if ((!item) || (item.noDrop) || (item.quest)) {
			this.resolveCallback(msg);
			return;
		}

		delete item.pos;

		let res = await io.getAsync({
			key: msg.recipient,
			table: 'character'
		});

		if (!res) {
			this.resolveCallback(msg, 'Recipient does not exist');
			return;
		} else if (!this.findItem(msg.itemId)) 
			return;

		let blocked = false;
		if (res.components) {
			let social = res.components.find(f => f.type === 'social');
			if (social.blockedPlayers && social.blockedPlayers.includes(this.obj.name)) 
				blocked = true;
		}

		if (!blocked) {
			const mappedItem = this.simplifyItem(item);
			this.obj.instance.mail.sendMail(msg.recipient, [mappedItem]);
		}
		this.destroyItem(item.id);

		this.resolveCallback(msg);
	},

	hookItemEvents: function (items) {
		items = items || this.items;
		if (!items.push)
			items = [ items ];
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
							e.text = effectModule.events.onGetText(item, e);
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

	sortInventory: function () {
		this.items
			.filter(i => !i.eq)
			.map(i => {
				return {
					item: i,
					sortId: `${i.slot}${i.material}${i.quest}${i.spell}${i.quality}${i.level}${i.sprite}${i.id}`
				};
			})
			.sort((a, b) => {
				if (a.sortId < b.sortId)
					return 1;
				else if (a.sortId > b.sortId)
					return -1;
				return 0;
			})
			.forEach((i, index) => {
				i.item.pos = index;
				this.obj.syncer.setArray(true, 'inventory', 'getItems', this.simplifyItem(i.item));
			});
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
		let hasWeapon = this.items.some(i => {
			return (
				i.spell &&
				i.spell.rolls &&
				i.spell.rolls.has('damage') &&
				(
					i.slot === 'twoHanded' || 
					i.slot === 'oneHanded'
				)
			);
		});

		if (!hasWeapon) {
			let item = generator.generate({
				type: classes.weapons[this.obj.class],
				quality: 0,
				spellQuality: 'basic'
			});
			item.worth = 0;
			item.eq = true;
			item.noSalvage = true;
			this.getItem(item);
		}

		classes.spells[this.obj.class].forEach(spellName => {
			let hasSpell = this.items.some(i => {
				return (
					i.spell &&
					i.spell.name.toLowerCase() === spellName
				);
			});

			if (!hasSpell) {
				let item = generator.generate({
					spell: true,
					spellQuality: 'basic',
					spellName: spellName
				});
				item.worth = 0;
				item.eq = true;
				item.noSalvage = true;
				this.getItem(item);
			}
		});
	},

	createBag: function (x, y, items, ownerName) {
		let bagCell = 50;

		let topQuality = 0;
		let iLen = items.length;
		for (let i = 0; i < iLen; i++) {
			let quality = items[i].quality;
			items[i].fromMob = !!this.obj.mob;
			if (quality > topQuality)
				topQuality = ~~quality;
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
		return getItem(this, item, hideMessage, noStack, hideAlert);
	},

	dropBag: function (ownerName, killSource) {
		dropBag(this, ownerName, killSource);
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
	},

	notifyNoBagSpace: function () {
		this.obj.instance.syncer.queue('onGetMessages', {
			id: this.obj.id,
			messages: [{
				class: 'color-redA',
				message: 'Your bags are too full to loot any more items',
				type: 'info'
			}]
		}, [this.obj.serverId]);
	}
};
