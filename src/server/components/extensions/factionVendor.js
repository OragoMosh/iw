define([
	'items/generator',
	'config/skins',
	'config/factions',
	'items/itemEffects'
], function (
	generator,
	skins,
	factions,
	itemEffects
) {
	return {
		baseItems: [],

		cdMax: 10,

		blueprint: null,

		init: function (blueprint) {
			this.baseItems = this.items;
			this.items = {};

			this.faction = blueprint.faction;
			this.blueprint = blueprint;
		},

		getItems: function (requestedBy) {
			var name = requestedBy.name;
			var requestLevel = requestedBy.stats.values.level;

			var list = this.items[name];
			if (!list) {
				list = {
					items: [],
					level: requestLevel,
					cd: this.cdMax
				};

				this.items[name] = list;
				this.regenList(list);
			} else if (list.level != requestLevel)
				this.regenList(list);

			var reputation = requestedBy.reputation;

			var result = list.items
				.map(function (i) {
					var item = extend(true, {}, i);

					if (item.effects) {
						item.stats = {
							stats: '???'
						};
						item.quality = 0;
						item.name = item.type;

						item.effects = item.effects
							.map(function (e) {
								if (e.factionId) {
									return {
										factionId: e.factionId,
										text: e.text,
										properties: e.properties
									};
								} else {
									var effectUrl = itemEffects.get(e.type);
									var effectModule = require(effectUrl);

									return {
										text: effectModule.events.onGetText(item)
									};
								}
							});
					}

					if (item.factions) {
						item.factions = item.factions.map(function (f) {
							var faction = reputation.getBlueprint(f.id);
							var factionTier = reputation.getTier(f.id);

							var noEquip = null;
							if (factionTier < f.tier)
								noEquip = true;

							return {
								name: faction.name,
								tier: f.tier,
								tierName: ['Hated', 'Hostile', 'Unfriendly', 'Neutral', 'Friendly', 'Honored', 'Revered', 'Exalted'][f.tier],
								noEquip: noEquip
							};
						}, this);
					}

					return item;
				});

			return result;
		},

		regenList: function (list) {
			var blueprint = this.blueprint;

			list.items = null;
			list.items = [];

			var faction = factions.getFaction(blueprint.faction.id);
			var statGenerator = faction.uniqueStat;

			var itemCount = blueprint.items.min + ~~(Math.random() * (blueprint.items.max - blueprint.items.min));
			for (var i = 0; i < itemCount; i++) {
				var minLevel = Math.max(1, list.level * 0.75);
				var maxLevel = list.level * 1.25;
				var level = ~~(minLevel + (Math.random() * (maxLevel - minLevel)));

				var item = generator.generate({
					noSpell: true,
					magicFind: 150,
					level: level
				});

				var randomQuality = ~~(Math.random() * 5);
				item.worth = Math.pow(item.level, 1.5) + (Math.pow((randomQuality + 1), 2) * 10)

				var id = 0;
				list.items.forEach(function (checkItem) {
					if (checkItem.id >= id)
						id = checkItem.id + 1;
				});

				item.id = id;

				generator.removeStat(item);
				statGenerator.generate(item);

				item.factions = [{}];
				item.factions[0].id = blueprint.faction.id;
				item.factions[0].tier = blueprint.faction.tier;

				list.items.push(item);
			}

			var baseItems = this.baseItems;
			var bLen = baseItems.length;
			for (var i = 0; i < bLen; i++) {
				list.items.push(baseItems[i]);
			}

			var extra = blueprint.items.extra;
			if (!extra)
				return;

			var eLen = extra.length;
			for (var i = 0; i < eLen; i++) {
				var e = extra[i];

				var item = extend(true, {}, e);

				if (item.type == 'skin') {
					var skinBlueprint = skins.getBlueprint(item.id);
					item.name = skinBlueprint.name;
					item.sprite = skinBlueprint.sprite;
				} else if (item.generate) {
					var generated = generator.generate(item);
					if (item.worth)
						generated.worth = item.worth;
					if (item.infinite)
						generated.infinite = true;

					if (item.factions)
						generated.factions = item.factions;

					item = generated;
				}

				var id = 0;
				list.items.forEach(function (checkItem) {
					if (checkItem.id >= id)
						id = checkItem.id + 1;
				});

				item.id = id;

				list.items.push(item);
			}
		},

		canBuy: function (itemId, requestedBy, action) {
			var item = null;
			if (action == 'buy')
				item = this.findItem(itemId, requestedBy.name);
			else if (action == 'buyback')
				item = this.findBuyback(itemId, requestedBy.name);

			var result = true;
			if (item.factions)
				result = requestedBy.reputation.canEquipItem(item);

			if (!result) {
				requestedBy.instance.syncer.queue('onGetMessages', {
					id: requestedBy.id,
					messages: [{
						class: 'color-redA',
						message: `your reputation is too low to buy that item`,
						type: 'info'
					}]
				}, [requestedBy.serverId]);
			}

			return result;
		},

		findItem: function (itemId, sourceName) {
			var list = this.items[sourceName];
			if (!list)
				return null;

			return list.items.find(i => i.id == itemId);
		},

		removeItem: function (itemId, sourceName) {
			var list = this.items[sourceName];
			if (!sourceName)
				return null;

			return list.items.spliceFirstWhere(i => i.id == itemId);
		}
	};
});
