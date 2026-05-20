// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// -----------------------------------------------------------------------
// ComplianceRegistry: the guest list.
// Regulators verify wallets here (with KYC, AML, a ZKP proof hash, an
// expiry, and a revoke switch), and the exchange asks this contract
// "is this person okay?" before every single trade. If the answer is
// no, the trade reverts. That's the whole pitch.
// -----------------------------------------------------------------------
contract ComplianceRegistry {
    address public owner;

    mapping(address => bool) public regulators;

    struct Identity {
        bool kycVerified;          
        bool amlCleared;           
        bytes32 zkpProofHash;       
        uint16 jurisdiction;       
        uint64 verifiedAt;        
        uint64 expiresAt;          
        bool revoked;              
    }

    mapping(address => Identity) private identities;

    event RegulatorSet(address indexed regulator, bool approved);
    event IdentityVerified(
        address indexed user,
        uint16 jurisdiction,
        bytes32 zkpProofHash,
        uint64 expiresAt
    );
    event IdentityRevoked(address indexed user);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyRegulator() {
        require(regulators[msg.sender] || msg.sender == owner, "Only regulator");
        _;
    }

    constructor() {
        owner = msg.sender;
        regulators[msg.sender] = true;
    }

    function setRegulator(address regulator, bool approved) external onlyOwner {
        require(regulator != address(0), "Invalid address");
        regulators[regulator] = approved;
        emit RegulatorSet(regulator, approved);
    }

    function verifyIdentity(
        address user,
        uint16 jurisdiction,
        bytes32 zkpProofHash,
        uint64 validityPeriod
    ) external onlyRegulator {
        require(user != address(0), "Invalid address");
        require(zkpProofHash != bytes32(0), "Proof required");
        require(validityPeriod > 0, "Validity required");

        uint64 expires = uint64(block.timestamp) + validityPeriod;

        identities[user] = Identity({
            kycVerified: true,
            amlCleared: true,
            zkpProofHash: zkpProofHash,
            jurisdiction: jurisdiction,
            verifiedAt: uint64(block.timestamp),
            expiresAt: expires,
            revoked: false
        });

        emit IdentityVerified(user, jurisdiction, zkpProofHash, expires);
    }

    function revokeIdentity(address user) external onlyRegulator {
        require(identities[user].kycVerified, "Not verified");
        identities[user].revoked = true;
        emit IdentityRevoked(user);
    }

    function isCompliant(address user) external view returns (bool) {
        Identity memory id = identities[user];
        if (!id.kycVerified || !id.amlCleared) return false;
        if (id.revoked) return false;
        if (id.expiresAt <= block.timestamp) return false;
        return true;
    }

    function getIdentity(address user) external view returns (Identity memory) {
        return identities[user];
    }
}
