import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox-viem";
import type { HardhatUserConfig } from "hardhat/config";
import { configVariable } from "hardhat/config";
import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import hardhatEthersPlugin from "@nomicfoundation/hardhat-ethers";

const config: HardhatUserConfig = {
	plugins: [hardhatToolboxViemPlugin, hardhatEthersPlugin],
	solidity: {
		version: "0.8.28",
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	networks: {
		localhost: {
			type: "http",
			url: "http://127.0.0.1:8545",
		},
		sepolia: {
			type: "http",
			url: configVariable("SEPOLIA_RPC_URL"),
			accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
		},
		hardhat: {
			type: "edr-simulated",
			chainType: "l1",
		},
	},
};

export default config;
