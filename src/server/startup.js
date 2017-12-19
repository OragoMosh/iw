define([
	'globals',
	'server',
	'world/atlas',
	'components/components',
	'leaderboard/leaderboard',
	'security/io',
	'misc/mods',
	'mtx/mtx',
	'config/animations',
	'config/skins',
	'config/factions',
	'config/classes',
	'config/spellsConfig',
	'config/spells',
	'items/config/types'
], function (
	globals,
	server,
	atlas,
	components,
	leaderboard,
	io,
	mods,
	mtx,
	animations,
	skins,
	factions,
	classes,
	spellsConfig,
	spells,
	itemTypes
) {
	return {
		init: function () {
			io.init(this.onDbReady.bind(this));
		},

		onDbReady: function () {
			setInterval(function () {
				global.gc();
			}, 60000);

			animations.init();
			mods.init(this.onModsLoaded.bind(this));
		},
		onModsLoaded: function () {
			globals.init();
			classes.init();
			spellsConfig.init();
			spells.init();
			itemTypes.init();
			components.init(this.onComponentsReady.bind(this));
		},
		onComponentsReady: function () {
			skins.init();
			factions.init();
			server.init(this.onServerReady.bind(this));
		},
		onServerReady: function () {
			atlas.init();
			leaderboard.init();
		}
	};
});
