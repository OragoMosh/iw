module.exports = {
	name: 'fjolarok',
	level: [1, 10],
	resources: {
		Skyblossom: {
			type: 'herb',
			max: 4
		},
		Emberleaf: {
			type: 'herb',
			max: 1,
			cdMax: 1710
		}
	},
	objects: {
		'sun carp school': {
			max: 9,
			type: 'fish',
			quantity: [6, 12]
		},
		vikardoor: {
			properties: {
				cpnDoor: {
					locked: true,
					key: 'vikar'
				}
			}
		},
		shopestrid: {
			properties: {
				cpnNotice: {
					actions: {
						enter: {
							cpn: 'dialogue',
							method: 'talk',
							args: [{
								targetName: 'estrid'
							}]
						},
						exit: {
							cpn: 'dialogue',
							method: 'stopTalk'
						}
					}
				}
			}
		},
		shophermit: {
			properties: {
				cpnNotice: {
					actions: {
						enter: {
							cpn: 'dialogue',
							method: 'talk',
							args: [{
								targetName: 'hermit'
							}]
						},
						exit: {
							cpn: 'dialogue',
							method: 'stopTalk'
						}
					}
				}
			}
		},
		shopvikar: {
			properties: {
				cpnNotice: {
					actions: {
						enter: {
							cpn: 'dialogue',
							method: 'talk',
							args: [{
								targetName: 'vikar'
							}]
						},
						exit: {
							cpn: 'dialogue',
							method: 'stopTalk'
						}
					}
				}
			}
		},
		shoppriest: {
			properties: {
				cpnNotice: {
					actions: {
						enter: {
							cpn: 'dialogue',
							method: 'talk',
							args: [{
								targetName: 'priest'
							}]
						},
						exit: {
							cpn: 'dialogue',
							method: 'stopTalk'
						}
					}
				}
			}
		},
		'estuary entrance': {
			components: {
				cpnParticles: {
					simplify: function () {
						return {
							type: 'particles',
							blueprint: {
								color: {
									start: ['48edff', '80f643'],
									end: ['80f643', '48edff']
								},
								scale: {
									start: {
										min: 2,
										max: 10
									},
									end: {
										min: 0,
										max: 2
									}
								},
								speed: {
									start: {
										min: 4,
										max: 16
									},
									end: {
										min: 2,
										max: 8
									}
								},
								lifetime: {
									min: 1,
									max: 4
								},
								randomScale: true,
								randomSpeed: true,
								chance: 0.075,
								randomColor: true,
								spawnType: 'rect',
								spawnRect: {
									x: -32,
									y: -48,
									w: 64,
									h: 64
								}
							}
						};
					}
				}
			}
		},
		greencandle: {
			components: {
				cpnLight: {
					simplify: function () {
						return {
							type: 'light',
							blueprint: {
								color: {
									start: ['80f643'],
									end: ['4ac441', '51fc9a', 'd07840']
								},
								lifetime: {
									min: 2,
									max: 6
								}
							}
						};
					}
				}
			}
		},
		fountain: {
			components: {
				cpnParticles: {
					simplify: function () {
						return {
							type: 'particles',
							blueprint: {
								color: {
									start: ['48edff', '3fa7dd'],
									end: ['3a71ba', '42548d']
								},
								scale: {
									start: {
										min: 2,
										max: 10
									},
									end: {
										min: 0,
										max: 2
									}
								},
								speed: {
									start: {
										min: 4,
										max: 16
									},
									end: {
										min: 2,
										max: 8
									}
								},
								lifetime: {
									min: 2,
									max: 5
								},
								randomScale: true,
								randomSpeed: true,
								chance: 0.8,
								randomColor: true,
								spawnType: 'rect',
								spawnRect: {
									x: -10,
									y: -21,
									w: 20,
									h: 8
								}
							}
						};
					}
				}
			}
		},
		alchgreenpot: {
			components: {
				cpnParticles: {
					simplify: function () {
						return {
							type: 'particles',
							blueprint: {
								color: {
									start: ['80f643', '80f643'],
									end: ['4ac441', '4ac441']
								},
								scale: {
									start: {
										min: 2,
										max: 10
									},
									end: {
										min: 0,
										max: 2
									}
								},
								speed: {
									start: {
										min: 4,
										max: 16
									},
									end: {
										min: 2,
										max: 8
									}
								},
								lifetime: {
									min: 1,
									max: 4
								},
								randomScale: true,
								randomSpeed: true,
								chance: 0.1,
								randomColor: true,
								spawnType: 'rect',
								spawnRect: {
									x: -15,
									y: -20,
									w: 30,
									h: 8
								}
							}
						};
					}
				}
			}
		},
		alchredpot: {
			components: {
				cpnParticles: {
					simplify: function () {
						return {
							type: 'particles',
							blueprint: {
								color: {
									start: ['ff4252', 'ff4252'],
									end: ['a82841', 'a82841']
								},
								scale: {
									start: {
										min: 2,
										max: 10
									},
									end: {
										min: 0,
										max: 2
									}
								},
								speed: {
									start: {
										min: 4,
										max: 16
									},
									end: {
										min: 2,
										max: 8
									}
								},
								lifetime: {
									min: 1,
									max: 4
								},
								randomScale: true,
								randomSpeed: true,
								chance: 0.2,
								randomColor: true,
								spawnType: 'rect',
								spawnRect: {
									x: -15,
									y: -28,
									w: 30,
									h: 8
								}
							}
						};
					}
				}
			}
		},
		'alchemy workbench': {
			components: {
				cpnParticles: {
					simplify: function () {
						return {
							type: 'particles',
							blueprint: {
								color: {
									start: ['ff4252', 'ff4252'],
									end: ['a82841', 'a82841']
								},
								scale: {
									start: {
										min: 2,
										max: 10
									},
									end: {
										min: 0,
										max: 2
									}
								},
								speed: {
									start: {
										min: 4,
										max: 16
									},
									end: {
										min: 2,
										max: 8
									}
								},
								lifetime: {
									min: 1,
									max: 4
								},
								randomScale: true,
								randomSpeed: true,
								chance: 0.2,
								randomColor: true,
								spawnType: 'rect',
								spawnRect: {
									x: -15,
									y: -28,
									w: 30,
									h: 8
								}
							}
						};
					}
				},
				cpnWorkbench: {
					type: 'alchemy'
				}
			}
		},
		fireplace: {
			components: {
				cpnWorkbench: {
					type: 'cooking'
				}
			}
		}
	},
	mobs: {
		default: {
			regular: {
				drops: {
					chance: 40,
					rolls: 1
				}
			}
		},
		'crazed seagull': {
			level: 1,

			rare: {
				count: 0
			},

			regular: {
				drops: {
					chance: 100,
					rolls: 1,
					noRandom: true,
					blueprints: [{
						maxLevel: 2,
						name: 'Family Heirloom',
						quality: 1,
						slot: 'neck',
						type: 'Choker',
						noSalvage: true,
						stats: ['vit', 'regenMana']
					}]
				}
			}
		},
		seagull: {
			level: 2,
			regular: {
				drops: {
					chance: 60,
					rolls: 1
				}
			},
			rare: {
				count: 0
			},
			questItem: {
				name: 'Gull Feather',
				sprite: [0, 0]
			}
		},
		bunny: {
			level: 3,
			regular: {
				drops: {
					chance: 56,
					rolls: 1
				}
			},
			rare: {
				name: 'Thumper'
			},
			questItem: {
				name: "Rabbit's Foot",
				sprite: [0, 1]
			}
		},
		elk: {
			level: 4,
			regular: {
				drops: {
					chance: 50,
					rolls: 1
				}
			},
			rare: {
				name: 'Ironhorn'
			},
			questItem: {
				name: 'Elk Antler',
				sprite: [0, 2]
			}
		},
		flamingo: {
			level: 5,
			regular: {
				drops: {
					chance: 45,
					rolls: 1
				}
			}
		},
		crab: {
			level: 6,

			rare: {
				name: 'Squiggles'
			},
			questItem: {
				name: 'Severed Pincer',
				sprite: [0, 3]
			}
		},
		'titan crab': {
			level: 7,
			rare: {
				name: 'The Pincer King'
			}
		},
		'mud crab': {
			level: 9
		},
		frog: {
			level: 8,
			rare: {
				name: 'The Muck Prince'
			}
		},
		eagle: {
			level: 10,
			faction: 'hostile',
			rare: {
				name: 'Fleshripper'
			}
		},
		hermit: {
			level: 10,
			walkDistance: 0,
			attackable: false,
			rare: {
				count: 0
			},
			properties: {
				cpnTrade: {
					items: {
						min: 3,
						max: 5
					},
					forceItems: [{
						name: 'Flimsy Fishing Rod',
						type: 'Fishing Rod',
						slot: 'tool',
						quality: 0,
						worth: 5,
						sprite: [11, 0],
						infinite: true,
						noSalvage: true
					}, {
						name: 'Skewering Stick',
						material: true,
						sprite: [11, 7],
						worth: 2,
						infinite: true
					}],
					level: {
						min: 1,
						max: 5
					},
					markup: {
						buy: 0.25,
						sell: 2.5
					}
				}
			}
		},
		guard: {
			level: 20,
			attackable: false,

			walkDistance: 0,

			rare: {
				count: 0
			}
		},
		estrid: {
			level: 15,
			attackable: false,
			walkDistance: 5,

			rare: {
				count: 0
			},

			properties: {
				cpnTrade: {
					items: {
						min: 0,
						max: 0,
						extra: [{
							name: 'Empty Vial',
							material: true,
							sprite: [0, 9],
							worth: 10,
							infinite: true
						}]
					},
					faction: {
						id: 'fjolgard',
						tier: 5
					},
					markup: {
						buy: 0.25,
						sell: 2.5
					}
				}
			}
		},
		vikar: {
			walkDistance: 0,
			attackable: false,
			rare: {
				count: 0
			},

			properties: {
				cpnTrade: {
					items: {
						min: 0,
						max: 0,
						extra: [{
							generate: true,
							spell: true,
							spellQuality: 'basic',
							infinite: true,
							spellName: 'magic missile',
							worth: 3
						}, {
							generate: true,
							spell: true,
							spellQuality: 'basic',
							infinite: true,
							spellName: 'ice spear',
							worth: 3
						}, {
							generate: true,
							spell: true,
							spellQuality: 'basic',
							infinite: true,
							spellName: 'smite',
							worth: 3
						}, {
							generate: true,
							spell: true,
							spellQuality: 'basic',
							infinite: true,
							spellName: 'consecrate',
							worth: 3
						}, {
							generate: true,
							spell: true,
							spellQuality: 'basic',
							infinite: true,
							spellName: 'slash',
							worth: 3
						}, {
							generate: true,
							spell: true,
							spellQuality: 'basic',
							infinite: true,
							spellName: 'charge',
							worth: 3
						}, {
							generate: true,
							spell: true,
							spellQuality: 'basic',
							infinite: true,
							spellName: 'flurry',
							worth: 3
						}, {
							generate: true,
							spell: true,
							spellQuality: 'basic',
							infinite: true,
							spellName: 'smokebomb',
							worth: 3
						}]
					},
					faction: {
						id: 'fjolgard',
						tier: 5
					},
					markup: {
						buy: 0.25,
						sell: 10
					}
				}
			}
		},
		luta: {
			walkDistance: 0,
			attackable: false,
			rare: {
				count: 0
			}
		},
		rodriguez: {
			attackable: false,
			level: 10,
			rare: {
				count: 0
			}
		},
		pig: {
			attackable: false,
			level: 3,
			rare: {
				count: 0
			}
		},
		goat: {
			attackable: false,
			level: 3,
			rare: {
				count: 0
			}
		},
		cow: {
			attackable: false,
			level: 3,
			rare: {
				count: 0
			}
		},
		priest: {
			level: 50,
			attackable: false,
			walkDistance: 0,
			rare: {
				count: 0
			},

			properties: {
				cpnTrade: {
					items: {
						min: 5,
						max: 10,
						extra: [{
							type: 'skin',
							skinId: '2.0',
							worth: 100,
							factions: [{
								id: 'gaekatla',
								tier: 7
							}]
						}, {
							worth: 100,
							infinite: true,
							generate: true,
							name: 'Cowl of Obscurity',
							level: [4, 13],
							quality: 4,
							noSpell: true,
							slot: 'head',
							sprite: [2, 0],
							spritesheet: '../../../images/legendaryItems.png',
							type: 'Silk Cowl',
							description: 'Imbued with the powers of Gaekatla herself.',
							stats: ['hpMax', 'hpMax', 'int', 'int'],
							effects: [{
								type: 'healOnCrit',
								rolls: {
									i_chance: [20, 60],
									i_percentage: [3, 7]
								}
							}],
							factions: [{
								id: 'gaekatla',
								tier: 7
							}]
						}]
					},
					faction: {
						id: 'gaekatla',
						tier: 5
					},
					markup: {
						buy: 0.25,
						sell: 10
					}
				}
			}
		}
	}
};
