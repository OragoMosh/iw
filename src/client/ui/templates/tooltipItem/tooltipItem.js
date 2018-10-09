define([
	'js/system/events',
	'css!ui/templates/tooltipItem/styles',
	'html!ui/templates/tooltipItem/template',
	'html!ui/templates/tooltipItem/templateTooltip',
	'js/misc/statTranslations',
	'js/input'
], function (
	events,
	styles,
	template,
	tplTooltip,
	statTranslations,
	input
) {
	let percentageStats = [
		'addCritChance',
		'addCritMultiplier',
		'addAttackCritChance',
		'addAttackCritMultiplier',
		'addSpellCritChance',
		'addSpellCritMultiplier',
		'sprintChance',
		'xpIncrease',
		'blockAttackChance',
		'blockSpellChance',
		'dodgeAttackChance',
		'dodgeSpellChance',
		'attackSpeed',
		'castSpeed',
		'itemQuantity',
		'magicFind',
		'catchChance',
		'catchSpeed',
		'fishRarity',
		'fishWeight',
		'fishItems'
	];

	return {
		tpl: template,
		type: 'tooltipItem',

		tooltip: null,
		item: null,

		postRender: function () {
			this.tooltip = this.el.find('.tooltip');

			this.onEvent('onShowItemTooltip', this.onShowItemTooltip.bind(this));
			this.onEvent('onHideItemTooltip', this.onHideItemTooltip.bind(this));
		},

		getCompareItem: function (msg) {
			let item = msg.item;
			let items = window.player.inventory.items;

			let compare = null;
			if (item.slot) {
				compare = items.find(i => i.eq && i.slot === item.slot);

				// check special cases for mismatched weapon/offhand scenarios (only valid when comparing)
				if (!compare) {
					let equippedTwoHanded = items.find(i => i.eq && i.slot === 'twoHanded');
					let equippedOneHanded = items.find(i => i.eq && i.slot === 'oneHanded');
					let equippedOffhand = items.find(i => i.eq && i.slot === 'offHand');

					if (item.slot === 'twoHanded') {
						if (!equippedOneHanded) 
							compare = equippedOffhand;
						else if (!equippedOffhand) 
							compare = equippedOneHanded;
						else {
							// compare against oneHanded and offHand combined by creating a virtual item that is the sum of the two
							compare = $.extend(true, {}, equippedOneHanded);
							compare.refItem = equippedOneHanded;

							for (let s in equippedOffhand.stats) {
								if (!compare.stats[s])
									compare.stats[s] = 0;

								compare.stats[s] += equippedOffhand.stats[s];
							}
						}
					}

					if (item.slot === 'oneHanded') 
						compare = equippedTwoHanded;

					// this case is kind of ugly, but we don't want to go in when comparing an offHand to (oneHanded + empty offHand) - that should just use the normal compare which is offHand to empty
					if ((item.slot === 'offHand') && (equippedTwoHanded)) {
						// since we're comparing an offhand to an equipped Twohander, we need to clone the 'spell' values over (setting damage to zero) so that we can properly display how much damage
						// the player would lose by switching to the offhand (which would remove the twoHander)
						// keep a reference to the original item for use in onHideToolTip
						let spellClone = $.extend(true, {}, equippedTwoHanded.spell);
						spellClone.name = '';
						spellClone.values.damage = 0;

						let clone = $.extend(true, {}, item, {
							spell: spellClone
						});
						clone.refItem = item;
						msg.item = clone;

						compare = equippedTwoHanded;
					}
				}
			}

			msg.compare = compare;
		},

		onHideItemTooltip: function (item) {
			if (
				(!this.item) ||
				(
					(this.item !== item) &&
					(this.item.refItem) &&
					(this.item.refItem !== item)
				)
			)
				return;

			this.item = null;
			this.tooltip.hide();
		},

		onShowItemTooltip: function (item, pos, canCompare, bottomAlign) {
			const shiftDown = input.isKeyDown('shift', true);

			let msg = {
				item: item,
				compare: null
			};
			this.getCompareItem(msg);

			this.item = item = msg.item;
			let compare = canCompare ? msg.compare : null;

			let tempStats = $.extend(true, {}, item.stats);
			let enchantedStats = item.enchantedStats || {};

			if (compare && shiftDown) {
				if (!item.eq) {
					let compareStats = compare.stats;
					for (let s in tempStats) {
						if (compareStats[s]) {
							let delta = tempStats[s] - compareStats[s];
							if (delta > 0)
								tempStats[s] = '+' + delta;
							else if (delta < 0)
								tempStats[s] = delta;
						} else
							tempStats[s] = '+' + tempStats[s];
					}
					for (let s in compareStats) {
						if (!tempStats[s]) 
							tempStats[s] = -compareStats[s];
					}
				}
			} else {
				Object.keys(tempStats).forEach(function (s) {
					if (enchantedStats[s]) {
						tempStats[s] -= enchantedStats[s];
						if (tempStats[s] <= 0)
							delete tempStats[s];

						tempStats['_' + s] = enchantedStats[s];
					}
				});
			}

			let stats = Object.keys(tempStats)
				.map(function (s) {
					let isEnchanted = (s[0] === '_');
					let statName = s;
					if (isEnchanted)
						statName = statName.substr(1);

					let value = this.getStatValue(statName, tempStats[s]);
					statName = statTranslations.translate(statName);

					let row = value + ' ' + statName;
					let rowClass = '';

					if (compare) {
						if (row.indexOf('-') > -1)
							rowClass = 'loseStat';
						else if (row.indexOf('+') > -1)
							rowClass = 'gainStat';
					}
					if (isEnchanted)
						rowClass += ' enchanted';

					row = '<div class="' + rowClass + '">' + row + '</div>';

					return row;
				}, this)
				.sort(function (a, b) {
					return (a.replace(' enchanted', '').length - b.replace(' enchanted', '').length);
				})
				.sort(function (a, b) {
					if ((a.indexOf('enchanted') > -1) && (b.indexOf('enchanted') === -1))
						return 1;
					else if ((a.indexOf('enchanted') === -1) && (b.indexOf('enchanted') > -1))
						return -1;
					return 0;
				})
				.join('');

			let implicitStats = (item.implicitStats || []).map(function (s) {
				let stat = s.stat;

				let value = this.getStatValue(stat, s.value);
				let statName = statTranslations.translate(stat);

				let row = value + ' ' + statName;
				let rowClass = '';
				row = '<div class="' + rowClass + '">' + row + '</div>';

				return row;
			}).join('');

			let itemName = item.name;
			if (item.quantity > 1)
				itemName += ' x' + item.quantity;

			let level = null;
			if (item.level)
				level = item.level.push ? item.level[0] + ' - ' + item.level[1] : item.level;

			let html = tplTooltip
				.replace('$NAME$', itemName)
				.replace('$QUALITY$', item.quality)
				.replace('$TYPE$', item.type)
				.replace('$SLOT$', item.slot)
				.replace('$IMPLICITSTATS$', implicitStats)
				.replace('$STATS$', stats)
				.replace('$LEVEL$', level);

			if (item.requires && item.requires[0]) {
				html = html
					.replace('$ATTRIBUTE$', item.requires[0].stat)
					.replace('$ATTRIBUTEVALUE$', item.requires[0].value);
			}

			if (item.power)
				html = html.replace('$POWER$', ' ' + (new Array(item.power + 1)).join('+'));

			if ((item.spell) && (item.spell.values)) {
				let abilityValues = '';
				for (let p in item.spell.values) {
					if ((compare) && (shiftDown)) {
						let delta = item.spell.values[p] - compare.spell.values[p];
						// adjust by EPSILON to handle float point imprecision, otherwise 3.15 - 2 = 1.14 or 2 - 3.15 = -1.14
						// have to move away from zero by EPSILON, not a simple add
						if (delta >= 0) 
							delta += Number.EPSILON;
						else 
							delta -= Number.EPSILON;
						
						delta = ~~((delta) * 100) / 100;
						let rowClass = '';
						if (delta > 0) {
							rowClass = 'gainDamage';
							delta = '+' + delta;
						} else if (delta < 0) 
							rowClass = 'loseDamage';
						
						abilityValues += '<div class="' + rowClass + '">' + p + ': ' + delta + '</div>';
					} else 
						abilityValues += p + ': ' + item.spell.values[p] + '<br/>';
				}
				if (!item.ability)
					abilityValues = abilityValues;
				html = html.replace('$DAMAGE$', abilityValues);
			}

			let tooltip = this.tooltip;

			tooltip.html(html);

			if (!item.level)
				tooltip.find('.level').hide();
			else
				tooltip.find('.level').show();

			if (!item.implicitStats)
				tooltip.find('.implicitStats').hide();
			else
				tooltip.find('.implicitStats').show();

			if (!item.requires) {
				if (!item.level)
					tooltip.find('.requires').hide();
				else
					tooltip.find('.requires .stats').hide();
			} else
				tooltip.find('.requires .stats').show();

			if (!stats.length)
				tooltip.children('.stats').hide();

			if ((!item.type) || (item.type === item.name))
				tooltip.find('.type').hide();
			else {
				tooltip.find('.type')
					.html(item.type)
					.show();
			}

			if (item.power)
				tooltip.find('.power').show();

			let equipErrors = window.player.inventory.equipItemErrors(item);
			equipErrors.forEach(function (e) {
				tooltip.find('.requires').addClass('high-level');
				tooltip.find('.requires .' + e).addClass('high-level');
			}, this);

			if ((item.material) || (item.quest)) {
				tooltip.find('.level').hide();
				tooltip.find('.info').hide();

				if (item.material)
					tooltip.find('.material').show();
				else if (item.quest)
					tooltip.find('.quest').show();
			} else if (item.eq)
				tooltip.find('.info').hide();

			if (!item.ability) 
				tooltip.find('.damage').hide();
			else
				tooltip.find('.info').hide();

			if (item.spell) {
				tooltip.find('.spellName')
					.html(item.spell.name)
					.addClass('q' + item.spell.quality)
					.show();
				tooltip.find('.damage')
					.show();
				if (item.ability)
					tooltip.find('.spellName').hide();
			} else
				tooltip.find('.spellName').hide();

			tooltip.find('.worth').html(item.worthText ? ('<br />value: ' + item.worthText) : '');

			if (item.effects && item.effects[0].text && item.type !== 'mtx') {
				let htmlEffects = '';

				item.effects.forEach(function (e, i) {
					htmlEffects += e.text;
					if (i < item.effects.length - 1)
						htmlEffects += '<br />';
				});

				this.find('.effects')
					.html(htmlEffects)
					.show();
			} else if (item.description) {
				this.find('.effects')
					.html(item.description)
					.show();
			} else
				this.find('.effects').hide();

			if (item.type === 'Reward Card') {
				this.find('.spellName')
					.html('Set Size: ' + item.setSize)
					.show();
			}

			if (item.factions) {
				let htmlFactions = '';

				item.factions.forEach(function (f, i) {
					let htmlF = f.name + ': ' + f.tierName;
					if (f.noEquip)
						htmlF = '<font class="color-red">' + htmlF + '</font>';

					htmlFactions += htmlF;
					if (i < item.factions.length - 1)
						htmlFactions += '<br />';
				});

				this.find('.faction')
					.html(htmlFactions)
					.show();
			} else
				this.find('.faction').hide();

			if (shiftDown || !compare)
				tooltip.find('.info').hide();

			if (item.cd) {
				tooltip.find('.info')
					.html('cooldown: ' + item.cd)
					.show();
			} else if (item.uses) {
				tooltip.find('.info')
					.html('uses: ' + item.uses)
					.show();
			}

			this.tooltip
				.show();

			if (pos) {
				if (bottomAlign)
					pos.y -= this.tooltip.height();

				this.tooltip.css({
					left: pos.x,
					top: pos.y
				});
			}

			events.emit('onBuiltItemTooltip', this.tooltip);
		},

		getStatValue: function (statName, statValue) {
			let res = statValue;
			if (statName.indexOf('CritChance') > -1)
				res = res / 20;

			if (percentageStats.includes(statName) || (statName.indexOf('element') === 0 && statName.indexOf('Resist') === -1))
				res += '%';

			return res;
		},

		showWorth: function (canAfford) {
			this.tooltip.find('.worth').show();

			if (!canAfford)
				this.tooltip.find('.worth').addClass('no-afford');
		}
	};
});
