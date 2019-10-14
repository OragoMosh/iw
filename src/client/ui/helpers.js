define([], () => {
	return {
		getClassNames: (config, base = '') => Object.entries(config)
			.reduce((p, [k, v]) => {
				return p + (!!v ? ` ${k}` : '');
			}, base)
	};
});
