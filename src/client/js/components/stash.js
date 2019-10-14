define([
	'js/system/events'
], function (
	events
) {
	return {
		type: 'stash',

		active: false,

		tabs: null,
		items: null,

		init: function () {
			events.emit('onGetStashTabs', this.tabs);
			events.emit('onGetStashItems', this.items);
		},

		extend: function (blueprint) {
			if (blueprint.has('active'))
				this.active = blueprint.active;

			if (blueprint.getItems) {
				let items = this.items;
				let newItems = blueprint.getItems || [];
				let nLen = newItems.length;

				for (let i = 0; i < nLen; i++) {
					let nItem = newItems[i];
					let nId = nItem.id;

					let findItem = items.find(f => f.id === nId);
					if (findItem) {
						$.extend(true, findItem, nItem);

						newItems.splice(i, 1);
						i--;
						nLen--;
					}
				}

				this.items.push.apply(this.items, blueprint.getItems || []);

				events.emit('onGetStashItems', this.items);
			}

			if (blueprint.destroyItems) 
				events.emit('onDestroyStashItems', blueprint.destroyItems);
		}
	};
});
