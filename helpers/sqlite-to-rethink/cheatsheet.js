//Hack to force eslint pass
const r = null;

//Count the amount of permadead characters
r.db('live').table('character').filter({
	value: {
		permadead: true
	}
}).count();

//Count the amount of permadead characters per spirit
r.db('live').table('character')
	.filter({
		value: {
			permadead: true
		}
	})
	.group(row => {
		return row('value')('class');
	})
	.count();

//All players that are level 20
r.db('live').table('character')
	.filter(row => {
		return row('value')('components').contains(cpn => {
			return cpn('type').eq('stats').and(cpn('values')('level').ge(20));
		});
	});

//Group by mod action source, aggregate and order by count
r.db('live').table('modLog')
	.group(f => f('value')('source')).count().ungroup().orderBy('reduction');

//List Items with int > 30
r.db('live').table('character')
	.concatMap(row => {
		return row('value')('components')
			.filter(cpn => {
				return cpn('type').eq('inventory');
			})
			.concatMap(c => {
				return [{
					name: row('value')('name'),
					cpn: c('items').filter(item => {
						return item('stats')('dex').ge(30);
					})
				}];
			})
			.filter(c => {
				return c('cpn').count().ge(1);
			});
	});

//Play time per account from low to high
r.db('live').table('character')
	.concatMap(row => {
		return row('value')('components')
			.filter(cpn => {
				return cpn('type').eq('stats');
			})
			.concatMap(c => {      
				return [{
					account: row('value')('account'),
					name: row('value')('name'),
					played: c('stats')('played')
				}];
			});
	})
	.group('account')
	.sum('played')
	.ungroup()
	.orderBy('reduction');

//Amount of characters per level
r.db('live').table('character')
	.concatMap(row => {
		return row('value')('components')
			.filter(cpn => {
				return cpn('type').eq('stats');
			})
			.concatMap(c => {      
				return [{
					level: c('values')('level')
				}];
			});
	})
	.group('level')
	.count();

r.db('live').table('character')
	.concatMap(row => {
		return row('value')('components')
			.filter(cpn => {
				return cpn('type').eq('stats');
			})
			.concatMap(c => {      
				return [{
					level: c('values')('level'),
					xp: c('values')('xpTotal')
				}];
			});
	})
	.filter(c => {
		return c('level').eq(2);
	})
	.group('xp')
	.count();

r.db('live').table('character')
	.concatMap(row => {
		return row('value')('components')
			.filter(cpn => {
				return cpn('type').eq('stats');
			})
			.concatMap(c => {      
				return [{
					level: c('values')('level'),
					xp: c('values')('xpTotal'),
					streaks: c('stats')('mobKillStreaks')
					
				}];
			});
	})
	.filter(c => {
		return c('level').eq(2).and(c('xp').eq(10));
	});
