define([
	'js/system/events'
], function (
	events
) {
	return {
		type: 'social',

		customChannels: null,
		blockedPlayers: null,

		init: function (blueprint) {
			if (this.customChannels)
				events.emit('onGetCustomChatChannels', this.customChannels);

			if (blueprint.blockedPlayers) {
				this.blockedList = blueprint.blockedList;
				events.emit('onGetBlockedPlayers', this.blockedPlayers);
			}
		}
	};
});
