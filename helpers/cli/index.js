const fs = require('fs');
const exec = require('child_process').exec;
let client = require('./client');

let startup = {
	init: async function (cmd, pars) {
		if (['uptime'].indexOf(cmd) > -1) 
			await client.init(pars);

		await this[cmd](pars);

		process.exit();
	},

	uptime: async function (serverName) {
		let output = await client.execCommands([
			'forever list --no-colors'
		]);

		output = output
			.split('\n')
			.pop()
			.split(' ')
			.pop()
			.split(':');

		console.log([
			'D',
			'H',
			'M',
			'S'
		].map((m, i) => output[i] + m).join(' '));
	},

	getLog: async function (serverName) {
		const targetFilename = `./downloads/${serverName}Log.log`;

		await client.downloadFile(serverName, '.forever/isleward.log', targetFilename);

		let contents = fs
			.readFileSync(targetFilename)
			.toString()
			.split('\n')
			.filter(c => {
				return (
					(
						c.indexOf('Error Logged:') > -1 ||
						c.indexOf('ERR_IPC_CHANNEL_CLOSED') > -1 ||
						c.indexOf('ForbiddenError: Forbidden') > -1 ||
						(
							c.indexOf('    at ') > -1 &&
							c.indexOf('/src/') > -1
						)
					) &&
					c.indexOf('node_modules') === -1
				);
			})
			.map(c => {
				let res = c
					.replace('Error Logged: ', '\n')
					.replace(' UnhandledPromiseRejectionWarning: Error [ERR_IPC_CHANNEL_CLOSED]: channel closed', 'Channel Closed')
					.replace(')', '')
					.replace('(node:', '\n')
					.replace('ForbiddenError: ', '\n');

				res = res.split('/src/server/');
				res = (res.length > 1) ? res[1] : res[0];

				return res;
			});

		fs.writeFileSync(targetFilename, contents.join('\n'));

		exec(`"C:/Program Files/Sublime Text 3/sublime_text.exe" ${targetFilename}`);
	}
};

let args = process.argv;
startup.init(args[2], args[3]);
