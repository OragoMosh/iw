let roles = require('../config/roles');
let events = require('../misc/events');

module.exports = {
	type: 'social',

	isPartyLeader: null,
	partyLeaderId: null,
	party: null,

	customChannels: null,
	blockedPlayers: [],

	messageHistory: [],

	maxChatLength: 255,

	init: function (blueprint) {
		this.obj.extendComponent('social', 'socialCommands', {});
	},

	simplify: function (self) {
		return {
			type: 'social',
			party: this.party,
			customChannels: self ? this.customChannels : null,
			blockedPlayers: self ? this.blockedPlayers : null,
			muted: this.muted
		};
	},

	save: function () {
		return {
			type: 'social',
			customChannels: this.customChannels,
			blockedPlayers: this.blockedPlayers,
			muted: this.muted
		};
	},

	sendMessage: function (msg, color, target) {
		(target || this.obj).socket.emit('event', {
			event: 'onGetMessages',
			data: {
				messages: [{
					class: color || 'q0',
					message: msg,
					type: 'chat'
				}]
			}
		});
	},

	sendPartyMessage: function (msg) {
		if (!this.party) {
			this.obj.socket.emit('events', {
				onGetMessages: [{
					messages: [{
						class: 'color-redA',
						message: 'you are not in a party',
						type: 'info'
					}]
				}]
			});

			return;
		}

		let charname = this.obj.auth.charname;
		let message = msg.data.message.substr(1);

		this.party.forEach(function (p) {
			let player = cons.players.find(c => c.id === p);

			player.socket.emit('events', {
				onGetMessages: [{
					messages: [{
						class: 'color-grayB',
						message: '(party: ' + charname + '): ' + message,
						type: 'chat'
					}]
				}]
			});
		}, this);
	},

	sendCustomChannelMessage: function (msg) {
		let pList = cons.players;
		let pLen = pList.length;
		let origMessage = msg.data.message.substr(1);

		let channel = origMessage.split(' ')[0];
		let message = origMessage.substr(channel.length);

		if ((!channel) || (!message)) {
			this.obj.socket.emit('events', {
				onGetMessages: [{
					messages: [{
						class: 'color-redA',
						message: 'syntax: $channel message',
						type: 'info'
					}]
				}]
			});
			return;
		} else if (!this.isInChannel(this.obj, channel)) {
			this.obj.socket.emit('events', {
				onGetMessages: [{
					messages: [{
						class: 'color-redA',
						message: 'you are not currently in channel: ' + channel,
						type: 'info'
					}]
				}]
			});
			return;
		} else if (pLen > 0) {
			for (let i = 0; i < pLen; i++) {
				if (this.isInChannel(pList[i], channel)) {
					pList[i].socket.emit('events', {
						onGetMessages: [{
							messages: [{
								class: 'color-grayB',
								message: '[' + channel + '] ' + this.obj.auth.charname + ': ' + message,
								type: channel.trim()
							}]
						}]
					});
				}
			}
		}
	},

	chat: function (msg) {
		if (!msg.data.message)
			return;

		msg.data.message = msg.data.message
			.split('<')
			.join('&lt;')
			.split('>')
			.join('&gt;');

		if (!msg.data.message)
			return;

		if (msg.data.message.trim() === '')
			return;

		if (this.muted) {
			this.sendMessage('You have been muted from talking', 'color-redA');
			return;
		}

		let messageString = msg.data.message;
		if (messageString.length > this.maxChatLength)
			return;

		let history = this.messageHistory;

		let time = +new Date();
		history.spliceWhere(h => ((time - h.time) > 5000));

		if (history.length > 0) {
			if (history[history.length - 1].msg === messageString) {
				this.sendMessage('You have already sent that message', 'color-redA');
				return;
			} else if (history.length >= 3) {
				this.sendMessage('You are sending too many messages', 'color-redA');
				return;
			}
		}

		this.onBeforeChat(msg.data);
		if (msg.data.ignore)
			return;

		history.push({
			msg: messageString,
			time: time
		});

		let charname = this.obj.auth.charname;

		let msgStyle = roles.getRoleMessageStyle(this.obj) || ('color-grayB');

		let msgEvent = {
			source: charname,
			msg: messageString
		};
		events.emit('onBeforeSendMessage', msgEvent);
		messageString = msgEvent.msg;
		if (messageString[0] === '@') {
			let playerName = '';
			//Check if there's a space in the name
			if (messageString[1] === "'") {
				playerName = messageString.substring(2, messageString.indexOf("'", 2));
				messageString = messageString.replace("@'" + playerName + "' ", '');
			} else {
				playerName = messageString.substring(1, messageString.indexOf(' '));
				messageString = messageString.replace('@' + playerName + ' ', '');
			}

			if (playerName === this.obj.name)
				return;

			let target = cons.players.find(p => p.name === playerName);
			if (!target)
				return;

			this.obj.socket.emit('event', {
				event: 'onGetMessages',
				data: {
					messages: [{
						class: 'color-yellowB',
						message: '(you to ' + playerName + '): ' + messageString,
						type: 'chat'
					}]
				}
			});

			target.socket.emit('event', {
				event: 'onGetMessages',
				data: {
					messages: [{
						class: 'color-yellowB',
						message: '(' + this.obj.name + ' to you): ' + messageString,
						type: 'chat'
					}]
				}
			});
		} else if (messageString[0] === '$') 
			this.sendCustomChannelMessage(msg);
		else if (messageString[0] === '%') 
			this.sendPartyMessage(msg);
		else {
			let prefix = roles.getRoleMessagePrefix(this.obj) || '';

			cons.emit('event', {
				event: 'onGetMessages',
				data: {
					messages: [{
						class: msgStyle,
						message: prefix + charname + ': ' + msg.data.message,
						item: msg.data.item,
						type: 'chat'
					}]
				}
			});
		}
	},

	dc: function () {
		if (!this.party)
			return;

		this.leaveParty();
	},

	//This gets called on the target player
	getInvite: function (msg) {
		if (this.party)
			return;

		let obj = this.obj;
		let sourceId = msg.data.sourceId;

		if (sourceId === obj.id)
			return;

		let source = cons.players.find(c => c.id === sourceId);
		if (!source)
			return;

		source.social.sendMessage('invite sent', 'color-yellowB');
		this.sendMessage(source.name + ' has invited you to join a party', 'color-yellowB');

		this.obj.socket.emit('event', {
			event: 'onGetInvite',
			data: sourceId
		});
	},

	//This gets called on the player that initiated the invite
	acceptInvite: function (msg) {
		let sourceId = msg.data.sourceId;
		let source = cons.players.find(c => c.id === sourceId);
		if (!source)
			return;

		if (!this.party) {
			this.isPartyLeader = true;
			this.party = [this.obj.id];
			this.updateMainThread('party', this.party);
		}

		// Only add if not yet in party
		if (!this.party.find(id => (id === sourceId)))
			this.party.push(sourceId);

		this.updateMainThread('party', this.party);

		this.party.forEach(function (p) {
			let player = cons.players.find(c => c.id === p);
			player.social.party = this.party;
			player.social.updateMainThread('party', player.social.party);

			let returnMsg = source.name + ' has joined the party';
			if (p === sourceId)
				returnMsg = 'you have joined a party';
			player.social.sendMessage(returnMsg, 'color-yellowB');

			player
				.socket.emit('event', {
					event: 'onGetParty',
					data: this.party
				});
		}, this);
	},
	declineInvite: function (msg) {
		let targetId = msg.data.targetId;
		let target = cons.players.find(c => c.id === targetId);
		if (!target)
			return;

		this.sendMessage(target.name + ' declined your party invitation', 'color-redA');
	},

	//Gets called on the player that requested to leave
	leaveParty: function (msg) {
		let name = this.obj.name;

		this.party.spliceWhere(p => p === this.obj.id);

		this.party.forEach(function (p) {
			let player = cons.players.find(c => c.id === p);

			let messages = [{
				class: 'q0',
				message: name + ' has left the party'
			}];
			let party = this.party;
			if (this.party.length === 1) {
				messages.push({
					class: 'q0',
					message: 'your group has been disbanded'
				});

				player.social.isPartyLeader = false;
				player.social.party = null;
				player.social.updateMainThread('party', player.social.party);
				party = null;
			}

			player.socket.emit('events', {
				onGetParty: [party],
				onGetMessages: [{
					messages: messages
				}]
			});
		}, this);

		this.obj.socket.emit('events', {
			onGetParty: [
				[]
			],
			onGetMessages: [{
				messages: {
					class: 'q0',
					message: 'you have left the party'
				}
			}]
		});

		if ((this.isPartyLeader) && (this.party.length >= 2)) {
			let newLeader = cons.players.find(c => c.id === this.party[0]).social;
			newLeader.isPartyLeader = true;
			this.party.forEach(function (p) {
				let returnMsg = newLeader.obj.name + ' is now the party leader';
				if (p === newLeader.obj.id)
					returnMsg = 'you are now the party leader';

				cons.players.find(c => c.id === p).socket.emit('events', {
					onGetMessages: [{
						messages: [{
							class: 'q0',
							message: returnMsg
						}]
					}]
				});
			}, this);
		}

		this.party = null;
		this.updateMainThread('party', this.party);
	},

	//Gets called on the player that requested the removal
	removeFromParty: function (msg) {
		if (!this.isPartyLeader) {
			this.sendMessage('you are not the party leader', 'color-redA');
			return;
		}

		let target = cons.players.find(c => c.id === msg.data);
		if (!target)
			return;

		this.party.spliceWhere(p => p === target.id);

		this.party.forEach(function (p) {
			cons.players.find(c => c.id === p)
				.socket.emit('events', {
					onGetParty: [this.party],
					onGetMessages: [{
						messages: [{
							class: 'color-yellowB',
							message: target.name + ' has been removed from the party'
						}]
					}]
				});
		}, this);

		target.socket.emit('events', {
			onGetMessages: [{
				messages: [{
					class: 'color-redA',
					message: 'you have been removed from the party'
				}]
			}],
			onPartyDisband: [{}]
		});

		target.social.party = null;
		target.social.isPartyLeader = false;
		target.social.updateMainThread('party', target.social.party);

		if (this.party.length === 1) {
			this.party = null;
			this.isPartyLeader = null;
			this.updateMainThread('party', this.party);

			this.sendMessage('your party has been disbanded', 'color-yellowB');
		}
	},

	updateMainThread: function (property, value) {
		atlas.updateObject(this.obj, {
			components: [{
				type: 'social',
				[property]: value
			}]
		});
	}
};
