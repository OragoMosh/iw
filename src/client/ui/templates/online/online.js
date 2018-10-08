define([
	'js/system/events',
	'js/system/client',
	'js/system/globals',
	'html!ui/templates/online/template',
	'css!ui/templates/online/styles',
	'html!ui/templates/online/templateListItem'
], function (
	events,
	client,
	globals,
	template,
	styles,
	templateListItem
) {
	return {
		tpl: template,
		centered: true,

		onlineList: [],
		blockedList: [],

		modal: true,

		postRender: function () {
			globals.onlineList = this.onlineList;

			this.onEvent('onGetConnectedPlayer', this.onGetConnectedPlayer.bind(this));
			this.onEvent('onGetDisconnectedPlayer', this.onGetDisconnectedPlayer.bind(this));

			this.onEvent('onGetBlockedPlayers', this.onGetBlockedPlayers.bind(this));

			this.onEvent('onKeyDown', this.onKeyDown.bind(this));
			this.onEvent('onShowOnline', this.toggle.bind(this));
		},

		onGetBlockedPlayers: function (list) {
			this.blockedPlayers = list;
		},

		onKeyDown: function (key) {
			if (key === 'o')
				this.toggle();
		},

		toggle: function () {
			this.shown = !this.el.is(':visible');

			if (this.shown) {
				this.show();
				this.build();
			} else
				this.hide();
		},

		onGetConnectedPlayer: function (list) {
			if (!list.length)
				list = [list];

			let onlineList = this.onlineList;

			list.forEach(function (l) {
				let exists = onlineList.find(function (o) {
					return (o.name === l.name);
				});
				if (exists)
					$.extend(true, exists, l);
				else
					onlineList.push(l);
			});

			onlineList
				.sort(function (a, b) {
					if (a.level === b.level) {
						if (a.name > b.name)
							return 1;
						return -1;
					} return b.level - a.level;
				});

			if (this.shown)
				this.build();
		},

		onGetDisconnectedPlayer: function (playerName) {
			let onlineList = this.onlineList;

			onlineList.spliceWhere(function (o) {
				return (o.name === playerName);
			});

			if (this.shown)
				this.build();
		},

		build: function () {
			let container = this.el.find('.list');
			container
				.children(':not(.heading)')
				.remove();

			this.onlineList.forEach(function (l) {
				let html = templateListItem
					.replace('$NAME$', l.name)
					.replace('$LEVEL$', l.level)
					.replace('$CLASS$', l.class);

				$(html)
					.appendTo(container)
					.on('contextmenu', this.showContext.bind(this, l));
			}, this);
		},

		showContext: function (char, e) {
			if (char.name !== window.player.name) {
				let isBlocked = this.blockedPlayers.includes(char.name);
				events.emit('onContextMenu', [{
					text: 'invite to party',
					callback: this.invite.bind(this, char.id)
				}, {
					text: 'whisper',
					callback: events.emit.bind(events, 'onDoWhisper', char.name)
				}, {
					text: isBlocked ? 'unblock' : 'block',
					callback: this.block.bind(this, char.name)
				}], e);
			}

			e.preventDefault();
			return false;
		},

		block: function (charName) {
			let isBlocked = this.blockedPlayers.includes(charName);
			let method = isBlocked ? 'unblock' : 'block';

			client.request({
				cpn: 'social',
				method: 'chat',
				data: {
					message: `/${method} ${charName}`
				}
			});
		},

		invite: function (charId) {
			this.hide();

			client.request({
				cpn: 'social',
				method: 'getInvite',
				id: charId
			});
		}
	};
});
