define([
	'world/spawners',
	'world/mobBuilder'
], function(
	spawners,
	mobBuilder
) {
	return {
		id: 'gaekatla',
		name: 'Gaekatla',
		description: `Gaekatla; the goddess of nature.`,

		uniqueStat: {
			chance: {
				min: 5,
				max: 20
			},

			generate: function(item) {
				var chance = this.chance;
				var chanceRoll = ~~(random.norm(chance.min, chance.max) * 10) / 10;

				var result = null;
				if (item.effects)
					result = item.effects.find(e => (e.factionId == 'gaekatla'));

				if (!result) {
					if (!item.effects)
						item.effects = [];

					result = {
						factionId: 'gaekatla',
						chance: chanceRoll,
						text: chanceRoll + '% chance on kill to summon a critter to assist you in battle',
						events: {}
					};

					item.effects.push(result);
				}
				//This is a hack for items that were never generated properly
				else if (!result.chance) {
					result.chance = chanceRoll;
					result.text = chanceRoll + '% chance on kill to summon a critter to assist you in battle';
				}

				if (!result.events)
					result.events = {};

				for (var e in this.events) {
					result.events[e] = this.events[e];
				}

				return result;
			},

			events: {
				afterKillMob: function(item, mob) {
					var effect = item.effects.find(e => (e.factionId == 'gaekatla'));

					var roll = Math.random() * 100;
					if (roll >= effect.chance)
						return;

					//Spawn a mob
					var mob = mob.instance.spawners.spawn({
						amountLeft: 1,
						blueprint: {
							x: mob.x,
							y: mob.y,
							cell: 34,
							sheetName: 'mobs',
							name: 'Squiggle',
							properties: {
								cpnFollower: {}
							},
							extraProperties: {
								follower: {
									master: this
								}
							}
						}
					});

					mobBuilder.build(mob, {
						level: item.level,
						faction: this.aggro.faction,
						walkDistance: 2,
						regular: {
							drops: 0,
							hpMult: 1,
							dmgMult: 1
						},
						spells: [{
							type: 'melee',
							damage: 1,
							statMult: 0.1
						}]
					}, false, 'regular');

					mob.follower.bindEvents();
				}
			}
		},

		rewards: {

		}
	};
});