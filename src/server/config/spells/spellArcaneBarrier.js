define([

], function(

) {
	var cpnArcanePatch = {
		type: 'arcanePatch',

		contents: [],

		init: function(blueprint) {
			for (var p in blueprint) {
				this[p] = blueprint[p];
			}
		},

		collisionEnter: function(o) {
			if ((!o.aggro) || (!o.player))
				return;

			var isPlayer = !!this.caster.player;
			var isTargetPlayer = !!o.player;

			if ((this.caster.aggro.canAttack(o)) || (isPlayer != isTargetPlayer))
				return;

			this.contents.push(o);
		},

		collisionExit: function(o) {
			var contents = this.contents;
			var cLen = contents.length;
			for (var i = 0; i < cLen; i++) {
				if (contents[i] == o) {
					contents.splice(i, 1);
					return;
				}
			}
		},

		update: function() {
			var stats = this.caster.stats;

			var contents = this.contents;
			var cLen = contents.length;
			for (var i = 0; i < cLen; i++) {
				var c = contents[i];

				var amount = this.spell.getDamage(c, true);
				c.stats.getHp(amount, this.caster);
			}
		}
	};

	return {
		type: 'arcaneBarrier',

		cdMax: 20,
		manaCost: 0,
		range: 9,

		duration: 70,

		targetGround: true,

		cast: function(action) {
			var obj = this.obj;
			var target = action.target;

			var radius = this.radius;

			var x = target.x;
			var y = target.y;

			var objects = this.obj.instance.objects;
			var patches = [];

			var physics = this.obj.instance.physics;

			for (var i = x - radius; i <= x + radius; i++) {
				var dx = Math.abs(x - i);
				for (var j = y - radius; j <= y + radius; j++) {
					var distance = dx + Math.abs(j - y);

					if (distance > radius + 1)
						continue;

					if (!physics.hasLos(x, y, i, j))
						continue;

					var patch = objects.buildObjects([{
						x: i,
						y: j,
						properties: {
							cpnArcanePatch: cpnArcanePatch,
							cpnParticles: {
								simplify: function() {
									return {
										type: 'particles',
										blueprint: this.blueprint
									};
								},
								blueprint: this.particles
							}
						},
						extraProperties: {
							arcanePatch: {
								caster: this.obj,
								spell: this
							}
						}
					}]);

					patches.push(patch);
				}
			}

			this.sendBump(target);

			this.queueCallback(null, this.duration * 350, this.endEffect.bind(this, patches), null, true);

			return true;
		},
		endEffect: function(patches) {
			var pLen = patches.length;
			for (var i = 0; i < pLen; i++) {
				patches[i].destroyed = true;
			}
		}
	};
});