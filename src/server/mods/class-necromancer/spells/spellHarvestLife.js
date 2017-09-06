
define([

], function(

) {
	return {
		type: 'harvestLife',
		
		cdMax: 5,
		manaCost: 0,
		range: 1,

		damage: 1,

		col: 4,
		row: 1,

		init: function() {
			if (this.range > 1)
				this.needLos = true;
		},

		cast: function(action) {
			var target = action.target;

			var row = this.row;
			var col = this.col;

			this.sendAnimation({
				id: target.id,
				components: [{
					type: 'attackAnimation',
					new: true,
					row: row,
					col: col
				}]
			});

			this.sendBump(target);

			this.queueCallback(this.explode.bind(this, target), 100);

			return true;
		},
		explode: function(target) {
			var obj = this.obj;

			if ((obj.destroyed) || (target.destroyed))
				return;
			
			var damage = this.getDamage(target);
			target.stats.takeDamage(damage, this.threatMult, obj);

			var healAmount = damage.amount * (this.healPercent / 100);
			obj.stats.getHp({
				amount: healAmount
			}, obj);
		}
	};
});