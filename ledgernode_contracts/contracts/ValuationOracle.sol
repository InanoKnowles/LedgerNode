// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// -----------------------------------------------------------------------
// ValuationOracle: the independent price feed.
// Authorised feeders submit valuations for each property, and the contract
// returns the median once at least three have weighed in. Same median-of-
// multiple-sources pattern Chainlink uses, just smaller scale. One bad
// feeder can't move the answer; you'd have to corrupt the majority. This
// is the structural placeholder for a real Chainlink integration; the
// interface stays the same.
// -----------------------------------------------------------------------

contract ValuationOracle {
    address public owner;
    uint8 public constant MIN_FEEDS = 3;

    mapping(address => bool) public feeders;
    mapping(uint256 => mapping(address => uint256)) private latestPerFeeder;
    mapping(uint256 => address[]) private feederIndex;
    mapping(uint256 => mapping(address => bool)) private hasSubmitted;
    mapping(uint256 => uint64) public lastUpdated;

    event FeederSet(address indexed feeder, bool approved);
    event ValuationSubmitted(uint256 indexed propertyId, address indexed feeder, uint256 value);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyFeeder() {
        require(feeders[msg.sender], "Only feeder");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setFeeder(address feeder, bool approved) external onlyOwner {
        require(feeder != address(0), "Invalid address");
        feeders[feeder] = approved;
        emit FeederSet(feeder, approved);
    }

    function submitValuation(uint256 propertyId, uint256 value) external onlyFeeder {
        require(value > 0, "Zero value");

        if (!hasSubmitted[propertyId][msg.sender]) {
            hasSubmitted[propertyId][msg.sender] = true;
            feederIndex[propertyId].push(msg.sender);
        }

        latestPerFeeder[propertyId][msg.sender] = value;
        lastUpdated[propertyId] = uint64(block.timestamp);

        emit ValuationSubmitted(propertyId, msg.sender, value);
    }

    function getValuation(uint256 propertyId) external view returns (uint256 medianValue, uint64 updatedAt) {
        address[] memory list = feederIndex[propertyId];
        uint256 n = list.length;
        require(n >= MIN_FEEDS, "Insufficient feeds");

        uint256[] memory values = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            values[i] = latestPerFeeder[propertyId][list[i]];
        }

        for (uint256 i = 1; i < n; i++) {
            uint256 key = values[i];
            uint256 j = i;
            while (j > 0 && values[j - 1] > key) {
                values[j] = values[j - 1];
                j--;
            }
            values[j] = key;
        }

        medianValue = (n % 2 == 1) ? values[n / 2] : (values[n / 2 - 1] + values[n / 2]) / 2;
        updatedAt = lastUpdated[propertyId];
    }
}
