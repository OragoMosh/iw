define([
	'js/system/events',
	'html!ui/templates/messages/template',
	'html!ui/templates/messages/tplTab',
	'css!ui/templates/messages/styles',
	'js/input',
	'js/system/client'
], function (
	events,
	template,
	tplTab,
	styles,
	input,
	client
) {
	return {
		tpl: template,

		currentFilter: 'info',

		messages: [],
		maxTtl: 500,

		maxChatLength: 255,

		hoverItem: null,

		hoverFilter: false,

		blockedPlayers: [],

		postRender: function () {
			this.onEvent('onGetMessages', this.onGetMessages.bind(this));
			this.onEvent('onDoWhisper', this.onDoWhisper.bind(this));
			this.onEvent('onJoinChannel', this.onJoinChannel.bind(this));
			this.onEvent('onLeaveChannel', this.onLeaveChannel.bind(this));
			this.onEvent('onGetCustomChatChannels', this.onGetCustomChatChannels.bind(this));
			this.onEvent('onGetBlockedPlayers', this.onGetBlockedPlayers.bind(this));

			this.find('input')
				.on('keydown', this.sendChat.bind(this))
				.on('input', this.checkChatLength.bind(this))
				.on('blur', this.toggle.bind(this, false, true));

			this
				.find('.filter:not(.channel)')
				.on('mouseover', this.onFilterHover.bind(this, true))
				.on('mouseleave', this.onFilterHover.bind(this, false))
				.on('click', this.onClickFilter.bind(this));

			this.onEvent('onKeyDown', this.onKeyDown.bind(this));
			this.onEvent('onKeyUp', this.onKeyUp.bind(this));
		},

		update: function () {
			if (this.el.hasClass('typing'))
				return;

			const time = new Date();
			let elTime = this.find('.time');
			const timeString = (
				'[ ' + 
				time.getUTCHours().toString().padStart(2, 0) + 
				':' + 
				time.getUTCMinutes().toString().padStart(2, 0) + 
				' ]'
			);
			if (elTime.html() !== timeString)
				elTime.html(timeString);
		},

		checkChatLength: function () {
			let textbox = this.find('input');
			let val = textbox.val();

			if (val.length <= this.maxChatLength)
				return;

			val = val.substr(0, this.maxChatLength);
			textbox.val(val);
		},

		onGetBlockedPlayers: function (list) {
			this.blockedPlayers = list;
		},

		onGetCustomChatChannels: function (channels) {
			channels.forEach(function (c) {
				this.onJoinChannel(c);
			}, this);
		},

		onJoinChannel: function (channel) {
			this.find('[filter="' + channel.trim() + '"]').remove();

			let container = this.find('.filters');
			$(tplTab)
				.appendTo(container)
				.addClass('channel')
				.attr('filter', channel.trim())
				.html(channel.trim())
				.on('mouseover', this.onFilterHover.bind(this, true))
				.on('mouseleave', this.onFilterHover.bind(this, false))
				.on('click', this.onClickFilter.bind(this));
		},

		onLeaveChannel: function (channel) {
			this.find('.filters [filter="' + channel + '"]').remove();
		},

		onFilterHover: function (hover) {
			this.hoverFilter = hover;
		},

		onClickFilter: function (e) {
			let el = $(e.target);
			el.toggleClass('active');

			let filter = el.attr('filter');
			let method = (el.hasClass('active') ? 'show' : 'hide');

			if (method === 'show')
				this.find('.list').addClass(filter);
			else
				this.find('.list').removeClass(filter);

			if (el.hasClass('channel')) 
				this.find('.list .' + filter)[method]();
		},

		onKeyDown: function (key) {
			if (key === 'enter')
				this.toggle(true);
			else if (key === 'shift')
				this.showItemTooltip();
		},

		onKeyUp: function (key) {
			if (key === 'shift')
				this.showItemTooltip();
		},

		onDoWhisper: function (charName) {
			this.toggle(true);
			let toName = charName;
			if (charName.indexOf(' ') > -1)
				toName = "'" + toName + "'";

			this.find('input').val('@' + toName + ' ');
		},

		onGetMessages: function (e) {
			let messages = e.messages;
			if (!messages.length)
				messages = [messages];

			let container = this.find('.list');

			messages.forEach(m => {
				let message = m.message;
				let source = message.split(':') + ': ';

				if (this.blockedPlayers.includes(m.source))
					return;

				if (m.item)
					message = source + '<span class="q' + (m.item.quality || 0) + '">' + message.replace(source, '') + '</span>';

				let el = $('<div class="list-message ' + m.class + '">' + message + '</div>')
					.appendTo(container);

				if (m.has('type'))
					el.addClass(m.type);
				else
					el.addClass('info');

				if (m.item) {
					el.find('span')
						.on('mousemove', this.showItemTooltip.bind(this, el, m.item))
						.on('mouseleave', this.hideItemTooltip.bind(this));
				}

				if (m.type) {
					let isChannel = (['info', 'chat', 'loot', 'rep'].indexOf(m.type) === -1);
					if (isChannel) {
						if (this.find('.filter[filter="' + m.type + '"]').hasClass('active'))
							el.show();
					}
				}

				this.messages.push({
					ttl: this.maxTtl,
					el: el
				});
			});

			container.scrollTop(9999999);
		},

		hideItemTooltip: function () {
			if (this.dragEl) {
				this.hoverCell = null;
				return;
			}

			events.emit('onHideItemTooltip', this.hoverItem);
			this.hoverItem = null;
		},

		showItemTooltip: function (el, item, e) {
			if (item)
				this.hoverItem = item;
			else
				item = this.hoverItem;

			if (!item)
				return;

			let ttPos = null;
			if (el) {
				ttPos = {
					x: ~~(e.clientX + 32),
					y: ~~(e.clientY)
				};
			}

			events.emit('onShowItemTooltip', item, ttPos, true, true);
		},

		toggle: function (show, isFake) {
			if ((isFake) && (this.hoverFilter))
				return;

			input.resetKeys();

			this.el.removeClass('typing');

			let textbox = this.find('input');

			if (show) {
				this.el.addClass('typing');
				textbox.focus();
				this.find('.list').scrollTop(9999999);
			} else 
				textbox.val('');
		},

		sendChat: function (e) {
			if (e.which === 27) {
				this.toggle(false);
				return;
			} else if (e.which !== 13)
				return; 

			if (!this.el.hasClass('typing')) {
				this.toggle(true);
				return;
			}

			let textbox = this.find('input');
			let val = textbox.val()
				.split('<')
				.join('&lt;')
				.split('>')
				.join('&gt;');

			textbox.blur();

			if (val.trim() === '')
				return;

			client.request({
				cpn: 'social',
				method: 'chat',
				data: {
					message: val
				}
			});
		}
	};
});
