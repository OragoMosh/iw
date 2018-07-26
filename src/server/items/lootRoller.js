let atlas = require('world/atlas');

module.exports = {
	nextId: 0,
	maxTtl: 90,

	queue: [],

	enqueue: function (msg) {
		let q = {
			id: this.nextId++,
			party: msg.party.slice(0),
			rolls: [],
			item: msg.item,
			ttl: this.maxTtl
		};

		this.queue.push(q);

		q.party.forEach(function (p) {
			let player = cons.players.find(c => c.id == p);
			if (!player)
				return;

			player
				.socket.emit('events', {
					onGetPartyLoot: [{
						id: q.id,
						item: q.item,
						ttl: q.ttl
					}]
				});
		});
	},

	performAction: function (msg) {
		msg = msg.data;

		let q = this.queue.find(q => q.id == msg.id);
		if (!q)
			return;
		//Already rolled
		else if (q.rolls.some(r => r.playerServerId == msg.playerId))
			return;

		let action = msg.action;
		let roll = -1;

		if ((action == 'need') || (action == 'greed'))
			roll = ~~(Math.random() * 100);

		q.rolls.push({
			playerServerId: msg.playerId,
			rollType: action,
			roll: roll
		});

		if (q.rolls.length >= q.party.length)
			this.process(q);
	},

	process: function (q) {
		let rolls = q.rolls;
		rolls = rolls.sort(function (a, b) {
			return (b.roll - a.roll);
		});

		//Did someone NOT pass?
		if (rolls.some(r => r.roll > -1)) {
			let winnerType = 'need';
			if (!rolls.some(r => r.rollType == 'need'))
				winnerType = 'greed';

			var winner = rolls.find(r => r.rollType == winnerType);

			//Notify party of result
			q.party.forEach(function (p) {
				//Don't notify the player if he passed
				let roll = rolls.find(r => r.playerServerId == p);
				if ((!roll) || (roll.roll == -1))
					return;

				let player = cons.players.find(c => c.id == p);
				if (!player)
					return;

				player
					.socket.emit('events', {
						onGetPartyLootResult: [{
							item: q.item,
							rolls: rolls,
							winner: winner.playerServerId
						}]
					});
			});

			//Give item to winner
			var winner = cons.players.find(c => c.id == winner.playerServerId);
			if (winner) {
				atlas.performAction(winner, {
					cpn: 'inventory',
					method: 'getItem',
					data: q.item
				});
			}
		} else {
			//Need to recreate the loot here
		}

		this.queue.spliceWhere(f => f == q);
	},

	update: function () {
		let queue = this.queue;
		let qLen = queue.length;
		for (let i = 0; i < qLen; i++) {
			let q = queue[i];
			q.ttl--;

			//Did someone go offline?
			q.party = q.party.filter(function (p) {
				return (cons.players.some(c => c.id == p));
			});

			if ((q.ttl <= 0) || (q.rolls.length >= q.party.length)) {
				this.process(q);
				i--;
				qLen--;
			}
		}
	}
};
