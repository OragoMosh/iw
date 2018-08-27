const fs = require('fs');
const util = require('util');
const clientScp = require('scp2').scp;
const clientSsh = require('node-ssh');
const clone = require('../../src/server/misc/clone.js');

let key = fs.readFileSync('C:/Users/Shaun/.ssh/id_rsa').toString();

module.exports = {
	ssh: null,

	init: async function (server) {
		this.ssh = new clientSsh();

		await this.ssh.connect({
			host: `${server}.isleward.com`,
			username: 'isleward',
			port: 4194,
			privateKey: key
		});
	},

	downloadFile: async function (server, source, target) {
		let config = clone({}, {
			host: `${server}.isleward.com`,
			username: 'isleward',
			privateKey: key,
			port: 4194,
			path: source
		});

		await util.promisify(clientScp.scp)(config, target);
	},

	execCommands: async function (commands) {
		const cbExecCommand = this.execCommand.bind(this);

		return new Promise(async function (res) {
			let output = '';

			for (let command of commands) 
				output += await cbExecCommand(command);

			res(output);
		});
	},

	execCommand: async function (command) {
		return (await this.ssh.execCommand(command)).stdout;
	},

	onError: function (err) {

	}
};
