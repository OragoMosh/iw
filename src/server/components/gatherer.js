let qualityGenerator = require('../items/generators/quality');

module.exports = {
	type: 'gatherer',

	nodes: [],
	gathering: null,
	gatheringTtl: 0,
	gatheringTtlMax: 7,
	defaultTtlMax: 7,

	simplify: function () {
		return {
			type: 'gatherer'
		};
	},

	gather: function () {
		if (this.gathering)
			return;

		let nodes = this.nodes;
		if (nodes.length === 0)
			return;

		let firstNode = nodes[0];

		this.gathering = firstNode;

		let ttlMax = firstNode.resourceNode.ttl || this.defaultTtlMax;

		if (firstNode.resourceNode.nodeType === 'fish') {
			let rod = this.obj.equipment.eq.tool;
			if (!rod) {
				this.sendAnnouncement('You need a fishing rod to fish');
				this.gathering = null;

				return;
			}

			rod = this.obj.inventory.findItem(rod);

			let statCatchSpeed = Math.min(150, this.obj.stats.values.catchSpeed);
			ttlMax *= (1 - (statCatchSpeed / 200));
		}

		this.gatheringTtlMax = ttlMax;
		this.gatheringTtl = this.gatheringTtlMax;
	},

	update: function () {
		let gathering = this.gathering;
		if (!gathering)
			return;

		if (gathering.destroyed) {
			this.gathering = null;
			this.gatheringTtl = 0;
			this.obj.syncer.set(false, 'gatherer', 'progress', 100);
			this.obj.syncer.set(true, 'gatherer', 'progress', 100);
			this.obj.syncer.set(true, 'gatherer', 'action', 'Fishing');
			return;
		}

		let isFish = (gathering.resourceNode.nodeType === 'fish');

		if (this.gatheringTtl > 0) {
			if ((this.gatheringTtl === this.gatheringTtlMax) && (gathering.width)) {
				['x', 'y', 'width', 'height'].forEach(function (p) {
					this.obj.syncer.set(false, 'gatherer', p, gathering[p]);
				}, this);
			}

			this.gatheringTtl--;

			let progress = 100 - ~~((this.gatheringTtl / this.gatheringTtlMax) * 100);
			this.obj.syncer.set(true, 'gatherer', 'progress', progress);
			if (isFish)
				this.obj.syncer.set(true, 'gatherer', 'action', 'Fishing');

			return;
		}

		let resourceNode = gathering.resourceNode;
		let gatherResult = extend({
			obj: gathering
		}, {
			nodeType: resourceNode.nodeType,
			blueprint: resourceNode.blueprint,
			xp: resourceNode.xp,
			items: gathering.inventory.items
		});
		this.obj.instance.eventEmitter.emitNoSticky('beforeGatherResource', gatherResult, this.obj);
		this.obj.fireEvent('beforeGatherResource', gatherResult, this.obj);

		this.obj.syncer.set(false, 'gatherer', 'progress', 100);

		if (isFish) {
			let catchChance = 40 + this.obj.stats.values.catchChance;
			if (~~(Math.random() * 100) >= catchChance) {
				this.sendAnnouncement('The fish got away');
				this.gathering = null;

				return;
			}

			gatherResult.items.forEach(function (g) {
				if (g.slot)
					return;
				
				delete g.quantity;

				qualityGenerator.generate(g, {
					//100 x 2.86 = 2000 (chance for a common)
					bonusMagicFind: this.obj.stats.values.fishRarity * 2.82
				});

				g.name = {
					0: '',
					1: 'Big ',
					2: 'Giant ',
					3: 'Trophy ',
					4: 'Fabled '
				}[g.quality] + g.name;

				let statFishWeight = 1 + (this.obj.stats.values.fishWeight / 100);
				let weight = ~~((gatherResult.blueprint.baseWeight + g.quality + (Math.random() * statFishWeight)) * 100) / 100;
				g.stats = {
					weight: weight
				};

				g.worth = ~~(weight * 10);
			}, this);
		}

		if (isFish) {
			let itemChance = 1 + this.obj.stats.values.fishItems;
			if (~~(Math.random() * 500) < itemChance) {
				gatherResult.items = [{
					name: 'Cerulean Pearl',
					material: true,
					quantity: 1,
					quality: 3,
					sprite: [11, 9]
				}];
			}
		}

		let blueprint = gatherResult.blueprint;

		gatherResult.items.forEach((item, i) => {
			delete item.pos;

			if (i === 0) {
				if (blueprint.itemName)
					item.name = blueprint.itemName;
				if (blueprint.itemAmount)
					item.quantity = ~~(Math.random() * blueprint.itemAmount[1]) + blueprint.itemAmount[0];
			}

			this.obj.inventory.getItem(item, false, false, true);

			if (item.material)
				this.obj.fireEvent('afterGatherResource', gatherResult);
		});

		if (!gatherResult.noChangeAmount)
			resourceNode.gather();

		this.obj.stats.getXp(gatherResult.xp, this.obj, gatherResult.obj);

		if (gathering.destroyed) {
			if (isFish)
				this.sendAnnouncement('The school has been depleted');

			this.nodes.spliceWhere(n => (n === gathering));
		}

		this.gathering = null;
	},

	enter: function (node) {
		let gatherResult = extend({
			nodeName: node.name
		});
		this.obj.instance.eventEmitter.emitNoSticky('beforeEnterPool', gatherResult, this.obj);

		let nodeType = node.resourceNode.nodeType;
		let msg = `Press G to $ (${gatherResult.nodeName})`;
		msg = msg.replace('$', {
			herb: 'gather',
			fish: 'fish for'
		}[nodeType]);

		if (nodeType === 'fish') {
			if (!this.obj.equipment.eq.has('tool'))
				msg = 'You need a fishing rod to fish';
		}

		this.sendAnnouncement(msg);

		this.nodes.spliceWhere(n => (n === node));
		this.nodes.push(node);
	},

	exit: function (node) {
		this.nodes.spliceWhere(n => (n === node));
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

	events: {
		beforeRezone: function () {
			this.events.beforeMove.call(this);
		},

		beforeMove: function () {
			if (!this.gathering)
				return;

			['x', 'y', 'width', 'height'].forEach(p => {
				this.obj.syncer.delete(false, 'gatherer', p);
			});

			this.obj.syncer.set(true, 'gatherer', 'progress', 100);
			this.obj.syncer.set(false, 'gatherer', 'progress', 100);

			if (this.gathering.resourceNode.nodeType === 'fish')
				this.obj.syncer.set(true, 'gatherer', 'action', 'Fishing');

			this.gathering = null;
		},

		beforeCastSpell: function () {
			this.events.beforeMove.call(this);
		},

		beforeTakeDamage: function () {
			this.events.beforeMove.call(this);
		},

		afterEquipItem: function (item) {
			let nodes = this.nodes;
			let nLen = nodes.length;

			for (let i = 0; i < nLen; i++) {
				let node = nodes[i];
				if (item.slot !== 'tool')
					continue;

				if (node.resourceNode.nodeType === 'fish') {
					if (!this.obj.equipment.eq.has('tool')) {
						this.sendAnnouncement('You need a fishing rod to fish');

						if (this.gathering === node) {
							if (this.gathering.resourceNode.nodeType === 'fish')
								this.obj.syncer.set(true, 'gatherer', 'action', 'Fishing');

							this.gathering = null;
							this.obj.syncer.set(true, 'gatherer', 'progress', 100);
							this.obj.syncer.set(false, 'gatherer', 'progress', 100);
						}
					}
				}
			}
		},

		afterUnequipItem: function (item) {
			this.events.afterEquipItem.call(this, item);
		}
	}
};
