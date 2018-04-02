define([
	'js/system/events',
	'js/system/client',
	'html!ui/templates/death/template',
	'css!ui/templates/death/styles'
], function (
	events,
	client,
	template,
	styles
) {
	return {
		tpl: template,

		modal: true,
		centered: true,

		postRender: function () {
			this.onEvent('onDeath', this.onDeath.bind(this));
			this.onEvent('onPermadeath', this.onPermadeath.bind(this));

			this.find('.btn-logout').on('click', this.onLogout.bind(this));
			this.find('.btn-respawn').on('click', this.onRespawn.bind(this));
		},

		onLogout: function () {
			$('.uiOptions').data('ui').charSelect();
		},

		onRespawn: function () {
			events.emit('onHideOverlay', this.el);
			this.hide();

			client.request({
				cpn: 'player',
				method: 'performAction',
				data: {
					cpn: 'stats',
					method: 'respawn'
				}
			});
		},

		doShow: function () {
			this.show();
			events.emit('onShowOverlay', this.el);
		},

		onDeath: function (event) {
			if (!event.source) {
				this.find('.msg').html('you are dead');
			} else
				this.find('.msg').html('you were killed by [ <div class="inner">' + event.source + '</div> ]');
			this.find('.penalty')
				.html('you lost ' + event.xpLoss + ' experience')
				.show();

			if (!event.xpLoss)
				this.find('.penalty').hide();

			this.el.removeClass('permadeath');
			this.doShow();
		},

		onPermadeath: function (event) {
			this.find('.msg').html('you were killed by [ <div class="inner">' + event.source + '</div> ]');
			this.el.addClass('permadeath');
			this.doShow();
		}
	};
});
