const fs = require("fs");
const path = require("path");
const { ethers, artifacts } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // 1. ComplianceRegistry
  const Compliance = await ethers.getContractFactory("ComplianceRegistry");
  const compliance = await Compliance.deploy();
  await compliance.waitForDeployment();
  console.log("ComplianceRegistry:", await compliance.getAddress());

  // 2. PropertyRegistry
  const Registry = await ethers.getContractFactory("PropertyRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  console.log("PropertyRegistry:  ", await registry.getAddress());

  // 3. MockUSDC
  const USDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await USDC.deploy();
  await usdc.waitForDeployment();
  console.log("MockUSDC:          ", await usdc.getAddress());

  // 4. FractionalExchange
  const Exchange = await ethers.getContractFactory("FractionalExchange");
  const exchange = await Exchange.deploy(
    await registry.getAddress(),
    await compliance.getAddress(),
    await usdc.getAddress()
  );
  await exchange.waitForDeployment();
  console.log("FractionalExchange:", await exchange.getAddress());

  // 5. ValuationOracle
  const Oracle = await ethers.getContractFactory("ValuationOracle");
  const oracle = await Oracle.deploy();
  await oracle.waitForDeployment();
  console.log("ValuationOracle:   ", await oracle.getAddress());

  const out = {
    network: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    addresses: {
      ComplianceRegistry: await compliance.getAddress(),
      PropertyRegistry: await registry.getAddress(),
      MockUSDC: await usdc.getAddress(),
      FractionalExchange: await exchange.getAddress(),
      ValuationOracle: await oracle.getAddress()
    }
  };

  const frontendDir = path.resolve(__dirname, "../../website/src/lib/contracts");
  fs.mkdirSync(frontendDir, { recursive: true });
  fs.writeFileSync(path.join(frontendDir, "addresses.json"), JSON.stringify(out, null, 2));

  // Export Application Binary Interfaces
  const names = [
    "ComplianceRegistry",
    "PropertyRegistry",
    "MockUSDC",
    "FractionalExchange",
    "ValuationOracle"
  ];
  for (const n of names) {
    const art = await artifacts.readArtifact(n);
    fs.writeFileSync(
      path.join(frontendDir, `${n}.json`),
      JSON.stringify({ abi: art.abi }, null, 2)
    );
  }

  console.log("\nWrote contract config to frontend/src/lib/contracts/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
