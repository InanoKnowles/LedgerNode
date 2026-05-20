const fs = require("fs");
const path = require("path");
const solc = require("solc");

const contractsDir = path.resolve(__dirname, "contracts");
const files = fs.readdirSync(contractsDir).filter((f) => f.endsWith(".sol"));

const sources = {};
for (const f of files) {
  sources[f] = { content: fs.readFileSync(path.join(contractsDir, f), "utf8") };
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } }
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  let hasError = false;
  for (const e of output.errors) {
    console.log(`${e.severity}: ${e.formattedMessage}`);
    if (e.severity === "error") hasError = true;
  }
  if (hasError) process.exit(1);
}

console.log("\nCompiled contracts:");
for (const file of Object.keys(output.contracts || {})) {
  for (const name of Object.keys(output.contracts[file])) {
    const size = output.contracts[file][name].evm.bytecode.object.length / 2;
    console.log(`  ${file}: ${name} (${size} bytes)`);
  }
}
