module.exports = {
	allowedCpn: function (msg) {
		let allowed = {
			player: ['performAction', 'queueAction', 'move'],
			auth: ['login', 'register', 'play', 'getCharacterList', 'getCharacter', 'deleteCharacter', 'getSkinList', 'createCharacter', 'getCustomChannels'],
			social: ['chat', 'getInvite', 'acceptInvite', 'declineInvite', 'removeFromParty', 'leaveParty']
		};

		let valid = ((allowed[msg.cpn]) && (allowed[msg.cpn].indexOf(msg.method) > -1));
		if (!valid)
			return false;

		if (!msg.data.cpn)
			return true;

		let secondaryAllowed = {
			auth: ['ping'],
			dialogue: ['talk'],
			gatherer: ['gather'],
			quests: ['complete'],
			inventory: ['combineStacks', 'splitStack', 'activateMtx', 'useItem', 'moveItem', 'enchantItem', 'getEnchantMaterials', 'learnAbility', 'unlearnAbility', 'dropItem', 'destroyItem', 'salvageItem', 'stashItem', 'mailItem'],
			equipment: ['equip', 'unequip', 'setQuickSlot', 'useQuickSlot', 'inspect'],
			stash: ['withdraw'],
			trade: ['buySell'],
			door: ['lock', 'unlock'],
			wardrobe: ['open', 'apply'],
			stats: ['respawn'],
			passives: ['tickNode', 'untickNode'],
			workbench: ['open', 'craft', 'getRecipe']
		};

		return ((secondaryAllowed[msg.data.cpn]) && (secondaryAllowed[msg.data.cpn].indexOf(msg.data.method) > -1));
	},

	allowedGlobal: function (msg) {
		let allowed = {
			clientConfig: ['getResourcesList'],
			leaderboard: ['requestList'],
			cons: ['unzone']
		};

		return ((allowed[msg.module]) && (allowed[msg.module].indexOf(msg.method) > -1));
	}
};
