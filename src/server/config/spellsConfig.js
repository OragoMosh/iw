define([
	'../misc/events'
], function (
	events
) {
	var spells = {
		'magic missile': {
			statType: 'int',
			statMult: 0.4,
			element: 'arcane',
			auto: true,
			cdMax: 7,
			manaCost: 0,
			range: 9,
			random: {
				damage: [2, 4]
			}
		},
		'ice spear': {
			statType: 'int',
			statMult: 0.29,
			element: 'frost',
			cdMax: 10,
			manaCost: 5,
			range: 9,
			dmgMult: 0.8,
			random: {
				damage: [4, 8],
				i_freezeDuration: [6, 10]
			}
		},
		'fireblast': {
			statType: 'int',
			statMult: 0.2,
			element: 'fire',
			cdMax: 15,
			manaCost: 7,
			dmgMult: 1.1,
			random: {
				damage: [6.7, 13.3],
				i_radius: [1, 2.2],
				i_pushback: [1, 4]
			}
		},
		'smite': {
			statType: 'int',
			statMult: 0.55,
			element: 'holy',
			auto: true,
			needLos: true,
			cdMax: 6,
			manaCost: 0,
			range: 9,
			random: {
				damage: [1.4, 2.6]
			}
		},
		'healing circle': {
			statType: 'int',
			statMult: 0.454,
			element: 'holy',
			cdMax: 10,
			manaCost: 10,
			range: 9,
			radius: 3,
			random: {
				healing: [0.7, 1.3],
				i_duration: [7, 13]
			}
		},
		/*'holy vengeance': {
			statType: 'int',
			statMult: 1,
			cdMax: 30,
			manaCost: 15,
			range: 9,
			random: {
				i_duration: [30, 50]
			}
		},*/
		'slash': {
			statType: 'str',
			statMult: 0.475,
			element: 'physical',
			threatMult: 4,
			auto: true,
			cdMax: 5,
			useWeaponRange: true,
			random: {
				damage: [2, 4]
			}
		},
		'charge': {
			statType: 'str',
			statMult: 0.32,
			element: 'physical',
			threatMult: 3,
			cdMax: 5,
			range: 10,
			manaCost: 5,
			dmgMult: 0.9,
			random: {
				damage: [4, 8],
				i_stunDuration: [3, 7]
			}
		},
		/*'reflect damage': {
			statType: 'str',
			statMult: 1,
			cdMax: 5,
			threatMult: 2,
			manaCost: 10,
			random: {
				i_duration: [4, 8]
			}
		},*/
		'double slash': {
			statType: 'dex',
			statMult: 0.75,
			element: 'physical',
			cdMax: 3,
			useWeaponRange: true,
			auto: true,
			random: {
				damage: [1, 3]
			}
		},
		'smokebomb': {
			statType: 'dex',
			statMult: 0.38,
			element: 'poison',
			cdMax: 5,
			manaCost: 6,
			dmgMult: 1.2,
			random: {
				damage: [0.3, 0.7],
				i_radius: [1, 3],
				i_duration: [7, 13]
			}
		},
		/*'stealth': {
			statType: 'dex',
			statMult: 1,
			duration: 200,
			cdMax: 15,
			manaCost: 10
		},*/
		'crystal spikes': {
			statType: ['dex', 'int'],
			statMult: 0.075,
			element: 'physical',
			manaCost: 6,
			needLos: true,
			cdMax: 10,
			range: 9,
			random: {
				damage: [9.3, 18.6],
				i_delay: [2, 4]
			},
			negativeStats: [
				'i_delay'
			]
		},
		'innervation': {
			statType: ['str'],
			statMult: 0.0205,
			element: 'physical',
			manaReserve: {
				percentage: 0.25
			},
			cdMax: 10,
			auraRange: 9,
			effect: 'regenHp',
			random: {
				regenPercentage: [0.1, 0.5]
			}
		},
		'tranquility': {
			statType: ['int'],
			statMult: 0.0205,
			element: 'holy',
			manaReserve: {
				percentage: 0.25
			},
			cdMax: 10,
			auraRange: 9,
			effect: 'regenMana',
			random: {
				regenPercentage: [5, 18]
			}
		},
		'swiftness': {
			statType: ['dex'],
			statMult: 0.0205,
			element: 'fire',
			manaReserve: {
				percentage: 0.4
			},
			cdMax: 10,
			auraRange: 9,
			effect: 'swiftness',
			random: {
				chance: [5, 10]
			}
		}
		/*,
				'chain lightning': {
					statType: 'int',
					statMult: 0.454,
					element: 'holy',
					cdMax: 5,
					manaCost: 0,
					range: 9,
					random: {
						damage: [9.3, 18.6]
					}
				}*/
	};

	return {
		spells: spells,
		init: function () {
			events.emit('onBeforeGetSpellsConfig', spells);
		}
	};
});
