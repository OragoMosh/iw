var sqlite = require('sqlite3');
var babar = require('babar');

var analyser = {
	results: {
		ms: null,
		hp: null,
		dpt: null,
		ttk: null,
		idealTtk: null,
		idealDpt: {
			1: 0.31,
			2: 0.65,
			3: 1.05,
			4: 1.65,
			5: 2.31,
			6: 3.21,
			7: 4.81,
			8: 5.65,
			9: 8.78,
			10: 14,
			11: 20,
			12: 25,
			13: 31.39,
			14: 40,
			15: 49.22,
			16: 56,
			17: 65,
			18: 75,
			19: 88.58,
			20: 110
		}
	},

	init: function () {
		db.getCharacters(this.onGetCharacters.bind(this));
	},

	onGetCharacters: function (err, res) {
		var chars = res.map(function (r) {
			var val = JSON.parse(r.value);
			val.components.forEach(function (c) {
				val[c.type] = c;
			});

			return val;
		});

		this.calcMs(chars);
		this.calcHp(chars);
		this.calcDpt(chars);
		this.calcTtk(chars);
		this.calcIdealTtk(chars);

		this.plot('ms');
		this.plot('hp');
		this.plot('dpt');
		this.plot('ttk');
		this.plot('idealTtk');
	},

	calcMs: function (chars) {
		var res = {};
		var counts = {};

		for (var i = 1; i <= 20; i++) {
			res[i] = 0;
			counts[i] = 0;
		}

		chars.forEach(function (c) {
			if ((!c.stats) || (c.name == 'Waffle'))
				return;

			var level = c.stats.values.level;
			var s = [0, 0, 0];

			c.inventory.items.forEach(function (i) {
				if ((!i.eq) || (!i.stats))
					return;

				s[0] += (i.stats.int || 0);
				s[1] += (i.stats.dex || 0);
				s[2] += (i.stats.str || 0);
			}, 0);

			var ms = Math.max(s[0], s[1], s[2]);

			res[level] += (ms + level);
			counts[level]++;
		});

		for (var p in res) {
			res[p] = ~~(res[p] / counts[p]);
		}

		this.results.ms = res;
	},

	calcHp: function (chars) {
		var res = {};
		var counts = {};

		for (var i = 1; i <= 20; i++) {
			res[i] = 0;
			counts[i] = 0;
		}

		chars.forEach(function (c) {
			if ((!c.stats) || (c.name == 'Waffle'))
				return;

			var level = c.stats.values.level;
			var vit = c.inventory.items.reduce(function (a, b) {
				return (b.eq) ? ((b.stats || {}).vit || 0) : 0;
			}, 0);

			var maxHp = (level * 32.7) + (vit * 10);

			res[level] += maxHp;
			counts[level]++;
		});

		for (var p in res) {
			res[p] = ~~(res[p] / counts[p]);
		}

		this.results.hp = res;
	},

	calcDpt: function (chars) {
		var res = {};
		var counts = {};

		for (var i = 1; i <= 20; i++) {
			res[i] = 0;
			counts[i] = 0;
		}

		chars.forEach(function (c) {
			if ((!c.stats) || (c.name == 'Waffle'))
				return;

			var level = c.stats.values.level;

			var spells = c.spellbook.spells;
			var total = 0;
			var count = 0;
			spells.forEach(function (s) {
				var dmg = s.values.dmg;
				if (!dmg)
					return;

				dmg = parseFloat(dmg.split('/')[0]);
				total += dmg;
				count++;
			});

			if (count > 0)
				res[level] += (total / count);
			counts[level]++;
		});

		for (var p in res) {
			res[p] = (res[p] / counts[p]);
		}

		this.results.dpt = res;
	},

	calcTtk: function (chars) {
		var res = {};
		var mults = {
			'1': 0.1,
			'2': 0.2,
			'3': 0.4,
			'4': 0.7,
			'5': 0.78,
			'6': 0.91,
			'7': 1.16,
			'8': 1.19,
			'9': 1.65,
			'10': 2.36,
			'11': 3.07,
			'12': 3.55,
			'13': 4.1,
			'14': 4.85,
			'15': 5.6,
			'16': 5.9,
			'17': 6.5,
			'18': 7.1,
			'19': 7.9,
			'20': 12,
		};

		var dpt = this.results.dpt;

		for (var i = 1; i <= 20; i++) {
			var hp = (i * 32.7) * (mults[i] || 1);
			res[i] = hp / dpt[i];
		}

		this.results.ttk = res;
	},

	calcIdealTtk: function (chars) {
		var res = {};
		var mults = {
			'1': 0.1,
			'2': 0.2,
			'3': 0.4,
			'4': 0.7,
			'5': 0.78,
			'6': 0.91,
			'7': 1.16,
			'8': 1.19,
			'9': 1.65,
			'10': 2.36,
			'11': 3.07,
			'12': 3.55,
			'13': 4.1,
			'14': 4.85,
			'15': 5.6,
			'16': 5.9,
			'17': 6.5,
			'18': 7.1,
			'19': 7.9,
			'20': 12,
		};

		var dpt = this.results.idealDpt;

		for (var i = 1; i <= 20; i++) {
			var hp = (i * 32.7) * (mults[i] || 1);
			res[i] = hp / dpt[i];
		}

		this.results.idealTtk = res;
	},

	plot: function (field) {
		var res = this.results[field];

		console.log('         ' + field.toUpperCase());

		var print = [];
		for (var i = 1; i <= 20; i++) {
			print.push([i, res[i]]);
		}

		console.log(babar(print));
		console.log();
	}
};

var db = {
	db: null,

	init: function () {
		this.db = new sqlite.Database('../../data/storage.db', analyser.init.bind(analyser));
	},

	getCharacters: function (cb) {
		var query = `SELECT * FROM character`;
		this.db.all(query, cb);
	}
};

db.init();
