const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LedgerNode end-to-end flow", function () {
  let owner, auditor, regulator, manager, originator, alice, bob, carol, feeder1, feeder2, feeder3;
  let compliance, registry, exchange, usdc, oracle;

  const ONE_USDC = 1_000_000n; // 6 decimals
  const ONE_YEAR = 365n * 24n * 60n * 60n;
  const AUSTRALIA = 36;

  const PROOF_ALICE = ethers.keccak256(ethers.toUtf8Bytes("zkp:alice"));
  const PROOF_BOB = ethers.keccak256(ethers.toUtf8Bytes("zkp:bob"));
  const PROOF_CAROL = ethers.keccak256(ethers.toUtf8Bytes("zkp:carol"));
  const PROOF_ORIG = ethers.keccak256(ethers.toUtf8Bytes("zkp:originator"));

  const DEED_HASH = ethers.keccak256(ethers.toUtf8Bytes("deed:42-baker-st"));
  const SURVEY_HASH = ethers.keccak256(ethers.toUtf8Bytes("survey:42-baker-st"));
  const STRUCT_HASH = ethers.keccak256(ethers.toUtf8Bytes("struct:42-baker-st"));

  beforeEach(async function () {
    [owner, auditor, regulator, manager, originator, alice, bob, carol, feeder1, feeder2, feeder3] =
      await ethers.getSigners();

    const Compliance = await ethers.getContractFactory("ComplianceRegistry");
    compliance = await Compliance.deploy();

    const Registry = await ethers.getContractFactory("PropertyRegistry");
    registry = await Registry.deploy();

    const USDC = await ethers.getContractFactory("MockUSDC");
    usdc = await USDC.deploy();

    const Exchange = await ethers.getContractFactory("FractionalExchange");
    exchange = await Exchange.deploy(
      await registry.getAddress(),
      await compliance.getAddress(),
      await usdc.getAddress()
    );

    const Oracle = await ethers.getContractFactory("ValuationOracle");
    oracle = await Oracle.deploy();

    // Roles
    await compliance.setRegulator(regulator.address, true);
    await registry.setAuditor(auditor.address, true);
    await registry.setPropertyManager(manager.address, true);
    await oracle.setFeeder(feeder1.address, true);
    await oracle.setFeeder(feeder2.address, true);
    await oracle.setFeeder(feeder3.address, true);

    // Verify identities
    for (const [signer, proof] of [
      [originator, PROOF_ORIG],
      [alice, PROOF_ALICE],
      [bob, PROOF_BOB],
      [carol, PROOF_CAROL]
    ]) {
      await compliance
        .connect(regulator)
        .verifyIdentity(signer.address, AUSTRALIA, proof, ONE_YEAR);
    }
  });

  // -----------------------------------------------------------------------
  // ComplianceRegistry
  // -----------------------------------------------------------------------
  describe("ComplianceRegistry", function () {
    it("only regulators can verify identities", async function () {
      await expect(
        compliance.connect(alice).verifyIdentity(bob.address, AUSTRALIA, PROOF_BOB, ONE_YEAR)
      ).to.be.revertedWith("Only regulator");
    });

    it("marks a fresh verification as compliant", async function () {
      expect(await compliance.isCompliant(alice.address)).to.equal(true);
    });

    it("records the ZKP proof hash and jurisdiction", async function () {
      const id = await compliance.getIdentity(alice.address);
      expect(id.zkpProofHash).to.equal(PROOF_ALICE);
      expect(id.jurisdiction).to.equal(AUSTRALIA);
      expect(id.kycVerified).to.equal(true);
    });

    it("treats revoked users as non-compliant", async function () {
      await compliance.connect(regulator).revokeIdentity(alice.address);
      expect(await compliance.isCompliant(alice.address)).to.equal(false);
    });

    it("treats expired verifications as non-compliant", async function () {
      await compliance
        .connect(regulator)
        .verifyIdentity(alice.address, AUSTRALIA, PROOF_ALICE, 10n);
      await ethers.provider.send("evm_increaseTime", [11]);
      await ethers.provider.send("evm_mine");
      expect(await compliance.isCompliant(alice.address)).to.equal(false);
    });
  });

  // -----------------------------------------------------------------------
  // PropertyRegistry
  // -----------------------------------------------------------------------
  describe("PropertyRegistry", function () {
    it("requires a verification record before minting", async function () {
      await expect(
        registry
          .connect(auditor)
          .mintProperty(
            originator.address,
            ethers.ZeroHash,
            "ipfs://deed",
            "ipfs://survey",
            "ipfs://struct"
          )
      ).to.be.revertedWith("No verification");
    });

    it("auditor files a verification then mints", async function () {
      const tx = await registry
        .connect(auditor)
        .fileVerification(DEED_HASH, SURVEY_HASH, STRUCT_HASH);
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (l) => l.fragment && l.fragment.name === "VerificationFiled"
      );
      const verificationId = event.args.verificationId;

      await expect(
        registry
          .connect(auditor)
          .mintProperty(
            originator.address,
            verificationId,
            "ipfs://deed",
            "ipfs://survey",
            "ipfs://struct"
          )
      )
        .to.emit(registry, "PropertyMinted")
        .withArgs(1n, originator.address, verificationId);

      expect(await registry.ownerOf(1)).to.equal(originator.address);
    });

    it("rejects mint by non-auditor", async function () {
      const tx = await registry
        .connect(auditor)
        .fileVerification(DEED_HASH, SURVEY_HASH, STRUCT_HASH);
      const receipt = await tx.wait();
      const verificationId = receipt.logs.find(
        (l) => l.fragment && l.fragment.name === "VerificationFiled"
      ).args.verificationId;

      await expect(
        registry
          .connect(alice)
          .mintProperty(
            originator.address,
            verificationId,
            "ipfs://d",
            "ipfs://s",
            "ipfs://st"
          )
      ).to.be.revertedWith("Only auditor");
    });

    it("prevents reuse of a consumed verification", async function () {
      const tx = await registry
        .connect(auditor)
        .fileVerification(DEED_HASH, SURVEY_HASH, STRUCT_HASH);
      const verificationId = (await tx.wait()).logs.find(
        (l) => l.fragment && l.fragment.name === "VerificationFiled"
      ).args.verificationId;

      await registry
        .connect(auditor)
        .mintProperty(originator.address, verificationId, "ipfs://d", "ipfs://s", "ipfs://st");

      await expect(
        registry
          .connect(auditor)
          .mintProperty(originator.address, verificationId, "ipfs://d", "ipfs://s", "ipfs://st")
      ).to.be.revertedWith("Verification consumed");
    });

    it("property managers can update metadata", async function () {
      const tx = await registry
        .connect(auditor)
        .fileVerification(DEED_HASH, SURVEY_HASH, STRUCT_HASH);
      const verificationId = (await tx.wait()).logs.find(
        (l) => l.fragment && l.fragment.name === "VerificationFiled"
      ).args.verificationId;
      await registry
        .connect(auditor)
        .mintProperty(originator.address, verificationId, "ipfs://d", "ipfs://s", "ipfs://st");

      await expect(
        registry
          .connect(manager)
          .updateMetadata(1, "ipfs://d2", "ipfs://s2", "ipfs://st2")
      ).to.emit(registry, "MetadataUpdated");

      const p = await registry.getProperty(1);
      expect(p.deedURI).to.equal("ipfs://d2");
    });
  });

  // -----------------------------------------------------------------------
  // Helper for the next sections: mint property #1 to originator
  // -----------------------------------------------------------------------
  async function mintToOriginator() {
    const tx = await registry
      .connect(auditor)
      .fileVerification(DEED_HASH, SURVEY_HASH, STRUCT_HASH);
    const verificationId = (await tx.wait()).logs.find(
      (l) => l.fragment && l.fragment.name === "VerificationFiled"
    ).args.verificationId;
    await registry
      .connect(auditor)
      .mintProperty(
        originator.address,
        verificationId,
        "ipfs://deed",
        "ipfs://survey",
        "ipfs://struct"
      );
    return 1n;
  }

  // -----------------------------------------------------------------------
  // FractionalExchange: fractionalise + escrow
  // -----------------------------------------------------------------------
  describe("Fractionalisation and escrow", function () {
    it("locks the NFT and mints shares to the originator", async function () {
      const propertyId = await mintToOriginator();
      await registry
        .connect(originator)
        .setApprovalForAll(await exchange.getAddress(), true);

      await expect(exchange.connect(originator).fractionalise(propertyId, 10_000n))
        .to.emit(exchange, "Fractionalised")
        .withArgs(propertyId, originator.address, 10_000n);

      expect(await exchange.totalShares(propertyId)).to.equal(10_000n);
      expect(await exchange.balanceOfShares(propertyId, originator.address)).to.equal(10_000n);

      const p = await registry.getProperty(propertyId);
      expect(p.escrowed).to.equal(true);
      expect(p.escrowAgent).to.equal(await exchange.getAddress());
    });

    it("prevents transferFrom on the registry while escrowed", async function () {
      const propertyId = await mintToOriginator();
      await registry
        .connect(originator)
        .setApprovalForAll(await exchange.getAddress(), true);
      await exchange.connect(originator).fractionalise(propertyId, 10_000n);

      await expect(
        registry
          .connect(originator)
          .transferFrom(originator.address, alice.address, propertyId)
      ).to.be.revertedWith("Escrowed");
    });

    it("rejects fractionalise without approval", async function () {
      const propertyId = await mintToOriginator();
      await expect(
        exchange.connect(originator).fractionalise(propertyId, 10_000n)
      ).to.be.revertedWith("Exchange not approved");
    });

    it("rejects fractionalise by non-owner", async function () {
      const propertyId = await mintToOriginator();
      await registry
        .connect(originator)
        .setApprovalForAll(await exchange.getAddress(), true);
      await expect(
        exchange.connect(alice).fractionalise(propertyId, 10_000n)
      ).to.be.revertedWith("Not property owner");
    });

    it("rejects fractionalise by non-compliant originator", async function () {
      const propertyId = await mintToOriginator();
      await registry
        .connect(originator)
        .setApprovalForAll(await exchange.getAddress(), true);
      await compliance.connect(regulator).revokeIdentity(originator.address);
      await expect(
        exchange.connect(originator).fractionalise(propertyId, 10_000n)
      ).to.be.revertedWith("Originator not compliant");
    });
  });

  // -----------------------------------------------------------------------
  // ComplianceHook on transfers and trades
  // -----------------------------------------------------------------------
  describe("Compliance hook on share movement", function () {
    let propertyId;
    beforeEach(async function () {
      propertyId = await mintToOriginator();
      await registry
        .connect(originator)
        .setApprovalForAll(await exchange.getAddress(), true);
      await exchange.connect(originator).fractionalise(propertyId, 10_000n);
    });

    it("blocks transferShares when recipient is not compliant", async function () {
      // Make carol non-compliant
      await compliance.connect(regulator).revokeIdentity(carol.address);
      await expect(
        exchange.connect(originator).transferShares(propertyId, carol.address, 100n)
      ).to.be.revertedWith("To not compliant");
    });

    it("allows transferShares between two compliant users", async function () {
      await expect(
        exchange.connect(originator).transferShares(propertyId, alice.address, 250n)
      )
        .to.emit(exchange, "ShareTransfer")
        .withArgs(propertyId, originator.address, alice.address, 250n);

      expect(await exchange.balanceOfShares(propertyId, alice.address)).to.equal(250n);
      expect(await exchange.balanceOfShares(propertyId, originator.address)).to.equal(9_750n);
    });

    it("blocks a marketplace buy when the buyer is non-compliant", async function () {
      await exchange
        .connect(originator)
        .list(propertyId, 1_000n, ONE_USDC); // 1 USDC per share

      // Strip Alice of compliance, then she tries to buy
      await compliance.connect(regulator).revokeIdentity(alice.address);
      await usdc.mint(alice.address, 1_000n * ONE_USDC);
      await usdc.connect(alice).approve(await exchange.getAddress(), 1_000n * ONE_USDC);

      await expect(
        exchange.connect(alice).buy(1n, 100n)
      ).to.be.revertedWith("To not compliant");
    });
  });

  // -----------------------------------------------------------------------
  // Marketplace: list, buy, partial-fill, cancel
  // -----------------------------------------------------------------------
  describe("Peer-to-peer marketplace", function () {
    let propertyId;
    beforeEach(async function () {
      propertyId = await mintToOriginator();
      await registry
        .connect(originator)
        .setApprovalForAll(await exchange.getAddress(), true);
      await exchange.connect(originator).fractionalise(propertyId, 10_000n);
    });

    it("lists, partially fills, and updates remaining amount", async function () {
      await exchange.connect(originator).list(propertyId, 1_000n, 2n * ONE_USDC);

      await usdc.mint(alice.address, 600n * ONE_USDC);
      await usdc.connect(alice).approve(await exchange.getAddress(), 600n * ONE_USDC);

      await expect(exchange.connect(alice).buy(1n, 300n))
        .to.emit(exchange, "Purchased")
        .withArgs(1n, alice.address, 300n, 600n * ONE_USDC);

      expect(await exchange.balanceOfShares(propertyId, alice.address)).to.equal(300n);
      expect(await usdc.balanceOf(originator.address)).to.equal(600n * ONE_USDC);

      const l = await exchange.listings(1n);
      expect(l.amount).to.equal(700n);
      expect(l.active).to.equal(true);
    });

    it("deactivates listing when fully bought", async function () {
      await exchange.connect(originator).list(propertyId, 100n, ONE_USDC);
      await usdc.mint(alice.address, 100n * ONE_USDC);
      await usdc.connect(alice).approve(await exchange.getAddress(), 100n * ONE_USDC);
      await exchange.connect(alice).buy(1n, 100n);

      const l = await exchange.listings(1n);
      expect(l.active).to.equal(false);
    });

    it("seller can cancel their listing", async function () {
      await exchange.connect(originator).list(propertyId, 100n, ONE_USDC);
      await expect(exchange.connect(originator).cancelListing(1n))
        .to.emit(exchange, "ListingCancelled")
        .withArgs(1n);
    });

    it("rejects cancel by non-seller", async function () {
      await exchange.connect(originator).list(propertyId, 100n, ONE_USDC);
      await expect(exchange.connect(alice).cancelListing(1n)).to.be.revertedWith("Not seller");
    });
  });

  // -----------------------------------------------------------------------
  // Automated dividends
  // -----------------------------------------------------------------------
  describe("Automated dividends", function () {
    let propertyId;
    beforeEach(async function () {
      propertyId = await mintToOriginator();
      await registry
        .connect(originator)
        .setApprovalForAll(await exchange.getAddress(), true);
      await exchange.connect(originator).fractionalise(propertyId, 10_000n);

      // Distribute shares: originator 7000, alice 2000, bob 1000
      await exchange.connect(originator).transferShares(propertyId, alice.address, 2_000n);
      await exchange.connect(originator).transferShares(propertyId, bob.address, 1_000n);
    });

    it("distributes pro-rata, holders claim their share", async function () {
      // Manager deposits 1000 USDC of rental income
      const totalRental = 1_000n * ONE_USDC;
      await usdc.mint(manager.address, totalRental);
      await usdc.connect(manager).approve(await exchange.getAddress(), totalRental);
      await expect(exchange.connect(manager).automatedDividend(propertyId, totalRental))
        .to.emit(exchange, "DividendDeposited")
        .withArgs(propertyId, 0n, totalRental);

      // Alice holds 2000/10000 = 20%, should get 200 USDC
      await expect(exchange.connect(alice).claimDividend(propertyId, 0n))
        .to.emit(exchange, "DividendClaimed")
        .withArgs(propertyId, 0n, alice.address, 200n * ONE_USDC);
      expect(await usdc.balanceOf(alice.address)).to.equal(200n * ONE_USDC);

      // Bob: 10% = 100 USDC
      await exchange.connect(bob).claimDividend(propertyId, 0n);
      expect(await usdc.balanceOf(bob.address)).to.equal(100n * ONE_USDC);

      // Originator: 70% = 700 USDC
      await exchange.connect(originator).claimDividend(propertyId, 0n);
      expect(await usdc.balanceOf(originator.address)).to.equal(700n * ONE_USDC);
    });

    it("prevents double claim", async function () {
      await usdc.mint(manager.address, 1_000n * ONE_USDC);
      await usdc.connect(manager).approve(await exchange.getAddress(), 1_000n * ONE_USDC);
      await exchange.connect(manager).automatedDividend(propertyId, 1_000n * ONE_USDC);

      await exchange.connect(alice).claimDividend(propertyId, 0n);
      await expect(
        exchange.connect(alice).claimDividend(propertyId, 0n)
      ).to.be.revertedWith("Already claimed");
    });

    it("supports multiple dividend epochs independently", async function () {
      // Epoch 0
      await usdc.mint(manager.address, 500n * ONE_USDC);
      await usdc.connect(manager).approve(await exchange.getAddress(), 500n * ONE_USDC);
      await exchange.connect(manager).automatedDividend(propertyId, 500n * ONE_USDC);

      // Epoch 1
      await usdc.mint(manager.address, 1_500n * ONE_USDC);
      await usdc.connect(manager).approve(await exchange.getAddress(), 1_500n * ONE_USDC);
      await exchange.connect(manager).automatedDividend(propertyId, 1_500n * ONE_USDC);

      // Alice claims epoch 1: 20% of 1500 = 300
      await exchange.connect(alice).claimDividend(propertyId, 1n);
      expect(await usdc.balanceOf(alice.address)).to.equal(300n * ONE_USDC);
      // Then epoch 0: 20% of 500 = 100
      await exchange.connect(alice).claimDividend(propertyId, 0n);
      expect(await usdc.balanceOf(alice.address)).to.equal(400n * ONE_USDC);
    });
  });

  // -----------------------------------------------------------------------
  // Redeem
  // -----------------------------------------------------------------------
  describe("Redeem", function () {
    it("releases the NFT when one party holds 100% of shares", async function () {
      const propertyId = await mintToOriginator();
      await registry
        .connect(originator)
        .setApprovalForAll(await exchange.getAddress(), true);
      await exchange.connect(originator).fractionalise(propertyId, 10_000n);

      // Originator still holds all 10_000 shares; redeem directly
      await expect(exchange.connect(originator).redeem(propertyId))
        .to.emit(exchange, "Redeemed")
        .withArgs(propertyId, originator.address);

      const p = await registry.getProperty(propertyId);
      expect(p.escrowed).to.equal(false);
      expect(p.currentOwner).to.equal(originator.address);
      expect(await exchange.fractionalised(propertyId)).to.equal(false);
    });

    it("rejects redeem when caller doesn't hold all shares", async function () {
      const propertyId = await mintToOriginator();
      await registry
        .connect(originator)
        .setApprovalForAll(await exchange.getAddress(), true);
      await exchange.connect(originator).fractionalise(propertyId, 10_000n);

      await exchange.connect(originator).transferShares(propertyId, alice.address, 1n);

      await expect(
        exchange.connect(originator).redeem(propertyId)
      ).to.be.revertedWith("Need all shares");
    });
  });

  // -----------------------------------------------------------------------
  // ValuationOracle
  // -----------------------------------------------------------------------
  describe("ValuationOracle", function () {
    it("requires at least 3 feeders before returning a valuation", async function () {
      await oracle.connect(feeder1).submitValuation(1, 1_000_000n * ONE_USDC);
      await oracle.connect(feeder2).submitValuation(1, 1_100_000n * ONE_USDC);
      await expect(oracle.getValuation(1)).to.be.revertedWith("Insufficient feeds");

      await oracle.connect(feeder3).submitValuation(1, 1_200_000n * ONE_USDC);
      const [median] = await oracle.getValuation(1);
      expect(median).to.equal(1_100_000n * ONE_USDC); // median of the three
    });

    it("rejects non-feeder submissions", async function () {
      await expect(
        oracle.connect(alice).submitValuation(1, 1n)
      ).to.be.revertedWith("Only feeder");
    });
  });

  // -----------------------------------------------------------------------
  // Full end-to-end happy path
  // -----------------------------------------------------------------------
  describe("End-to-end flow", function () {
    it("verify -> mint -> fractionalise -> list -> buy -> dividend -> claim", async function () {
      // 1. Verification & mint
      const tx = await registry
        .connect(auditor)
        .fileVerification(DEED_HASH, SURVEY_HASH, STRUCT_HASH);
      const vid = (await tx.wait()).logs.find(
        (l) => l.fragment && l.fragment.name === "VerificationFiled"
      ).args.verificationId;
      await registry
        .connect(auditor)
        .mintProperty(
          originator.address,
          vid,
          "ipfs://deed",
          "ipfs://survey",
          "ipfs://struct"
        );
      const propertyId = 1n;

      // 2. Fractionalise (10,000 shares as report specifies)
      await registry
        .connect(originator)
        .setApprovalForAll(await exchange.getAddress(), true);
      await exchange.connect(originator).fractionalise(propertyId, 10_000n);

      // 3. List 5,000 shares at 100 USDC each
      await exchange.connect(originator).list(propertyId, 5_000n, 100n * ONE_USDC);

      // 4. Alice buys 2,000 shares (200,000 USDC)
      const aliceSpend = 200_000n * ONE_USDC;
      await usdc.mint(alice.address, aliceSpend);
      await usdc.connect(alice).approve(await exchange.getAddress(), aliceSpend);
      await exchange.connect(alice).buy(1n, 2_000n);

      expect(await exchange.balanceOfShares(propertyId, alice.address)).to.equal(2_000n);
      expect(await usdc.balanceOf(originator.address)).to.equal(aliceSpend);

      // 5. Bob buys 3,000 shares
      const bobSpend = 300_000n * ONE_USDC;
      await usdc.mint(bob.address, bobSpend);
      await usdc.connect(bob).approve(await exchange.getAddress(), bobSpend);
      await exchange.connect(bob).buy(1n, 3_000n);

      expect(await exchange.balanceOfShares(propertyId, bob.address)).to.equal(3_000n);

      // 6. Monthly rental income of 10,000 USDC distributed
      const rental = 10_000n * ONE_USDC;
      await usdc.mint(manager.address, rental);
      await usdc.connect(manager).approve(await exchange.getAddress(), rental);
      await exchange.connect(manager).automatedDividend(propertyId, rental);

      // 7. Claims (originator 50%, alice 20%, bob 30%)
      await exchange.connect(alice).claimDividend(propertyId, 0n);
      await exchange.connect(bob).claimDividend(propertyId, 0n);

      // Alice received 20% of 10,000 = 2,000 USDC (her balance was 0 after spending)
      expect(await usdc.balanceOf(alice.address)).to.equal(2_000n * ONE_USDC);
      // Bob received 30% = 3,000 USDC
      expect(await usdc.balanceOf(bob.address)).to.equal(3_000n * ONE_USDC);
    });
  });
});
