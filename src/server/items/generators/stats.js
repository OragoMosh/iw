define([
	'items/generators/statsFishingRod'
], function(
	statsFishingRod
) {
	return {
		generators: {
			hpMax: function(item, level, blueprint) {
				var max = ((level * 15) + level) / 10;

				return random.norm(1, max) * (blueprint.statMult.hpMax || 1);
			},
			mainStat: function(item, level, blueprint) {
				var min = ((level * 6.05) - ((level - 1) * 1.2)) / 10;
				var max = ((level * 14.9) + ((level - 1) * 31.49)) / 10;

				return random.norm(min, max) * (blueprint.statMult.mainStat || 1);
			},
			armor: function(item, level, blueprint) {
				var min = (level * 20);
				var max = (level * 51.2);

				return random.norm(min, max) * blueprint.statMult.armor;
			},
			elementResist: function(item, level, blueprint) {
				return random.norm(1, 7.5) * (blueprint.statMult.elementResist || 1);
			},
			regenHp: function(item, level, blueprint) {
				var max = (((10 + (level * 200)) / 20) / 2) / 10;

				return random.norm(1, max) * (blueprint.statMult.regenHp || 1);
			},
			lvlRequire: function(item, level, blueprint) {
				var max = ~~(level / 2);

				return random.norm(1, max) * (blueprint.statMult.lvlRequire || 1);
			}
		},

		stats: {
			hpMax: {
				generator: 'hpMax'
			},
			regenHp: {
				generator: 'regenHp'
			},

			manaMax: {
				min: 1,
				max: 5
			},

			regenMana: {
				min: 1,
				max: 7
			},

			lvlRequire: {
				generator: 'lvlRequire'
			},

			str: {
				generator: 'mainStat'
			},
			int: {
				generator: 'mainStat'
			},
			dex: {
				generator: 'mainStat'
			},

			elementArcaneResist: {
				generator: 'elementResist'
			},
			elementFrostResist: {
				generator: 'elementResist'
			},
			elementFireResist: {
				generator: 'elementResist'
			},
			elementHolyResist: {
				generator: 'elementResist'
			},
			elementPhysicalResist: {
				generator: 'elementResist'
			},
			elementPoisonResist: {
				generator: 'elementResist'
			},
			elementAllResist: {
				generator: 'elementResist'
			},

			armor: {
				generator: 'armor',
				ignore: true
			},

			addCritChance: {
				min: 1,
				max: 90
			},
			addCritMultiplier: {
				min: 5,
				max: 50
			},

			magicFind: {
				min: 1,
				max: 15
			},

			xpIncrease: {
				min: 1,
				max: 6
			}
		},

		slots: {
			feet: {
				sprintChance: {
					min: 1,
					max: 20
				}
			},

			finger: {
				dmgPercent: {
					min: 1,
					max: 5
				},
				elementArcanePercent: {
					min: 1,
					max: 5
				},
				elementFrostPercent: {
					min: 1,
					max: 5
				},
				elementFirePercent: {
					min: 1,
					max: 5
				},
				elementHolyPercent: {
					min: 1,
					max: 5
				},
				elementPhysicalPercent: {
					min: 1,
					max: 5
				},
				elementPoisonPercent: {
					min: 1,
					max: 5
				},
				allAttributes: {
					generator: 'mainStat'
				}
			},

			neck: {
				dmgPercent: {
					min: 1,
					max: 10
				},
				elementArcanePercent: {
					min: 1,
					max: 10
				},
				elementFrostPercent: {
					min: 1,
					max: 10
				},
				elementFirePercent: {
					min: 1,
					max: 10
				},
				elementHolyPercent: {
					min: 1,
					max: 10
				},
				elementPhysicalPercent: {
					min: 1,
					max: 10
				},
				elementPoisonPercent: {
					min: 1,
					max: 10
				},
				allAttributes: {
					generator: 'mainStat'
				}
			}
		},
		mainStatChance: 0.7,

		generate: function(item, blueprint, result) {
			if (item.slot == 'tool') {
				statsFishingRod.generate(item, blueprint);
				return;
			}

			if (!blueprint.statCount)
				item.stats = {};

			if (blueprint.noStats)
				return;

			//If we enchant something we don't add armor
			if (!blueprint.statMult)
				blueprint.statMult = {};
			if (blueprint.statMult.armor)
				this.buildStat(item, blueprint, 'armor');

			var statCount = blueprint.statCount || (item.quality + 1);

			if (blueprint.forceStats) {
				for (var i = 0; i < Math.min(statCount, blueprint.forceStats.length); i++) {
					var choice = blueprint.forceStats[i];
					this.buildStat(item, blueprint, choice, result);
					statCount--;
				}
			}

			if (blueprint.stats) {
				var useStats = extend(true, [], blueprint.stats);
				var addStats = Math.min(statCount, blueprint.stats.length);
				for (var i = 0; i < addStats; i++) {
					var choice = useStats[~~(Math.random() * useStats.length)];
					useStats.spliceFirstWhere(s => s == choice);
					this.buildStat(item, blueprint, choice, result);
					statCount--;
				}
			}

			for (var i = 0; i < statCount; i++) {
				this.buildStat(item, blueprint, null, result);
			}

			for (var s in item.stats) {
				item.stats[s] = Math.ceil(item.stats[s]);
				if (item.stats[s] == 0)
					delete item.stats[s];
			}
		},

		buildStat: function(item, blueprint, stat, result) {
			var statOptions = extend(true, {}, this.stats, this.slots[item.slot] || {});
			var statBlueprint = null;

			if (!stat) {
				var options = Object.keys(statOptions).filter(s => !statOptions[s].ignore);
				stat = options[~~(Math.random() * options.length)];
				statBlueprint = statOptions[stat];
			} else
				statBlueprint = statOptions[stat];

			var value = null;

			if (statBlueprint.generator) { 
				var level = item.originalLevel || item.level;
				value = Math.ceil(this.generators[statBlueprint.generator](item, level, blueprint, statBlueprint));
			} else
				value = Math.ceil(random.norm(statBlueprint.min, statBlueprint.max));

			if (blueprint.statCount) {
				if (result) {
					result.addStatMsgs.push({
						stat: stat,
						value: value
					});
				}

				if (!item.enchantedStats)
					item.enchantedStats = {};
				if (item.enchantedStats[stat])
					item.enchantedStats[stat] += value;
				else
					item.enchantedStats[stat] = value;
			}

			if (stat == 'lvlRequire') {
				if (!item.originalLevel)
					item.originalLevel = item.level;

				item.level -= value;
				if (item.level < 1)
					item.level = 1;
			}

			if (item.stats[stat])
				value += item.stats[stat];

			item.stats[stat] = value;
		}
	};
});