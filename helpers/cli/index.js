let client = require('./client');

let startup = {
	init: async function (cmd, pars) {
		await this[cmd](pars);
	},

	downloadLog: async function (pars) {
		client.exec({

		});
	}
};

let args = process.argv;
startup.init(args[2], args[3]);
