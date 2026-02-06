/**
 * @param {import('./types.js').StateDiffType} diff
 * @returns {import('../../jsonrpc/types.js').StateDiff}
 */
export function stateDiffToRpc(diff) {
	return {
		storage_diffs: diff.storage_diffs.map((d) => ({
			address: d.address.toHex(),
			storage_entries: d.storage_entries.map((e) => ({
				key: e.key.toHex(),
				value: e.value.toHex(),
			})),
		})),
		declared_classes: diff.declared_classes.map((d) => ({
			class_hash: d.class_hash.toHex(),
			compiled_class_hash: d.compiled_class_hash.toHex(),
		})),
		deployed_contracts: diff.deployed_contracts.map((d) => ({
			address: d.address.toHex(),
			class_hash: d.class_hash.toHex(),
		})),
		replaced_classes: diff.replaced_classes.map((d) => ({
			contract_address: d.contract_address.toHex(),
			class_hash: d.class_hash.toHex(),
		})),
		nonces: diff.nonces.map((d) => ({
			contract_address: d.contract_address.toHex(),
			nonce: d.nonce.toHex(),
		})),
	};
}

/**
 * @param {import('./types.js').StateUpdateType} update
 * @returns {import('../../jsonrpc/types.js').StateUpdate}
 */
export function stateUpdateToRpc(update) {
	return {
		block_hash: update.block_hash.toHex(),
		old_root: update.old_root.toHex(),
		new_root: update.new_root.toHex(),
		state_diff: stateDiffToRpc(update.state_diff),
	};
}
