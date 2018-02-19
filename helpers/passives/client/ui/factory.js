define([
	'ui/uiBase',
	'js/events'
], function (
	uiBase,
	events
) {
	return {
		uis: [],
		root: '',

		init: function (root) {
			if (root)
				this.root = root + '/';

			events.on('onKeyDown', this.events.onKeyDown.bind(this));
		},

		build: function (type, options) {
			var className = 'ui' + type[0].toUpperCase() + type.substr(1);
			var el = $('.' + className);
			if (el.length > 0)
				return;

			this.getTemplate(type, options);
			$(window).on('resize', this.onResize.bind(this));
		},

		getTemplate: function (type, options) {
			require([this.root + 'ui/templates/' + type + '/' + type], this.onGetTemplate.bind(this, options));
		},

		onGetTemplate: function (options, template) {
			var ui = _.create(uiBase, template);
			ui.setOptions(options);
			ui.render();
			ui.el.data('ui', ui);

			this.uis.push(ui);

			if ((options) && (options.onDone))
				options.onDone(ui);
		},

		onResize: function () {
			this.uis.forEach(function (ui) {
				if (ui.centered)
					ui.center();
				else if ((ui.centeredX) || (ui.centeredY))
					ui.center(ui.centeredX, ui.centeredY);
			}, this);
		},

		update: function () {
			var uis = this.uis;
			var uLen = uis.length;
			for (var i = 0; i < uLen; i++) {
				var u = uis[i];
				if (u.update)
					u.update();
			}
		},

		events: {
			onKeyDown: function (key) {
				if (key == 'esc') {
					this.uis.forEach(function (u) {
						if (!u.modal)
							return;

						u.destroy();
					});
					$('.uiOverlay').hide();
				}
			}
		}
	};
});
