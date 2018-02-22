define([
	'fs',
	'misc/events',
	'util'
], function (
	fs,
	events,
	util
) {
	var cbDone = cbDone;

	return {
		waiting: {},

		init: function (_cbDone) {
			cbDone = _cbDone;
			var json = JSON.parse(fs.readFileSync('mods.json', 'utf8'));

			json.modList.forEach(function (m) {
				this.waiting[m] = 0;
				require([m], this.onGetMod.bind(this, m));
			}, this);
		},

		onGetMod: function (name, mod) {
			mod.events = events;
			mod.folderName = 'server/node_modules/' + name;
			mod.relativeFolderName = 'node_modules/' + name;

			var list = (mod.extraScripts || []);
			var lLen = list.length;
			this.waiting[name] = lLen;

			for (var i = 0; i < lLen; i++) {
				require(['node_modules/' + name + '/' + list[i]], this.onGetExtra.bind(this, name, mod));;
			}

			if (this.waiting[name] == 0) {
				mod.init();
				delete this.waiting[name];

				if (Object.keys(this.waiting).length == 0)
					cbDone();
			}
		},

		onGetExtra: function (name, mod, extra) {
			extra.folderName = 'server/node_modules/' + name;

			this.waiting[name]--;
			if (this.waiting[name] == 0) {
				mod.init();
				delete this.waiting[name];

				if (Object.keys(this.waiting).length == 0)
					cbDone();
			}
		}
	};
});
