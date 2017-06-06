define([

], function(

) {
	return {
		name: 'Ranger Class',

		extraScripts: [
			
		],

		init: function() {
			this.events.on('onBeforeGetClasses', this.beforeGetClasses.bind(this));
			this.events.on('onBeforeGetSkins', this.beforeGetSkins.bind(this));
			this.events.on('onBeforeGetItemTypes', this.beforeGetItemTypes.bind(this));
			this.events.on('onBeforeGetSpellsInfo', this.beforeGetSpellsInfo.bind(this));
			this.events.on('onBeforeGetSpellsConfig', this.beforeGetSpellsConfig.bind(this));
			this.events.on('onBeforeGetSpellTemplate', this.beforeGetSpellTemplate.bind(this));
			this.events.on('onBeforeGetResourceList', this.beforeGetResourceList.bind(this));
		},

		beforeGetResourceList: function(list) {
			
		},

		beforeGetClasses: function(classes) {
			
		},

		beforeGetSpellTemplate: function(spell) {
			
		},

		beforeGetSkins: function(skins) {
			
		},

		beforeGetItemTypes: function(types) {
			
		},

		beforeGetSpellsConfig: function(spells) {
			
		},

		beforeGetSpellsInfo: function(spells) {
			
		}
	};
});