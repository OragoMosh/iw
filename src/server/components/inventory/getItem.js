const getNextId = items => {
	let id = 0;
	let iLen = items.length;

	for (let i = 0; i < iLen; i++) {
		let fItem = items[i];
		if (fItem.id >= id) 
			id = fItem.id + 1;
	}

	return id;
};

const autoStash = ({ stash }, item) => {
	if (!stash)
		return false;

	const shouldAutoStash = stash.shouldAutoStash(item);
	if (!shouldAutoStash)
		return false;

	const didDeposit = stash.deposit(item, true);
	return didDeposit;
};

module.exports = (cpnInv, item, hideMessage, noStack, hideAlert) => {
	const obj = cpnInv.obj;
	obj.instance.eventEmitter.emit('onBeforeGetItem', item, obj);

	//We need to know if a mob dropped it for quest purposes
	let fromMob = item.fromMob;

	if (!item.has('quality'))
		item.quality = 0;

	//Players can't have fromMob items in their inventory but bags can (dropped by a mob)
	if (obj.player)
		delete item.fromMob;

	if (autoStash(obj, item))
		return;

	//Store the quantity to send to the player
	let quantity = item.quantity;

	let exists = false;
	if ((item.material || item.quest || item.quantity) && !item.noStack && !item.uses && !noStack) {
		let existItem = cpnInv.items.find(i => i.name === item.name);
		if (existItem) {
			exists = true;
			existItem.quantity = ~~(existItem.quantity || 1) + ~~(item.quantity || 1);
			item = existItem;
		}
	}

	if (!exists)
		delete item.pos;

	//Get next id
	if (!exists) {
		if (!cpnInv.hasSpace(item)) {
			if (!hideMessage) 
				cpnInv.notifyNoBagSpace();

			return false;
		}

		const items = cpnInv.items;
		item.id = getNextId(items);

		if (item.eq)
			delete item.pos;

		if (!item.has('pos') && !item.eq) {
			const iLen = items.length;
			let pos = iLen;
			for (let i = 0; i < iLen; i++) {
				if (!items.some(fi => fi.pos === i)) {
					pos = i;
					break;
				}
			}
			item.pos = pos;
		}
	}

	if (obj.player) {
		let msg = item.name;
		if (quantity)
			msg += ' x' + quantity;
		else if ((item.stats) && (item.stats.weight))
			msg += ` ${item.stats.weight}lb`;
			
		const messages = [{
			class: 'q' + item.quality,
			message: 'loot: {' + msg + '}',
			item: item,
			type: 'loot'
		}];

		if (!hideAlert) {
			obj.instance.syncer.queue('onGetDamage', {
				id: obj.id,
				event: true,
				text: 'loot'
			}, -1);
		}

		if (!hideMessage) {
			obj.instance.syncer.queue('onGetMessages', {
				id: obj.id,
				messages: messages
			}, [obj.serverId]);
		}
	}

	if (item.effects) 
		cpnInv.hookItemEvents([item]);

	if (!exists)
		cpnInv.items.push(item);

	if (item.eq) {
		if (item.ability)
			cpnInv.learnAbility(item.id, item.runeSlot);
		else
			obj.equipment.equip(item.id);
	} else if (item.has('quickSlot')) {
		obj.equipment.setQuickSlot({
			itemId: item.id,
			slot: item.quickSlot
		});
	} else {
		obj.syncer.deleteFromArray(true, 'inventory', 'getItems', i => i.id === item.id);
		obj.syncer.setArray(true, 'inventory', 'getItems', cpnInv.simplifyItem(item), true);
	}

	if (!hideMessage && fromMob) 
		obj.fireEvent('afterLootMobItem', item);

	return item;
};
