let config = [
	'ahole',
	'anal',
	'anilingus',
	'anus',
	'areola',
	'ass',
	'b1tch',
	'ballsack',
	'bimbo',
	'bitch',
	'blowjob',
	'bollock',
	'boner',
	'boob',
	'breast',
	'breasts',
	'bukkake',
	'bullshit',
	'busty',
	'butt',
	'cameltoe',
	'carpetmuncher',
	'chinc',
	'chink',
	'chode',
	'climax',
	'clit',
	'cock',
	'coital',
	'condom',
	'coon',
	'crap',
	'cum',
	'cunilingus',
	'cunnilingus',
	'cunt',
	'dammit',
	'damn',
	'dick',
	'dike',
	'dildo',
	'dong',
	'douche',
	'dumbass',
	'dumbasses',
	'dyke',
	'ejaculate',
	'erection',
	'erotic',
	'fack',
	'fag',
	'fart',
	'felch',
	'fellate',
	'fellatio',
	'feltch',
	'fisting',
	'fondle',
	'foreskin',
	'fubar',
	'fuck',
	'fuk',
	'gay',
	'goatse',
	'godamn',
	'goddammit',
	'goddamn',
	'goldenshower',
	'gonad',
	'gspot',
	'gtfo',
	'handjob',
	'hardon',
	'hell',
	'herpes',
	'hitler',
	'hiv',
	'homo',
	'hooker',
	'hooter',
	'horny',
	'hump',
	'hymen',
	'incest',
	'jap',
	'jerkoff',
	'jism',
	'jiz',
	'kinky',
	'kkk',
	'labia',
	'lech',
	'lesbian',
	'lesbo',
	'lezbian',
	'lezbo',
	'lube',
	'masterbat',
	'masturbat',
	'menstruat',
	'muff',
	'nad',
	'naked',
	'nazi',
	'negro',
	'nigga',
	'nigger',
	'nipple',
	'nympho',
	'oral',
	'orgasm',
	'orgies',
	'orgy',
	'pantie',
	'panty',
	'pedo',
	'pee',
	'penetrat',
	'penial',
	'penile',
	'penis',
	'phalli',
	'phuck',
	'pimp',
	'piss',
	'pms',
	'poon',
	'porn',
	'prick',
	'prostitut',
	'pube',
	'pubic',
	'pubis',
	'puss',
	'pussies',
	'pussy',
	'puto',
	'queaf',
	'queef',
	'queer',
	'rape',
	'rapist',
	'rectal',
	'rectum',
	'rectus',
	'reich',
	'retard',
	'rimjob',
	'ritard',
	'rump',
	'schlong',
	'screw',
	'scrote',
	'scrotum',
	'semen',
	'sex',
	'shit',
	'skank',
	'slut',
	'smut',
	'snatch',
	'sodom',
	'sperm',
	'spunk',
	'stfu',
	'stiffy',
	'strip',
	'stroke',
	'stupid',
	'suck',
	'tampon',
	'tard',
	'teabag',
	'teat',
	'teste',
	'testicle',
	'testis',
	'thrust',
	'tit',
	'tramp',
	'transsex',
	'turd',
	'tush',
	'twat',
	'undies',
	'urinal',
	'urine',
	'uterus',
	'vag',
	'vagina',
	'viagra',
	'virgin',
	'vomit',
	'voyeur',
	'vulva',
	'wang',
	'wank',
	'weenie',
	'weewee',
	'weiner',
	'wench',
	'wetback',
	'whoralicious',
	'whore',
	'whoring',
	'wigger',
	'womb',
	'woody',
	'wtf',
	'xxx'
];

let cLen = config.length;
	
module.exports = {
	isClean: function (text) {
		text = text.toLowerCase();
		let cb = text.indexOf.bind(text);

		for (let i = 0; i < cLen; i++) {
			if (cb(config[i]) > -1)
				return false;
		}

		return true;
	}
};
