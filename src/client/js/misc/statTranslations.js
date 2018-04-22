define([

], function (

) {
	var stats = {
		'vit': 'vitality',
		'regenHp': 'health regeneration',
		'manaMax': 'maximum mana',
		'regenMana': 'mana regeneration',
		'str': 'strength',
		'int': 'intellect',
		'dex': 'dexterity',
		'armor': 'armor',
		'blockAttackChance': 'chance to block attacks',
		'blockSpellChance': 'chance to block spells',
		'addCritChance': 'increased global crit chance',
		'addCritMultiplier': 'increased global crit multiplier',
		'addAttackCritChance': 'increased attack crit chance',
		'addAttackCritMultiplier': 'increased attack crit multiplier',
		'addSpellCritChance': 'increased spell crit chance',
		'addSpellCritMultiplier': 'increased spell crit multiplier',
		'magicFind': 'increased item quality',
		'itemQuantity': 'increased item quantity',
		'sprintChance': 'sprint chance',
		'dmgPercent': 'to all damage',
		'allAttributes': 'to all attributes',
		'xpIncrease': 'additional xp per kill',
		'lvlRequire': 'level requirement reduction',

		'elementArcanePercent': 'increased arcane damage',
		'elementFrostPercent': 'increased frost damage',
		'elementFirePercent': 'increased fire damage',
		'elementHolyPercent': 'increased holy damage',
		'elementPoisonPercent': 'increased poison damage',

		'elementAllResist': 'all resistance',
		'elementArcaneResist': 'arcane resistance',
		'elementFrostResist': 'frost resistance',
		'elementFireResist': 'fire resistance',
		'elementHolyResist': 'holy resistance',
		'elementPoisonResist': 'poison resistance',
		'elementAllResist': 'all resistance',

		'attackSpeed': 'attack speed',
		'castSpeed': 'cast speed',

		//This stat is used for gambling when you can't see the stats
		'stats': 'stats',

		//Fishing
		'weight': 'lb',
		//Rods
		'catchChance': 'extra catch chance',
		'catchSpeed': 'faster catch speed',
		'fishRarity': 'higher fish rarity',
		'fishWeight': 'increased fish weight',
		'fishItems': 'extra chance to hook items'
	};

	return {
		translate: function (stat) {
			return stats[stat];
		}
	};
});
