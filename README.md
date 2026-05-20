# LedgerNode

Tokenised real estate on Ethereum. Buy slices of homes, earn rent automatically, sell when you want. Solidity contracts + Next.js dApp. IFB452, QUT 2026.

## Install (one-time)

1. **Node.js LTS** — [nodejs.org](https://nodejs.org)
2. **Ganache** — [trufflesuite.com/ganache](https://trufflesuite.com/ganache)
3. **MetaMask** — [metamask.io](https://metamask.io) (Chrome, Brave, Firefox or Edge)
4. **VS Code** — [code.visualstudio.com](https://code.visualstudio.com)
5. **Remix** — bookmark [remix.ethereum.org](https://remix.ethereum.org) (no install needed)

## Set up

```bash
tar -xzf LedgerNode.tar.gz
cd LedgerNode/contracts-project
npm install
cd ../website
npm install
```

## Run (every time)

1. Open Ganache, start workspace on port `7545`
2. Deploy the contracts:
```bash
   cd contracts-project
   npx hardhat run scripts/deploy.js --network ganache
```
3. Start the website:
```bash
   cd ../website
   npm run dev
```
4. Open `http://localhost:3000` in the browser where MetaMask is installed

## Optional: run the tests

```bash
cd contracts-project
npx hardhat test
```

## Optional: use Remix (for live demos or filming)

1. Open [remix.ethereum.org](https://remix.ethereum.org)
2. Create 5 new files under the `contracts/` folder, one per `.sol` file
3. Copy each contract from `LedgerNode/contracts-project/contracts/` into the matching Remix file
4. **Solidity Compiler tab** → version `0.8.20` → Compile
5. **Deploy & Run tab** → Environment: **Custom (External HTTP Provider)** → RPC URL `http://127.0.0.1:7545`
6. Deploy in this order, copying each address as you go:
   - `ComplianceRegistry` (no args)
   - `PropertyRegistry` (no args)
   - `MockUSDC` (no args)
   - `FractionalExchange` (paste the three addresses above into the constructor fields)
   - `ValuationOracle` (no args)

## Repository layout

```
BlockChain/
├── .gitignore                  Single root gitignore for the whole repo
├── README.md
│
├── ledgernode/          Hardhat workspace (the smart contracts)
│   ├── .env                    Hardhat reads this when deploying
│   ├── contracts/              The 5 .sol files
│   ├── test/                   30-test Hardhat suite
│   ├── scripts/deploy.js       Deploys all 5 and writes addresses to website
│   ├── hardhat.config.js
│   └── package.json
│
└── website/                    Next.js workspace (the user-facing dApp)
    ├── .env.local              Next.js reads this in the browser
    ├── src/
    ├── package.json
    └── (next.config.js, tailwind.config.js, etc.)
```

## Developer notes

So, five contracts. I want to be honest about how we got here, because the design proposal only specified three and the jump deserves an explanation.

When I sat down to actually build this, I kept hitting little walls that the design didn't acknowledge. `PropertyRegistry` was meant to mint properties, sure, but how do we prove an inspector actually signed off? You can't just take their word for it on-chain, so I ended up adding a `VerificationRecord` struct that has to exist before anything can be minted. Same story with `ComplianceRegistry`: I'd written it as a boolean flag, just "is this person okay yes or no", but a real regulator needs to be able to revoke people, and verifications need to expire eventually, otherwise someone gets KYC'd once in 2026 and is still considered compliant a decade later. That's clearly wrong. So that contract grew an `Identity` struct with proper fields.

And then `FractionalExchange`... look, I'll just admit it. The version I had with my proposal was an early draft that turned out to be incomplete; the actual sharding, dividend, and compliance-hook logic wasn't there yet. So that whole contract had to be properly built out. That's where most of the new code lives.

The two genuinely new contracts are `MockUSDC` and `ValuationOracle`. `MockUSDC` is just a tiny ERC-20 because the exchange needs to settle in stablecoin, and stablecoin doesn't magically exist on Ganache. 

In production this contract disappears; we'd just pass real USDC's mainnet address into the exchange's constructor and nothing else would change. It's a stand-in, not a real piece of the system. The choice of ERC-1155 for the share book itself is what lets one contract hold the shares for every property at once, which is a known pattern for fractional ownership of real-world assets (Enjin et al., 2018; Circle, n.d.).

`ValuationOracle` is the implementation of the Chainlink-style aggregation I referenced in the proposal. It takes submissions from three or more feeders and returns the median, which is the same defence Chainlink uses against any one source lying (Ellis et al., 2017; Chainlink, 2023). 

I built it because the original design called for tamper-resistant valuation data and reading further into the Chainlink whitepaper made it obvious that a single-feeder oracle would just recreate the centralised-trust problem we were trying to avoid in the first place. Imagine letting just about anyone say yes to owning a strangers home, CRAZY!

A few design choices worth flagging while I'm thinking about it. I deliberately didn't use OpenZeppelin(OZ). Not because OZ is bad, but because I wanted to actually understand what an ERC-721 or ERC-1155 implementation looks like, and you don't learn that by importing it. 

The code is also way more readable in a small project when there's no inheritance chain to chase. The downside is I've reimplemented patterns that are battle-tested in OZ, so anyone using this in anger should switch to OZ first. This is a student project, not production. I wanted to try something I wasn't already using at work.

None of the contracts actually know how the others work, they just know where to find them.

`FractionalExchange` doesn't know what `ComplianceRegistry` or `PropertyRegistry` look like internally; it just knows their addresses (passed in via the constructor) and calls a small handful of functions on them via interfaces. 

That means I could swap `ComplianceRegistry` for a totally different compliance system and the exchange wouldn't care. I think that's the right call but it does mean five contracts to deploy in a specific order, which is annoying if you're doing it by hand. 

The deploy script does it correctly, the manual Remix path is something you have to be careful with. And  B O Y  did it take me 5-EVER! 

Dividends are the bit I went back and forth on the most. Mostly because I can't maths and this word looks and sounds like maths.

The "correct" way to do pro-rata payouts in a token that trades freely is checkpointing:
1. snapshot every holder's balance at the moment of deposit, 
2. then pay against those snapshots. 

That's how Compound and Aave do it. 

I didn't do that. Mine reads the holder's *current* balance at claim time, which means if someone buys shares between the deposit and the claim, they could potentially claim against the new balance. 

For a proof of concept this is fine, and the gas cost is way more predictable, but I want to be upfront that production-grade would do this differently. There's a comment in the code calling this out.

The compliance hook is the bit I'm most happy with. There was a moment where I saw someone arrive at a similar idea and it lit a fire under me to make the redesign tighter than theirs, which is petty but I'm owning it.

It's four lines of code in `_complianceHook()` and it gets called on every share transfer, every marketplace buy, every fractionalisation. 

If either side of a transaction fails compliance, the whole thing reverts. 

That means a regulator can disable a single wallet's ability to trade by sending one transaction, and they don't need any cooperation from me or the exchange operator. The protocol enforces it. That's the whole pitch of the design proposal in four lines.

Some honest limitations. The dividend rounds down because Solidity doesn't do decimals, so there'll be tiny dust amounts of stablecoin left in the contract over time. The `redeem()` function requires you to own 100% of a property's shares, which is fine for the demo but in real life you'd want a partial redeem path so a majority holder could squeeze out small ones. The portfolio view on the frontend loops through property IDs 1 to 20, which is obviously not how you'd do it in production but it works fine when there's only a handful of properties, hence the preset 3 houses for sale. 

There's also no UI for granting auditor or regulator rights; you have to do that through the Hardhat console after deploying. I'd add a role-admin page if I had more time.

On security: nothing here has been audited. 

The MockUSDC has *no access control at all* on its `mint()` function because it's a test stablecoin and you need to be able to top up your own account during the demo. 

Don't deploy this contract anywhere real. The rest follows the checks-effects-interactions pattern (Solidity Team, 2024) to avoid the reentrancy class of bugs that took down The DAO in 2016, and Solidity 0.8 has built-in overflow protection, so I'm not super worried about the usual footguns, but I'd still want a real auditor to look at it before any money was at stake.

The frontend is the bit that took the longest to get right, BECAUSE I SUCK AT VISUALLY DESIGNING but here we are....The contracts work or they don't. 

The frontend has a hundred small decisions: what to call things in plain English, where the wallet provider lives, how to handle MetaMask account switches, what to do when someone refreshes the page mid-transaction. 

I learned the hard way that the `WalletProvider` needs to live in `app/layout.tsx`, not inside individual pages, because Next.js remounts page-level state on navigation and you'll silently sign people out every time they click a link. 

Took me ages to figure out why that was happening.

One last thing: there are two `.env` files in this repo, one in each subproject, and they are not duplicates even though they have similar names. The contracts project's `.env` holds server-side stuff like the deployer's private key. 

The website's `.env.local` holds public stuff that gets baked into the browser bundle. Mixing them up is the easy way to leak a private key into your website's JavaScript, so they live separately and each tool reads its own. The single `.gitignore` at the root catches both of them.

If anyone reads this and wants to extend it, the obvious places to start are: implementing the rental flow on `/rent` (currently a placeholder), wiring up the oracle to the valuation displays in the buy page, adding a checkpointing pattern to the dividend logic, and replacing the linear portfolio scan with proper event indexing. The contracts are stable enough that any of these should be additive rather than requiring rewrites.

## References

Chainlink. (2023). *The 3 levels of data aggregation in Chainlink price feeds*. Chainlink Blog. https://blog.chain.link/levels-of-data-aggregation-in-chainlink-price-feeds/

Circle. (n.d.). *Multi-token template*. Circle Developer Documentation. https://developers.circle.com/contracts/erc-1155-multi-token

Ellis, S., Juels, A., & Nazarov, S. (2017). *ChainLink: A decentralized oracle network* (Whitepaper v1.0). Chainlink. https://research.chain.link/whitepaper-v1.pdf

Enjin, Radomski, W., Cooke, A., Castonguay, P., Therien, J., Binet, E., & Sandford, R. (2018). *ERC-1155: Multi token standard* (EIP-1155). Ethereum Improvement Proposals. https://eips.ethereum.org/EIPS/eip-1155

Solidity Team. (2024). *Security considerations*. Solidity Documentation. https://docs.soliditylang.org/en/latest/security-considerations.html

Knowles, I.(2026).LedgerNode: A blockchain platform for real estate tokenisation [Unpublished design proposal]. Queensland University of Technology. <---My report--->