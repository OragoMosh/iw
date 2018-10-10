let max = Math.max.bind(Math);
let mathRandom = Math.random.bind(Math);

module.exports = {
	getDamage: function (config) {
		let srcValues = config.source.stats.values;
		let tgtValues = config.target.stats.values;

		let amount = config.damage;
		let blocked = false;
		let dodged = false;
		let isCrit = false;

		//Don't block heals
		if (!config.noMitigate) {
			let blockChance = config.isAttack ? tgtValues.blockAttackChance : tgtValues.blockSpellChance;
			if (mathRandom() * 100 < blockChance) {
				blocked = true;
				amount = 0;
			}

			if (!blocked) {
				let dodgeChance = config.isAttack ? tgtValues.dodgeAttackChance : tgtValues.dodgeSpellChance;
				if (mathRandom() * 100 < dodgeChance) {
					dodged = true;
					amount = 0;
				}
			}
		}

		if ((!blocked) && (!dodged)) {
			if (config.statType) {
				let statValue = 0;
				let statType = config.statType;
				if (!(statType instanceof Array))
					statType = [statType];

				statType.forEach(function (s) {
					statValue += srcValues[s];
				});

				statValue = max(1, statValue);
				let statMult = config.statMult || 1;

				amount *= statValue * statMult;
			}

			let dmgPercent = 100 + (srcValues.dmgPercent || 0);	

			if (config.element) {
				let elementName = 'element' + config.element[0].toUpperCase() + config.element.substr(1);
				dmgPercent += (srcValues[elementName + 'Percent'] || 0);
				dmgPercent += srcValues.elementPercent || 0;

				if (!config.isAttack)
					dmgPercent += srcValues.spellPercent || 0;

				//Don't mitigate heals
				if (!config.noMitigate) {
					let resist = tgtValues.elementAllResist + (tgtValues[elementName + 'Resist'] || 0);
					amount *= max(0.5 + max((1 - (resist / 100)) / 2, -0.5), 0.5);
				}
			} else if (!config.noMitigate) {
				dmgPercent += srcValues.physicalPercent || 0;
				amount *= max(0.5 + max((1 - ((tgtValues.armor || 0) / (srcValues.level * 50))) / 2, -0.5), 0.5);
			}

			amount *= (dmgPercent / 100);

			if (!config.noCrit) {
				let critChance = srcValues.critChance;
				critChance += (config.isAttack) ? srcValues.attackCritChance : srcValues.spellCritChance;

				let critMultiplier = srcValues.critMultiplier;
				critMultiplier += (config.isAttack) ? srcValues.attackCritMultiplier : srcValues.spellCritMultiplier;

				if ((config.crit) || (mathRandom() * 100 < critChance)) {
					isCrit = true;
					amount *= (critMultiplier / 100);
				}
			}
		}

		amount = 0.001;

		return {
			amount: amount,
			blocked: blocked,
			dodged: dodged,
			crit: isCrit,
			element: config.element
		};
	}
};
