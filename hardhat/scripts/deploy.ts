import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { JsonRpcProvider, Wallet, ContractFactory } from "ethers";

async function main() {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	const artifactPath = path.resolve(
		__dirname,
		"..",
		"artifacts",
		"contracts",
		"LandRecords.sol",
		"LandRecords.json"
	);
	const artifactRaw = readFileSync(artifactPath, "utf8");
	const artifact = JSON.parse(artifactRaw);
	const abi = artifact.abi;
	const bytecode: string = artifact.bytecode.object || artifact.bytecode;

	const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
	const privateKey = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Hardhat node Account #0

	const provider = new JsonRpcProvider(rpcUrl);
	const wallet = new Wallet(privateKey, provider);
	console.log("Deploying with:", wallet.address);

	const factory = new ContractFactory(abi, bytecode, wallet);
	const contract = await factory.deploy();
	await contract.deploymentTransaction()?.wait();
	const address = await contract.getAddress();
	console.log("✅ LandRecords deployed to:", address);
}

main().catch((err) => {
	console.error("❌ Deployment failed:", err);
	process.exit(1);
});


