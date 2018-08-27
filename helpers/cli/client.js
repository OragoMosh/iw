let client = require('scp2');
let clone = require('../../src/server/misc/clone.js');

module.exports = {
	exec: async function (options) {
		let config = clone({}, {
			host: 'ptr.isleward.com',
		    username: 'isleward',
		    privateKey: key,
		    path: '/home/admin/file.txt'
		}, options);

		client.scp(config, './', this.onError.bind(this));
	},

	error: function (err) {

	}
};
