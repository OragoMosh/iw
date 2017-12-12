define([

], function (

) {
	return {
		type: 'titangrip',

		init: function () {

		},

		simplify: function () {
			return this.type;
		},

		events: {
			afterEquipItem: function (item) {
				if (item.slot != 'twoHanded')
					return;

				var stats = item.stats;
				for (var s in stats) {
					var val = stats[s];

					if (s == 'hpMax')
						s = 'vit';
					this.obj.stats.addStat(s, val);
				}
			},
			afterUnequipItem: function (item) {
				if (item.slot != 'twoHanded')
					return;

				var stats = item.stats;
				for (var s in stats) {
					var val = stats[s];

					if (s == 'hpMax')
						s = 'vit';
					this.obj.stats.addStat(s, -val);
				}
			}
		}
	};
});
