import { describe, expect, it } from "vitest";
import { WalletRpc, WalletErrorCode } from "../../src/jsonrpc/index";
import type {
  WalletCall,
  WalletTypedData,
} from "../../src/provider/index";

describe("docs/skills/wallet-account", () => {
  describe("wallet RPC request builders exist", () => {
    it("exposes all 12 wallet request builders", () => {
      expect(typeof WalletRpc.SupportedWalletApiRequest).toBe("function");
      expect(typeof WalletRpc.SupportedSpecsRequest).toBe("function");
      expect(typeof WalletRpc.GetPermissionsRequest).toBe("function");
      expect(typeof WalletRpc.RequestAccountsRequest).toBe("function");
      expect(typeof WalletRpc.RequestChainIdRequest).toBe("function");
      expect(typeof WalletRpc.DeploymentDataRequest).toBe("function");
      expect(typeof WalletRpc.WatchAssetRequest).toBe("function");
      expect(typeof WalletRpc.AddStarknetChainRequest).toBe("function");
      expect(typeof WalletRpc.SwitchStarknetChainRequest).toBe("function");
      expect(typeof WalletRpc.AddInvokeTransactionRequest).toBe("function");
      expect(typeof WalletRpc.AddDeclareTransactionRequest).toBe("function");
      expect(typeof WalletRpc.SignTypedDataRequest).toBe("function");
    });
  });

  describe("request builders produce correct shapes", () => {
    it("RequestAccountsRequest with no args", () => {
      const req = WalletRpc.RequestAccountsRequest();
      expect(req.method).toBe("wallet_requestAccounts");
      expect(req.params).toEqual([]);
    });

    it("RequestAccountsRequest with silent_mode", () => {
      const req = WalletRpc.RequestAccountsRequest({ silent_mode: true });
      expect(req.method).toBe("wallet_requestAccounts");
      expect(req.params).toEqual([{ silent_mode: true }]);
    });

    it("AddInvokeTransactionRequest wraps calls", () => {
      const calls: WalletCall[] = [
        { contract_address: "0x1", entry_point: "transfer", calldata: ["0x2", "0x3"] },
      ];
      const req = WalletRpc.AddInvokeTransactionRequest(calls);
      expect(req.method).toBe("wallet_addInvokeTransaction");
      expect(req.params).toEqual([{ calls }]);
    });

    it("SignTypedDataRequest passes typed data", () => {
      const typedData: WalletTypedData = {
        types: {
          StarkNetDomain: [
            { name: "name", type: "felt" },
            { name: "version", type: "felt" },
            { name: "chainId", type: "felt" },
          ],
          Message: [
            { name: "content", type: "felt" },
          ],
        },
        primaryType: "Message",
        domain: { name: "TestDapp", version: "1", chainId: "SN_MAIN" },
        message: { content: "0x123" },
      };
      const req = WalletRpc.SignTypedDataRequest(typedData);
      expect(req.method).toBe("wallet_signTypedData");
      expect(req.params).toEqual([typedData]);
    });

    it("SwitchStarknetChainRequest", () => {
      const req = WalletRpc.SwitchStarknetChainRequest({ chainId: "0x534e5f4d41494e" });
      expect(req.method).toBe("wallet_switchStarknetChain");
      expect(req.params).toEqual([{ chainId: "0x534e5f4d41494e" }]);
    });

    it("WatchAssetRequest", () => {
      const req = WalletRpc.WatchAssetRequest({
        type: "ERC20",
        options: { address: "0xtoken", symbol: "ETH", decimals: 18 },
      });
      expect(req.method).toBe("wallet_watchAsset");
      expect(req.params[0].type).toBe("ERC20");
      expect(req.params[0].options.address).toBe("0xtoken");
    });
  });

  describe("wallet error codes", () => {
    it("exposes standard wallet error codes", () => {
      expect(WalletErrorCode.USER_REFUSED_OP).toBe(113);
      expect(WalletErrorCode.INVALID_REQUEST_PAYLOAD).toBe(114);
      expect(WalletErrorCode.UNLISTED_NETWORK).toBe(111);
      expect(WalletErrorCode.ACCOUNT_ALREADY_DEPLOYED).toBe(115);
      expect(WalletErrorCode.API_VERSION_NOT_SUPPORTED).toBe(162);
      expect(WalletErrorCode.UNKNOWN_ERROR).toBe(163);
    });
  });

  describe("no-args request builders", () => {
    it("SupportedWalletApiRequest", () => {
      const req = WalletRpc.SupportedWalletApiRequest();
      expect(req).toEqual({ method: "wallet_supportedWalletApi", params: [] });
    });

    it("SupportedSpecsRequest", () => {
      const req = WalletRpc.SupportedSpecsRequest();
      expect(req).toEqual({ method: "wallet_supportedSpecs", params: [] });
    });

    it("GetPermissionsRequest", () => {
      const req = WalletRpc.GetPermissionsRequest();
      expect(req).toEqual({ method: "wallet_getPermissions", params: [] });
    });

    it("RequestChainIdRequest", () => {
      const req = WalletRpc.RequestChainIdRequest();
      expect(req).toEqual({ method: "wallet_requestChainId", params: [] });
    });

    it("DeploymentDataRequest", () => {
      const req = WalletRpc.DeploymentDataRequest();
      expect(req).toEqual({ method: "wallet_deploymentData", params: [] });
    });
  });
});
