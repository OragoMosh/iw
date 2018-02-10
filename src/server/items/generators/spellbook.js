define([
	'config/spells',
	'config/spellsConfig'
], function (
	spells,
	spellsConfig
) {
	var maxQuality = 5;

	return {
		generate: function (item, blueprint) {
			blueprint = blueprint || {};
			var spellQuality = blueprint ? blueprint.spellQuality : '';
			var spellName = blueprint.spellName;

			if (!spellName) {
				var spellList = Object.keys(spellsConfig.spells).filter(s => ((!spellsConfig.spells[s].auto) && (!s.noDrop)));
				spellName = spellList[~~(Math.random() * spellList.length)];
			}

			var spell = spellsConfig.spells[spellName];
			var spellAesthetic = spells.spells.find(s => s.name.toLowerCase() == spellName) || {};

			if (!item.slot) {
				var sprite = [10, 0];
				var statType = spell.statType;
				if (statType == 'dex')
					sprite = [10, 1];
				else if (statType == 'str')
					sprite = [10, 2];
				else if (statType instanceof Array) {
					if ((statType.indexOf('dex') > -1) && (statType.indexOf('int') > -1))
						sprite = [10, 3];
					else if ((statType.indexOf('str') > -1) && (statType.indexOf('int') > -1))
						sprite = [10, 4];
				}

				item.name = 'Rune of ' + spellAesthetic.name;
				item.ability = true;
				item.sprite = sprite;
			} else if (spellQuality == 'basic')
				item.stats = {};

			if (blueprint.spellConfig)
				spellAesthetic = extend(true, {}, spellAesthetic, blueprint.spellConfig);

			item.spell = {
				name: spellAesthetic.name || 'Weapon Damage',
				type: spellAesthetic.type || spellName,
				rolls: {},
				values: {}
			};

			if (blueprint.spellConfig) {
				extend(true, item.spell, blueprint.spellConfig);
			}

			var propertyPerfection = [];

			var randomProperties = spell.random || {};
			var negativeStats = spell.negativeStats || [];
			for (var r in randomProperties) {
				var negativeStat = (negativeStats.indexOf(r) > -1);
				var range = randomProperties[r];

				var max = Math.min(20, item.level) / 20;

				var roll = random.expNorm(0, max);
				if (spellQuality == 'basic')
					roll = 0;
				else if (spellQuality == 'mid')
					roll = 0.5;

				item.spell.rolls[r] = roll;

				var int = r.indexOf('i_') == 0;
				var val = range[0] + ((range[1] - range[0]) * roll);
				if (int) {
					val = ~~val;
					r = r.replace('i_', '');
				} else
					val = ~~(val * 10) / 10;

				item.spell.values[r] = val;

				if (negativeStat)
					propertyPerfection.push(1 - roll);
				else
					propertyPerfection.push(roll)
			}

			if (blueprint.spellProperties) {
				item.spell.properties = {};
				for (var p in blueprint.spellProperties) {
					item.spell.properties[p] = blueprint.spellProperties[p];
				}
			}

			if (item.range) {
				item.spell.properties = item.spell.properties || {};
				item.spell.properties.range = item.range;
			}

			var per = propertyPerfection.reduce((p, n) => p + n, 0);
			var perfection = ~~((per / propertyPerfection.length) * 4);
			if (!item.slot)
				item.quality = perfection;
			else
				item.spell.quality = perfection
		}
	};
});
