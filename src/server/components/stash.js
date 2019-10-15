const cpnInventory = require('./inventory');

module.exports = {
	type: 'stash',

	active: false,
	tabs: null,
	items: [],
	changed: false,

	init: function (blueprint) {
		this.tabs = blueprint.tabs || [{ id: 1, type: 'mtx' }, { id: 2, type: 'basic' }];

		let items = blueprint.items || [];
		let iLen = items.length;
		for (let i = 0; i < iLen; i++) 
			this.getItem(items[i]);

		delete blueprint.items;

		this.blueprint = blueprint;
	},

	getFirstTabOfType: function (tabType) {
		return this.tabs.find(({ type }) => type === tabType);
	},

	getItemTab: function (item) {
		if (item.type === 'mtx') {
			const tabMtx = this.getFirstTabOfType('mtx');
			if (tabMtx)
				return tabMtx.id;
		}

		return this.getFirstTabOfType('basic').id;
	},

	getItem: function (item) {
		//Material?
		let exists = false;
		if (((item.material) || (item.quest) || (item.quantity)) && (!item.noStack) && (!item.uses)) {
			let existItem = this.items.find(i => i.name === item.name);
			if (existItem) {
				exists = true;
				if (!existItem.quantity)
					existItem.quantity = 1;
				existItem.quantity += item.quantity;

				//We modify the old object because it gets sent to the client
				item.id = existItem.id;
				item.quantity = existItem.quantity;

				item = existItem;
			}
		}

		//Get next id
		if (!exists) {
			let id = 0;
			let items = this.items;
			let iLen = items.length;
			for (let i = 0; i < iLen; i++) {
				let fItem = items[i];
				if (fItem.id >= id) 
					id = fItem.id + 1;
			}
			item.id = id;
			item.tab = this.getItemTab(item);
		}

		if (!exists)
			this.items.push(item);
	},

	deposit: function (item) {
		if (!this.active)
			return;
		else if (this.items.length >= 50) {
			this.obj.instance.syncer.queue('onGetMessages', {
				id: this.obj.id,
				messages: [{
					class: 'color-redA',
					message: 'You do not have room in your stash to deposit that item',
					type: 'info'
				}]
			}, [this.obj.serverId]);

			return;
		}

		this.getItem(item);

		this.obj.syncer.setArray(true, 'stash', 'getItems', item);

		this.changed = true;

		return true;
	},

	destroyItem: function (id) {
		let item = this.items.find(i => i.id === id);
		if (!item)
			return;

		this.items.spliceWhere(i => i === item);

		this.obj.syncer.setArray(true, 'stash', 'destroyItems', id);

		this.changed = true;
	},

	withdraw: function (id) {
		if (!this.active)
			return;

		let item = this.items.find(i => i.id === id);
		if (!item)
			return;
		else if (!this.obj.inventory.hasSpace(item)) {
			this.obj.instance.syncer.queue('onGetMessages', {
				id: this.obj.id,
				messages: [{
					class: 'color-redA',
					message: 'You do not have room in your inventory to withdraw that item',
					type: 'info'
				}]
			}, [this.obj.serverId]);
			
			return;
		}

		this.obj.inventory.getItem(item);
		this.items.spliceWhere(i => i === item);

		this.obj.syncer.setArray(true, 'stash', 'destroyItems', id);

		this.changed = true;
	},

	setActive: function (active) {
		let obj = this.obj;

		this.active = active;
		obj.syncer.set(true, 'stash', 'active', this.active);

		const actionType = active ? 'addActions' : 'removeActions';
		obj.syncer.setArray(true, 'serverActions', actionType, {
			key: 'u',
			action: {
				targetId: obj.id,
				cpn: 'stash',
				method: 'open'
			}
		});

		if (this.active && this.items.length > 50) {
			obj.instance.syncer.queue('onGetMessages', {
				id: this.obj.id,
				messages: [{
					class: 'color-redA',
					message: 'You have more than 50 items in your stash. In the next version (v0.3.1) you will lose all items that put you over the limit',
					type: 'info'
				}]
			}, [obj.serverId]);
		}
	},

	open: function () {
		if (this.active)
			this.obj.instance.syncer.queue('onOpenStash', {}, [this.obj.serverId]);
	},

	simplify: function (self) {
		if (!self)
			return null;

		return {
			type: 'stash',
			active: this.active,
			tabs: this.tabs,
			items: this.items
		};
	},

	serialize: function () {
		return this.items.map(i => cpnInventory.simplifyItem.call({ obj: {} }, i));
	}
};
