define([
	'js/system/events',
	'js/system/client',
	'html!ui/templates/smithing/template',
	'css!ui/templates/smithing/styles',
	'html!/ui/templates/smithing/templateItem',
	'js/misc/statTranslations'
], function (
	events,
	client,
	template,
	styles,
	templateItem,
	statTranslations
) {
	return {
		tpl: template,

		centered: true,

		modal: true,

		eventCloseInv: null,

		hoverItem: null,
		item: null,

		action: 'augment',

		postRender: function () {
			this.onEvent('onShowSmithing', this.toggle.bind(this));
			this.onEvent('onKeyDown', this.onKey.bind(this, true));
			this.onEvent('onKeyUp', this.onKey.bind(this, false));

			this.find('.item-picker').on('click', this.openInventory.bind(this));
			this.find('.actionButton').on('click', this.smith.bind(this));

			//If we don't listen to these events, they'll be queued
			this.onEvent('onHideInventory', () => {});
			this.onEvent('beforeInventoryClickItem', () => {});

			this.onEvent('onGetItems', this.onGetItems.bind(this));
			this.onEvent('onSetSmithItem', this.onHideInventory.bind(this));

			this.find('.col-btn').on('click', this.clickAction.bind(this));
		},

		clickAction: function (e) {
			let el = $(e.target);
			this.find('.col-btn').removeClass('selected');

			let action = el.attr('action');
			let changed = (action !== this.action);
			this.action = action;

			el.addClass('selected');

			if (this.item && changed)
				this.getMaterials(this.item);
		},

		smith: function () {
			this.setDisabled(true);

			client.request({
				cpn: 'player',
				method: 'performAction',
				data: {
					cpn: 'inventory',
					method: 'enchantItem',
					data: {
						itemId: this.item.id,
						action: this.action
					}
				},
				callback: this.onSmith.bind(this, this.item)
			});
		},

		onSmith: function (item, result) {
			this.setDisabled(false);

			let msg = {
				msg: 'Item Enhancement Succeeded',
				type: 'success',
				zIndex: 9999999,
				top: 100
			};
			if (this.action === 'reroll')
				msg.msg = 'Item Reroll Succeeded';
			else if (this.action === 'relevel')
				msg.msg = 'Item Relevel Succeeded';
			else if (this.action === 'reslot')
				msg.msg = 'Item Reslot Succeeded';

			result.addStatMsgs.forEach(a => {
				let statName = statTranslations.translate(a.stat);
				msg.msg += `<br />${(a.value > 0) ? '+' : ''}${a.value} ${statName}`;
			});

			events.emit('onGetAnnouncement', msg);

			if (result.item)
				this.item = result.item;

			this.getMaterials(this.item);

			let augment = this.find('[action="augment"]').addClass('disabled');
			if ((result.item.power || 0) < 3)
				augment.removeClass('disabled');
			else if (this.action === 'augment')
				this.find('[action="reroll"]').click();
		},

		openInventory: function () {
			this.eventCloseInv = this.onEvent('onHideInventory', this.onHideInventory.bind(this));
			this.eventClickInv = this.onEvent('beforeInventoryClickItem', this.onHideInventory.bind(this));

			events.emit('onShowInventory');
			this.el.hide();
		},

		onHideInventory: function (msg) {
			if (msg)
				msg.success = false;

			if (!msg || !msg.item) {
				this.offEvent(this.eventCloseInv);
				this.offEvent(this.eventClickInv);

				return;
			} else if (!msg.item.slot || msg.item.noAugment) {
				let resultMsg = {
					msg: 'Incorrect Item Type',
					type: 'failure',
					zIndex: 9999999,
					top: 180
				};
				events.emit('onGetAnnouncement', resultMsg);

				return;
			} else if (msg.item.eq) {
				let resultMsg = {
					msg: 'Cannot augment equipped items',
					type: 'failure',
					zIndex: 9999999,
					top: 180
				};
				events.emit('onGetAnnouncement', resultMsg);

				return;
			}

			this.find('.selected').removeClass('selected');
			this.find('[action="augment"]').addClass('selected');
			this.action = 'augment';

			let augment = this.find('[action="augment"]').addClass('disabled');
			if ((msg.item.power || 0) < 3)
				augment.removeClass('disabled');

			let reforge = this.find('[action="reforge"]').addClass('disabled');
			if (msg.item.spell)
				reforge.removeClass('disabled');

			let reslot = this.find('[action="reslot"]').addClass('disabled');
			if (!msg.item.effects)
				reslot.removeClass('disabled');

			let relevel = this.find('[action="relevel"]').addClass('disabled');
			if (msg.item.slot !== 'tool')
				relevel.removeClass('disabled');

			this.offEvent(this.eventClickInv);

			$('.uiInventory').data('ui').toggle();

			this.el.show();

			msg.success = false;

			if (!msg || !msg.item || !msg.item.slot || msg.item.eq)
				return;

			this.item = msg.item;

			this.getMaterials(msg.item);
		},

		getMaterials: function (item) {
			this.setDisabled(true);

			client.request({
				cpn: 'player',
				method: 'performAction',
				data: {
					cpn: 'inventory',
					method: 'getEnchantMaterials',
					data: {
						itemId: item.id,
						action: this.action
					}
				},
				callback: this.onGetMaterials.bind(this, item)
			});
		},

		onGetMaterials: function (item, result) {
			this.find('.item').remove();
			this.drawItem(this.find('.item-picker'), item);

			this.find('.actionButton').removeClass('disabled').addClass('disabled');

			if (result.materials) {
				let material = result.materials[0];
				if (material) {
					let hasMaterials = window.player.inventory.items.find(i => i.name === material.name);
					if (hasMaterials) {
						material.quantityText = hasMaterials.quantity + '/' + material.quantity;
						hasMaterials = hasMaterials.quantity >= material.quantity;
					} else {
						if (!material.quantityText)
							material.quantityText = '';
						material.quantityText += '0/' + material.quantity;
					}

					if (hasMaterials)
						this.find('.actionButton').removeClass('disabled');

					this.drawItem(this.find('.material'), material, !hasMaterials);
				}
			}

			this.setDisabled(false);
		},

		onGetItems: function (items) {
			let elMaterial = this.find('.material .item');
			if (!elMaterial.length)
				return;

			let itemMaterial = elMaterial.data('item');
			let elQuantity = elMaterial.find('.quantity');
			let invMaterial = items.find(i => i.name === itemMaterial.name) || { quantity: 0 };
			
			let newText = elQuantity.html().split('/');
			newText = invMaterial.quantity + '/' + newText[1];
			elQuantity.html(newText);

			let elButton = this.find('.actionButton').removeClass('disabled');
			if (invMaterial.quantity < newText[1]) {
				elButton.addClass('disabled');
				elQuantity.addClass('red');
			}
		},

		drawItem: function (container, item, redQuantity) {
			container.find('.icon').hide();

			let imgX = -item.sprite[0] * 64;
			let imgY = -item.sprite[1] * 64;

			let spritesheet = item.spritesheet || '../../../images/items.png';
			if (item.material)
				spritesheet = '../../../images/materials.png';
			else if (item.quest)
				spritesheet = '../../../images/questItems.png';
			else if (item.type === 'consumable')
				spritesheet = '../../../images/consumables.png';

			let el = $(templateItem)
				.appendTo(container);

			el
				.data('item', item)
				.on('mousemove', this.onHover.bind(this, el, item))
				.on('mouseleave', this.hideTooltip.bind(this, el, item))
				.find('.icon')
				.css('background', 'url(' + spritesheet + ') ' + imgX + 'px ' + imgY + 'px');

			if (item.quantity) {
				let quantityText = item.quantityText;
				el.find('.quantity').html(quantityText);
				if (redQuantity)
					el.find('.quantity').addClass('red');
			}
		},

		onHover: function (el, item, e) {
			if (item)
				this.hoverItem = item;
			else
				item = this.hoverItem;

			let ttPos = null;

			if (el) {
				ttPos = {
					x: ~~(e.clientX + 32),
					y: ~~(e.clientY)
				};
			}

			events.emit('onShowItemTooltip', item, ttPos, true);
		},

		hideTooltip: function (el, item, e) {
			events.emit('onHideItemTooltip', this.hoverItem);
			this.hoverItem = null;
		},

		beforeHide: function () {
			this.item = null;
			this.offEvent(this.eventCloseInv);
			this.offEvent(this.eventClickInv);
		},

		toggle: function () {
			this.shown = !this.el.is(':visible');

			if (this.shown) {
				this.find('.item').remove();
				this.find('.icon').show();
				this.find('.actionButton').removeClass('disabled').addClass('disabled');
				this.show();
			} else 
				this.hide();
		},

		onKey: function (isDown, key) {
			if (isDown && key === 'm')
				this.toggle();
			else if (key === 'shift' && this.hoverItem)
				this.onHover();
		}
	};
});
