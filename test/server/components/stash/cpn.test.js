const extend = require('extend');

const cpn = require('../../../../src/server/components/stash');

describe('Component: Stash', () => {
	it('Gives items IDs', () => {
		const c = extend({}, cpn);
		c.init({
			items: [{}, {}, {}]
		});

		const issues = c.items.filter(item => item.id === undefined);
		expect(issues.length).toBe(0);
	});

	it('Gives items unique IDs', () => {
		const c = extend({}, cpn);
		c.init({
			items: [{}, {}, {}]
		});

		const issues = c.items.filter((item, i) => c.items.filter(f => f.id === item.id).length > 1);
		expect(issues.length).toBe(0);
	});
});
