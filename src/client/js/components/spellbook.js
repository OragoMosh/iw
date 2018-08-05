define([
	'js/system/client',
	'js/rendering/renderer',
	'js/system/events'
], function (
	client,
	renderer,
	events
) {
	let scale = 40;

	let objects = null;
	require(['js/objects/objects'], function (o) {
		objects = o;
	});

	return {
		type: 'spellbook',

		hoverTarget: null,

		target: null,
		selected: null,
		reticleState: 0,
		reticleCd: 0,
		reticleCdMax: 10,

		renderRange: null,

		reticleSprite: null,
		targetSprite: null,

		shiftDown: false,

		init: function (blueprint) {
			this.targetSprite = renderer.buildObject({
				sheetName: 'ui',
				layerName: 'effects',
				cell: this.reticleState
			});
			this.targetSprite.visible = false;

			this.reticleSprite = renderer.buildObject({
				sheetName: 'ui',
				layerName: 'effects',
				cell: 8 + this.reticleState
			});
			this.reticleSprite.visible = false;

			events.emit('onGetSpells', this.spells);

			this.reticleCd = this.reticleCdMax;
			this.obj.on('onDeath', this.onDeath.bind(this));

			this.obj.on('onMobHover', this.onMobHover.bind(this));
			this.obj.on('mouseDown', this.onMouseDown.bind(this));

			this.obj.on('onKeyDown', this.onKeyDown.bind(this));
			this.obj.on('onKeyUp', this.onKeyUp.bind(this));
		},

		extend: function (blueprint) {
			if (blueprint.removeSpells) {
				blueprint.removeSpells.forEach(function (spellId) {
					this.spells.spliceWhere(function (s) {
						return (s.id === spellId);
					});
				}, this);

				events.emit('onGetSpells', this.spells);
			}

			if (blueprint.getSpells) {
				blueprint.getSpells.forEach(function (s) {
					let existIndex = this.spells.firstIndex(function (spell) {
						return (spell.id === s.id);
					});

					if (existIndex > -1) {
						this.spells.splice(existIndex, 1, s);
						return;
					}

					this.spells.push(s);

					this.spells = this.spells.sort(function (a, b) {
						return (a.id - b.id);
					});
				}, this);

				events.emit('onGetSpells', this.spells);
			}
		},

		getSpell: function (number) {
			let spellNumber = (number === ' ') ? 0 : number;

			let spell = this.spells.find(function (s) {
				return (s.id === spellNumber);
			});
			if (!spell)
				return null;

			return spell;
		},

		onMobHover: function (target) {
			this.hoverTarget = target;
		},

		onMouseDown: function (e, target) {
			this.target = target || this.hoverTarget;

			if (this.target) {
				this.targetSprite.x = this.target.x * scale;
				this.targetSprite.y = this.target.y * scale;

				this.targetSprite.visible = true;
			} else {
				client.request({
					cpn: 'player',
					method: 'queueAction',
					data: {
						action: 'spell',
						priority: true,
						target: null
					}
				});

				this.targetSprite.visible = false;
			}

			events.emit('onSetTarget', this.target, e);
		},

		tabTarget: function () {
			let closest = objects.getClosest(window.player.x, window.player.y, 10, this.shiftDown, this.target);

			this.target = closest;
			this.targetSprite.visible = !!this.target;

			events.emit('onSetTarget', this.target, null);
		},

		build: function (destroy) {
			client.request({
				cpn: 'player',
				method: 'performAction',
				data: {
					instanceModule: 'customMap',
					method: 'customize',
					data: {
						tile: 189,
						direction: this.obj.keyboardMover.direction,
						destroy: destroy
					}
				},
				callback: renderer.onGetMapCustomization.bind(renderer)
			});
		},

		onKeyDown: function (key) {
			if (key === 'b') {
				this.build();
				return;
			} else if (key === 'n') {
				this.build(true);
				return;
			}

			if (key === 'shift') {
				this.shiftDown = true;
				return;
			} else if (key === 'tab') {
				this.tabTarget();
				return;
			}

			let spell = this.getSpell(key);
			if (!spell)
				return;

			let oldTarget = null;
			if (this.shiftDown) {
				oldTarget = this.target;
				this.target = this.obj;
			}

			if ((!spell.aura) && (!spell.targetGround) && (!spell.autoTargetFollower) && (!this.target))
				return;

			let hoverTile = this.obj.mouseMover.hoverTile;
			let target = hoverTile;
			if ((spell.autoTargetFollower) && (!this.target))
				target = null;
			else if ((!spell.targetGround) && (this.target))
				target = this.target.id;

			if (this.shiftDown)
				this.target = oldTarget;

			if ((target === this.obj) && (spell.noTargetSelf))
				return;

			client.request({
				cpn: 'player',
				method: 'queueAction',
				data: {
					action: 'spell',
					priority: true,
					spell: spell.id,
					auto: spell.auto,
					target: target,
					self: this.shiftDown
				}
			});
		},

		onKeyUp: function (key) {
			if (key === 'shift') {
				this.shiftDown = false;
				return;
			}
		},

		onDeath: function () {
			this.target = null;
			this.targetSprite.visible = false;
		},

		update: function () {
			if ((this.target) && (this.target.destroyed)) {
				this.target = null;
				this.targetSprite.visible = false;
			}
			if ((this.target) && (this.target.nonSelectable)) {
				this.target = null;
				this.targetSprite.visible = false;
			}

			if (this.reticleCd > 0)
				this.reticleCd--;
			else {
				this.reticleCd = this.reticleCdMax;
				this.reticleState++;
				if (this.reticleState === 4)
					this.reticleState = 0;
			}

			if (!this.target)
				return;

			renderer.setSprite({
				sprite: this.targetSprite,
				cell: this.reticleState,
				sheetName: 'ui'
			});

			this.targetSprite.x = this.target.x * scale;
			this.targetSprite.y = this.target.y * scale;
		},

		destroy: function () {
			if (this.targetSprite) {
				renderer.destroyObject({
					layerName: 'effects',
					sprite: this.targetSprite
				});
			}
		},

		render: function () {
			if (this.reticleCd > 0)
				this.reticleCd--;
			else {
				this.reticleCd = this.reticleCdMax;
				this.reticleState++;
				if (this.reticleState === 4)
					this.reticleState = 0;
			}

			if (!this.target)
				return;

			renderer.setSprite({
				sprite: this.targetSprite,
				cell: this.reticleState,
				sheetName: 'ui'
			});

			this.targetSprite.x = this.target.x * scale;
			this.targetSprite.y = this.target.y * scale;
		}
	};
});
