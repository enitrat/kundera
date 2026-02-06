import { fromHex as feltFromHex } from "../Felt252/fromHex.js";
import { fromHex as addressFromHex } from "../ContractAddress/fromHex.js";
import { fromHex as classHashFromHex } from "../ClassHash/fromHex.js";

/**
 * @param {import('../../jsonrpc/types.js').StateDiff} rpc
 * @returns {import('./types.js').StateDiffType}
 */
export function stateDiffFromRpc(rpc) {
	return {
		storage_diffs: rpc.storage_diffs.map((d) => ({
			address: addressFromHex(d.address),
			storage_entries: d.storage_entries.map((e) => ({
				key: feltFromHex(e.key),
				value: feltFromHex(e.value),
			})),
		})),
		declared_classes: rpc.declared_classes.map((d) => ({
			class_hash: classHashFromHex(d.class_hash),
			compiled_class_hash: classHashFromHex(d.compiled_class_hash),
		})),
		deployed_contracts: rpc.deployed_contracts.map((d) => ({
			address: addressFromHex(d.address),
			class_hash: classHashFromHex(d.class_hash),
		})),
		replaced_classes: rpc.replaced_classes.map((d) => ({
			contract_address: addressFromHex(d.contract_address),
			class_hash: classHashFromHex(d.class_hash),
		})),
		nonces: rpc.nonces.map((d) => ({
			contract_address: addressFromHex(d.contract_address),
			nonce: feltFromHex(d.nonce),
		})),
	};
}

/**
 * @param {import('../../jsonrpc/types.js').StateUpdate} rpc
 * @returns {import('./types.js').StateUpdateType}
 */
export function stateUpdateFromRpc(rpc) {
	return {
		block_hash: feltFromHex(rpc.block_hash),
		old_root: feltFromHex(rpc.old_root),
		new_root: feltFromHex(rpc.new_root),
		state_diff: stateDiffFromRpc(rpc.state_diff),
	};
}
