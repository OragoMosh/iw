const recipes = require('../config/recipes/recipes');

module.exports = {
	type: 'workbench',

	craftType: null,

	init: function (blueprint) {
		this.craftType = blueprint.type;

		this.obj.instance.objects.buildObjects([{
			properties: {
				x: this.obj.x - 1,
				y: this.obj.y - 1,
				width: 3,
				height: 3,
				cpnNotice: {
					actions: {
						enter: {
							cpn: 'workbench',
							method: 'enterArea',
							targetId: this.obj.id,
							args: []
						},
						exit: {
							cpn: 'workbench',
							method: 'exitArea',
							targetId: this.obj.id,
							args: []
						}
					}
				}
			}
		}]);
	},

	exitArea: function (obj) {
		if (!obj.player)
			return;

		obj.syncer.setArray(true, 'serverActions', 'removeActions', {
			key: 'u',
			action: {
				targetId: this.obj.id,
				cpn: 'workbench',
				method: 'access'
			}
		});

		this.obj.instance.syncer.queue('onCloseWorkbench', null, [obj.serverId]);
	},

	enterArea: function (obj) {
		if (!obj.player)
			return;

		let msg = `Press U to access the ${this.obj.name}`;

		obj.syncer.setArray(true, 'serverActions', 'addActions', {
			key: 'u',
			action: {
				targetId: this.obj.id,
				cpn: 'workbench',
				method: 'open'
			}
		});

		this.obj.instance.syncer.queue('onGetAnnouncement', {
			src: this.obj.id,
			msg: msg
		}, [obj.serverId]);
	},

	open: function (msg) {
		if (!msg.has('sourceId'))
			return;

		let obj = this.obj.instance.objects.objects.find(o => o.serverId === msg.sourceId);
		if ((!obj) || (!obj.player))
			return;

		let thisObj = this.obj;
		if ((Math.abs(thisObj.x - obj.x) > 1) || (Math.abs(thisObj.y - obj.y) > 1))
			return;

		this.obj.instance.syncer.queue('onOpenWorkbench', {
			workbenchId: this.obj.id,
			name: this.obj.name,
			recipes: recipes.getList(this.craftType)
		}, [obj.serverId]);
	},

	buildRecipe: function (crafter, recipeName) {
		let recipe = recipes.getRecipe(this.craftType, recipeName);
		if (!recipe)
			return;

		const items = crafter.inventory.items;

		let sendRecipe = extend({}, recipe);
		(sendRecipe.materials || []).forEach(function (m) {
			m.need = !items.some(i => (
				(
					i.name === m.name ||
					i.name.indexOf(m.nameLike) > -1
				) && 
				(
					m.quantity === 1 || 
					i.quantity >= m.quantity
				)
			));
		});

		return sendRecipe;
	},

	getRecipe: function (msg) {
		let obj = this.obj.instance.objects.objects.find(o => o.serverId === msg.sourceId);
		if ((!obj) || (!obj.player))
			return;

		const sendRecipe = this.buildRecipe(obj, msg.name);

		this.resolveCallback(msg, sendRecipe);
	},

	craft: function (msg) {
		let obj = this.obj.instance.objects.objects.find(o => o.serverId === msg.sourceId);
		if ((!obj) || (!obj.player))
			return;

		let recipe = recipes.getRecipe(this.craftType, msg.name);
		if (!recipe)
			return;

		const items = obj.inventory.items;
		let canCraft = recipe.materials.every(m => (items.some(i => (
			(
				i.name === m.name ||
				i.name.indexOf(m.nameLike) > -1
			) &&
			(
				m.quantity === 1 || 
				i.quantity >= m.quantity
			)
		))));

		if (!canCraft)
			return;

		recipe.materials.forEach(m => {
			let findItem = obj.inventory.items.find(f => (
				f.name === m.name ||
				f.name.indexOf(m.nameLike) > -1
			));
			obj.inventory.destroyItem(findItem.id, m.quantity);
		});

		let outputItems = recipe.item ? [ recipe.item ] : recipe.items;
		outputItems.forEach(itemBpt => {
			let item = extend({}, itemBpt);
			item.description += `<br /><br />(Crafted by ${obj.name})`;

			const quantity = item.quantity;
			if (quantity.push)
				item.quantity = quantity[0] + ~~(Math.random() * (quantity[1] - quantity[0]));

			obj.inventory.getItem(item);
		});

		this.resolveCallback(msg, this.buildRecipe(obj, msg.name));
	},

	resolveCallback: function (msg, result) {
		let callbackId = (msg.has('callbackId')) ? msg.callbackId : msg;
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
	}
};
