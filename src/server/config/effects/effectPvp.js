define([

], function (

) {
	return {
		type: 'pvp',

		team: null,
		persist: true,

		save: function () {
			return {
				type: 'pvp',
				team: this.team,
				ttl: this.ttl
			};
		}
	};
});
