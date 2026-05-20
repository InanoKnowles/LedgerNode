// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// -----------------------------------------------------------------------
// PropertyRegistry: the home register.
// ERC-721-style contract where each verified property is a unique NFT.
// An auditor has to file a verification record first (hashes of the deed,
// survey, and structural report) before a property can be minted; that
// record can only be used once, so every mint is provably backed by an
// off-chain inspection. Properties get locked in escrow when the exchange
// fractionalises them, and stay frozen until 100% of the shares are
// redeemed. No transfers allowed while escrowed.
// -----------------------------------------------------------------------

contract PropertyRegistry {
    address public owner;

    mapping(address => bool) public auditors;
    mapping(address => bool) public propertyManagers;

    struct VerificationRecord {
        address auditor;
        bytes32 deedHash;         
        bytes32 surveyHash;        
        bytes32 structuralHash; 
        uint64 verifiedAt;
        bool consumed;            
        bool exists;
    }

    struct Property {
        uint256 id;
        address currentOwner;
        string deedURI;            
        string surveyURI;          
        string structuralURI;      
        bytes32 verificationId;    
        bool escrowed;            
        address escrowAgent;      
        bool exists;
    }

    uint256 public nextPropertyId = 1;

    mapping(bytes32 => VerificationRecord) private verifications;
    mapping(uint256 => Property) private properties;
    mapping(uint256 => address) private tokenApprovals;
    mapping(address => mapping(address => bool)) private operatorApprovals;

    event AuditorSet(address indexed auditor, bool approved);
    event PropertyManagerSet(address indexed manager, bool approved);
    event VerificationFiled(
        bytes32 indexed verificationId,
        address indexed auditor,
        bytes32 deedHash
    );
    event PropertyMinted(
        uint256 indexed propertyId,
        address indexed to,
        bytes32 indexed verificationId
    );
    event MetadataUpdated(uint256 indexed propertyId, string deedURI, string surveyURI, string structuralURI);
    event PropertyEscrowed(uint256 indexed propertyId, address indexed escrowAgent);
    event PropertyReleased(uint256 indexed propertyId, address indexed releasedTo);
    event Approval(address indexed owner, address indexed approved, uint256 indexed propertyId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event Transfer(address indexed from, address indexed to, uint256 indexed propertyId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuditor() {
        require(auditors[msg.sender] || msg.sender == owner, "Only auditor");
        _;
    }

    modifier propertyExists(uint256 propertyId) {
        require(properties[propertyId].exists, "Property does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
        auditors[msg.sender] = true;
        propertyManagers[msg.sender] = true;
    }

    function setAuditor(address auditor, bool approved) external onlyOwner {
        require(auditor != address(0), "Invalid address");
        auditors[auditor] = approved;
        emit AuditorSet(auditor, approved);
    }

    function setPropertyManager(address manager, bool approved) external onlyOwner {
        require(manager != address(0), "Invalid address");
        propertyManagers[manager] = approved;
        emit PropertyManagerSet(manager, approved);
    }

    function fileVerification(
        bytes32 deedHash,
        bytes32 surveyHash,
        bytes32 structuralHash
    ) external onlyAuditor returns (bytes32 verificationId) {
        require(deedHash != bytes32(0), "Deed required");
        require(surveyHash != bytes32(0), "Survey required");
        require(structuralHash != bytes32(0), "Structural required");

        verificationId = keccak256(
            abi.encodePacked(msg.sender, deedHash, surveyHash, structuralHash, block.timestamp)
        );
        require(!verifications[verificationId].exists, "Already filed");

        verifications[verificationId] = VerificationRecord({
            auditor: msg.sender,
            deedHash: deedHash,
            surveyHash: surveyHash,
            structuralHash: structuralHash,
            verifiedAt: uint64(block.timestamp),
            consumed: false,
            exists: true
        });

        emit VerificationFiled(verificationId, msg.sender, deedHash);
    }

    function mintProperty(
        address to,
        bytes32 verificationId,
        string calldata deedURI,
        string calldata surveyURI,
        string calldata structuralURI
    ) external onlyAuditor returns (uint256) {
        require(to != address(0), "Invalid owner");
        require(bytes(deedURI).length > 0, "Deed URI required");
        require(bytes(surveyURI).length > 0, "Survey URI required");
        require(bytes(structuralURI).length > 0, "Structural URI required");

        VerificationRecord storage v = verifications[verificationId];
        require(v.exists, "No verification");
        require(!v.consumed, "Verification consumed");
        require(v.auditor == msg.sender, "Not your verification");

        v.consumed = true;

        uint256 propertyId = nextPropertyId;
        nextPropertyId++;

        properties[propertyId] = Property({
            id: propertyId,
            currentOwner: to,
            deedURI: deedURI,
            surveyURI: surveyURI,
            structuralURI: structuralURI,
            verificationId: verificationId,
            escrowed: false,
            escrowAgent: address(0),
            exists: true
        });

        emit PropertyMinted(propertyId, to, verificationId);
        emit Transfer(address(0), to, propertyId);

        return propertyId;
    }

    function updateMetadata(
        uint256 propertyId,
        string calldata deedURI,
        string calldata surveyURI,
        string calldata structuralURI
    ) external propertyExists(propertyId) {
        require(
            propertyManagers[msg.sender] ||
            auditors[msg.sender] ||
            msg.sender == owner,
            "Not authorised"
        );
        require(bytes(deedURI).length > 0, "Deed URI required");

        Property storage p = properties[propertyId];
        p.deedURI = deedURI;
        p.surveyURI = surveyURI;
        p.structuralURI = structuralURI;

        emit MetadataUpdated(propertyId, deedURI, surveyURI, structuralURI);
    }

    function lockEscrow(uint256 propertyId) external propertyExists(propertyId) {
        Property storage p = properties[propertyId];
        require(!p.escrowed, "Already escrowed");

        address propertyOwner = p.currentOwner;
        bool authorised =
            tokenApprovals[propertyId] == msg.sender ||
            operatorApprovals[propertyOwner][msg.sender];
        require(authorised, "Not approved as escrow agent");

        p.escrowed = true;
        p.escrowAgent = msg.sender;

        emit PropertyEscrowed(propertyId, msg.sender);
    }

    function releaseEscrow(uint256 propertyId, address to) external propertyExists(propertyId) {
        Property storage p = properties[propertyId];
        require(p.escrowed, "Not escrowed");
        require(p.escrowAgent == msg.sender, "Not escrow agent");
        require(to != address(0), "Invalid recipient");

        address from = p.currentOwner;
        p.currentOwner = to;
        p.escrowed = false;
        p.escrowAgent = address(0);
        delete tokenApprovals[propertyId];

        emit Transfer(from, to, propertyId);
        emit PropertyReleased(propertyId, to);
    }

    function ownerOf(uint256 propertyId) external view propertyExists(propertyId) returns (address) {
        return properties[propertyId].currentOwner;
    }

    function getProperty(uint256 propertyId) external view propertyExists(propertyId) returns (Property memory) {
        return properties[propertyId];
    }

    function getVerification(bytes32 verificationId) external view returns (VerificationRecord memory) {
        return verifications[verificationId];
    }

    function approve(address to, uint256 propertyId) external propertyExists(propertyId) {
        Property storage p = properties[propertyId];
        require(!p.escrowed, "Escrowed");
        address propertyOwner = p.currentOwner;
        require(
            msg.sender == propertyOwner || operatorApprovals[propertyOwner][msg.sender],
            "Not authorised"
        );

        tokenApprovals[propertyId] = to;
        emit Approval(propertyOwner, to, propertyId);
    }

    function setApprovalForAll(address operator, bool approved) external {
        require(operator != address(0), "Invalid operator");
        operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address propertyOwner, address operator) external view returns (bool) {
        return operatorApprovals[propertyOwner][operator];
    }

    function getApproved(uint256 propertyId) external view propertyExists(propertyId) returns (address) {
        return tokenApprovals[propertyId];
    }

    function transferFrom(address from, address to, uint256 propertyId) external propertyExists(propertyId) {
        Property storage p = properties[propertyId];
        require(!p.escrowed, "Escrowed");
        require(to != address(0), "Invalid recipient");
        require(p.currentOwner == from, "Wrong owner");

        bool authorised =
            msg.sender == from ||
            tokenApprovals[propertyId] == msg.sender ||
            operatorApprovals[from][msg.sender];
        require(authorised, "Not authorised");

        p.currentOwner = to;
        delete tokenApprovals[propertyId];

        emit Transfer(from, to, propertyId);
    }
}
