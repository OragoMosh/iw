define([
	'../../misc/events'
], function (
	events
) {
	var types = {
		head: {
			'Helmet': {
				sprite: [0, 0],
				material: 'plate'
			},
			'Cowl': {
				sprite: [0, 1],
				material: 'cloth'
			},
			'Leather Cap': {
				sprite: [0, 2],
				material: 'leather'
			},
			'Facemask': {
				sprite: [0, 3],
				material: 'leather'
			}
		},
		neck: {
			'Pendant': {
				sprite: [1, 0],
				implicitStat: {
					stat: 'str',
					value: [1, 4]
				}
			},
			'Amulet': {
				sprite: [1, 1],
				implicitStat: {
					stat: 'int',
					value: [1, 4]
				}
			},
			'Locket': {
				sprite: [1, 2],
				implicitStat: {
					stat: 'dex',
					value: [1, 4]
				}
			},
			'Choker': {
				sprite: [1, 3],
				implicitStat: {
					stat: 'regenHp',
					value: [2, 5]
				}
			}
		},
		chest: {
			'Breastplate': {
				sprite: [2, 0],
				material: 'plate'
			},
			'Robe': {
				material: 'cloth',
				sprite: [2, 1]
			},
			'Leather Armor': {
				sprite: [2, 2],
				material: 'leather'
			},
			'Scalemail': {
				sprite: [2, 3],
				material: 'leather'
			}
		},
		hands: {
			'Gauntlets': {
				sprite: [3, 0],
				material: 'plate'
			},
			'Gloves': {
				material: 'cloth',
				sprite: [3, 1]
			},
			'Leather Gloves': {
				sprite: [3, 2],
				material: 'leather'
			},
			'Scale Gloves': {
				sprite: [3, 3],
				material: 'leather'
			}
		},
		finger: {
			'Signet': {
				sprite: [4, 0],
				implicitStat: {
					stat: 'armor',
					value: [5, 15]
				}
			},
			'Ring': {
				sprite: [4, 1],
				implicitStat: {
					stat: 'regenMana',
					value: [1, 5]
				}
			},
			'Loop': {
				sprite: [4, 2],
				implicitStat: {
					stat: 'allAttributes',
					value: [1, 7]
				}
			},
			'Viridian Band': {
				sprite: [4, 3],
				implicitStat: {
					stat: 'dmgPercent',
					value: [1, 3]
				}
			}
		},
		waist: {
			'Belt': {
				material: 'plate',
				sprite: [5, 0],
				implicitStat: {
					stat: 'armor',
					value: [10, 20]
				}
			},
			'Sash': {
				material: 'cloth',
				sprite: [5, 1],
				implicitStat: {
					stat: 'manaMax',
					value: [1, 8]
				}
			},
			'Leather Belt': {
				material: 'leather',
				sprite: [5, 2],
				implicitStat: {
					stat: 'addCritChance',
					value: [10, 50]
				}
			},
			'Scaled Binding': {
				material: 'leather',
				sprite: [5, 3],
				implicitStat: {
					stat: 'vit',
					value: [2, 6]
				}
			}
		},
		legs: {
			'Legplates': {
				material: 'plate',
				sprite: [6, 0]
			},
			'Pants': {
				material: 'cloth',
				sprite: [6, 1]
			},
			'Leather Pants': {
				sprite: [6, 2],
				material: 'leather'
			},
			'Scale Leggings': {
				sprite: [6, 3],
				material: 'leather'
			}
		},
		feet: {
			'Steel Boots': {
				material: 'plate',
				sprite: [7, 0]
			},
			'Boots': {
				material: 'cloth',
				sprite: [7, 1]
			},
			'Leather Boots': {
				material: 'leather',
				sprite: [7, 2]
			},
			'Scale Boots': {
				material: 'leather',
				sprite: [7, 3]
			}
		},
		trinket: {
			'Forged Ember': {
				sprite: [8, 0],
				implicitStat: {
					stat: 'armor',
					value: [25, 70]
				}
			},
			'Smokey Orb': {
				sprite: [8, 1],
				implicitStat: {
					stat: 'dodgeAttackChance',
					value: [1, 3]
				}
			},
			'Quartz Fragment': {
				sprite: [8, 2],
				implicitStat: {
					stat: 'elementArcanePercent',
					value: [3, 12]
				}
			},
			'Mystic Card': {
				sprite: [8, 3],
				implicitStat: {
					stat: 'magicFind',
					value: [3, 12]
				}
			},
			'Dragon Fang': {
				sprite: [8, 4],
				implicitStat: {
					stat: 'attackSpeed',
					value: [1, 5]
				}
			}
		},
		oneHanded: {
			'Sword': {
				attrRequire: 'str',
				sprite: [9, 0],
				spellName: 'melee',
				spellConfig: {
					statType: 'str',
					statMult: 0.84,
					threatMult: 4,
					cdMax: 5,
					useWeaponRange: true,
					random: {
						damage: [3, 11.4]
					}
				},
				implicitStat: {
					stat: 'attackSpeed',
					value: [1, 5]
				}
			},
			'Dagger': {
				attrRequire: 'dex',
				sprite: [9, 2],
				spellName: 'melee',
				spellConfig: {
					statType: 'dex',
					statMult: 0.88,
					cdMax: 3,
					useWeaponRange: true,
					random: {
						damage: [1, 3.8]
					}
				},
				implicitStat: {
					stat: 'addAttackCritChance',
					value: [10, 50]
				}
			},
			'Wand': {
				attrRequire: 'int',
				sprite: [9, 8],
				spellName: 'projectile',
				spellConfig: {
					statType: 'int',
					statMult: 1,
					element: 'holy',
					cdMax: 4,
					manaCost: 0,
					range: 6,
					random: {
						damage: [2, 12]
					}
				},
				implicitStat: {
					stat: 'castSpeed',
					value: [1, 5]
				}
			}
		},
		twoHanded: {
			'Axe': {
				attrRequire: 'str',
				sprite: [9, 3],
				spellName: 'melee',
				spellConfig: {
					statType: 'str',
					statMult: 0.84,
					threatMult: 4,
					cdMax: 5,
					useWeaponRange: true,
					random: {
						damage: [3, 15.4]
					}
				},
				implicitStat: {
					stat: 'addAttackCritMultiplier',
					value: [10, 30]
				}
			},
			'Gnarled Staff': {
				attrRequire: 'int',
				sprite: [9, 1],
				spellName: 'projectile',
				spellConfig: {
					statType: 'int',
					statMult: 0.9,
					element: 'arcane',
					auto: true,
					cdMax: 7,
					manaCost: 0,
					range: 9,
					random: {
						damage: [2, 15]
					}
				},
				implicitStat: {
					stat: 'regenMana',
					value: [3, 9]
				}
			},
			'Spear': {
				attrRequire: 'dex',
				sprite: [9, 6],
				spellName: 'melee',
				range: 2,
				spellConfig: {
					statType: 'dex',
					statMult: 0.84,
					threatMult: 4,
					cdMax: 5,
					useWeaponRange: true,
					random: {
						damage: [3, 11.4]
					}
				},
				implicitStat: {
					stat: 'dodgeAttackChance',
					value: [1, 7]
				}
			}
		},
		offHand: {
			'Wooden Shield': {
				attrRequire: 'str',
				sprite: [13, 0],
				armorMult: 0.3,
				blockAttackMult: 1
			},
			'Gilded Shield': {
				attrRequire: 'str',
				sprite: [13, 1],
				armorMult: 0.6,
				blockAttackMult: 0.5
			},
			'Brittle Tome': {
				attrRequire: 'int',
				sprite: [13, 2],
				implicitStat: {
					stat: 'addSpellCritChance',
					value: [10, 50]
				}
			},
			'Ancient Tome': {
				attrRequire: 'int',
				sprite: [13, 3],
				implicitStat: {
					stat: 'addSpellCritMultiplier',
					value: [10, 30]
				}
			}
		},
		tool: {
			'Fishing Rod': {
				sprite: [11, 0]
			}
		}
	}

	return {
		types: types,
		init: function () {
			events.emit('onBeforeGetItemTypes', types);
		}
	};
});
