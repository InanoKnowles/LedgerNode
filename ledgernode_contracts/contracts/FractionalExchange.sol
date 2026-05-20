// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// -----------------------------------------------------------------------
// FractionalExchange: the marketplace.
// Locks a property NFT in escrow and mints shares against it (ERC-1155
// style, one contract handles every property). Runs the buy/sell listings,
// distributes rent pro-rata to slice owners, and lets someone holding
// 100% of the shares redeem the NFT back. Calls the compliance hook on
// every share movement, so non-verified wallets are blocked at the
// protocol level. This is where the action happens.
// -----------------------------------------------------------------------

interface IPropertyRegistry {
    function ownerOf(uint256 propertyId) external view returns (address);
    function getApproved(uint256 propertyId) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function lockEscrow(uint256 propertyId) external;
    function releaseEscrow(uint256 propertyId, address to) external;
}

interface IComplianceRegistry {
    function isCompliant(address user) external view returns (bool);
}

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract FractionalExchange {
    address public owner;

    IPropertyRegistry public immutable propertyRegistry;
    IComplianceRegistry public immutable complianceRegistry;
    IERC20 public immutable stablecoin;

    mapping(uint256 => uint256) public totalShares;
    mapping(uint256 => mapping(address => uint256)) private shareBalances;
    mapping(uint256 => address[]) private holderIndex;       
    mapping(uint256 => mapping(address => bool)) private isHolder;
    mapping(uint256 => bool) public fractionalised;
    mapping(uint256 => address) public originator;         

    struct Listing {
        uint256 propertyId;
        address seller;
        uint256 amount;             
        uint256 pricePerShare;      
        bool active;
    }
    uint256 public nextListingId = 1;
    mapping(uint256 => Listing) public listings;

    struct Dividend {
        uint256 totalAmount;
        uint256 totalSharesSnapshot;
        uint64 distributedAt;
        mapping(address => bool) claimed;
    }
    mapping(uint256 => mapping(uint256 => Dividend)) private dividends;
    mapping(uint256 => uint256) public nextDividendEpoch;

    event Fractionalised(uint256 indexed propertyId, address indexed originator, uint256 supply);
    event ShareTransfer(uint256 indexed propertyId, address indexed from, address indexed to, uint256 amount);
    event Listed(uint256 indexed listingId, uint256 indexed propertyId, address indexed seller, uint256 amount, uint256 pricePerShare);
    event ListingCancelled(uint256 indexed listingId);
    event Purchased(uint256 indexed listingId, address indexed buyer, uint256 amount, uint256 totalPaid);
    event DividendDeposited(uint256 indexed propertyId, uint256 indexed epoch, uint256 amount);
    event DividendClaimed(uint256 indexed propertyId, uint256 indexed epoch, address indexed holder, uint256 amount);
    event Redeemed(uint256 indexed propertyId, address indexed redeemer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address _propertyRegistry, address _complianceRegistry, address _stablecoin) {
        require(_propertyRegistry != address(0), "Invalid registry");
        require(_complianceRegistry != address(0), "Invalid compliance");
        require(_stablecoin != address(0), "Invalid stablecoin");

        owner = msg.sender;
        propertyRegistry = IPropertyRegistry(_propertyRegistry);
        complianceRegistry = IComplianceRegistry(_complianceRegistry);
        stablecoin = IERC20(_stablecoin);
    }

    function fractionalise(uint256 propertyId, uint256 supply) external {
        require(!fractionalised[propertyId], "Already fractionalised");
        require(supply > 0, "Supply must be > 0");
        require(complianceRegistry.isCompliant(msg.sender), "Originator not compliant");

        address propOwner = propertyRegistry.ownerOf(propertyId);
        require(propOwner == msg.sender, "Not property owner");

        bool approved =
            propertyRegistry.getApproved(propertyId) == address(this) ||
            propertyRegistry.isApprovedForAll(propOwner, address(this));
        require(approved, "Exchange not approved");

        propertyRegistry.lockEscrow(propertyId);

        fractionalised[propertyId] = true;
        originator[propertyId] = msg.sender;
        totalShares[propertyId] = supply;
        _creditShares(propertyId, msg.sender, supply);

        emit Fractionalised(propertyId, msg.sender, supply);
        emit ShareTransfer(propertyId, address(0), msg.sender, supply);
    }

    function transferShares(uint256 propertyId, address to, uint256 amount) external {
        _complianceHook(msg.sender, to);
        _moveShares(propertyId, msg.sender, to, amount);
    }

    function balanceOfShares(uint256 propertyId, address account) external view returns (uint256) {
        return shareBalances[propertyId][account];
    }

    function holdersOf(uint256 propertyId) external view returns (address[] memory) {
        return holderIndex[propertyId];
    }

    function list(uint256 propertyId, uint256 amount, uint256 pricePerShare) external returns (uint256 listingId) {
        require(amount > 0, "Zero amount");
        require(pricePerShare > 0, "Zero price");
        require(shareBalances[propertyId][msg.sender] >= amount, "Insufficient shares");
        require(complianceRegistry.isCompliant(msg.sender), "Seller not compliant");

        listingId = nextListingId++;
        listings[listingId] = Listing({
            propertyId: propertyId,
            seller: msg.sender,
            amount: amount,
            pricePerShare: pricePerShare,
            active: true
        });

        emit Listed(listingId, propertyId, msg.sender, amount, pricePerShare);
    }

    function cancelListing(uint256 listingId) external {
        Listing storage l = listings[listingId];
        require(l.active, "Inactive");
        require(l.seller == msg.sender, "Not seller");
        l.active = false;
        emit ListingCancelled(listingId);
    }

    function buy(uint256 listingId, uint256 amount) external {
        Listing storage l = listings[listingId];
        require(l.active, "Inactive");
        require(amount > 0 && amount <= l.amount, "Invalid amount");

        _complianceHook(l.seller, msg.sender);

        uint256 totalPrice = amount * l.pricePerShare;
        require(
            stablecoin.transferFrom(msg.sender, l.seller, totalPrice),
            "Stablecoin transfer failed"
        );

        l.amount -= amount;
        if (l.amount == 0) l.active = false;

        _moveShares(l.propertyId, l.seller, msg.sender, amount);

        emit Purchased(listingId, msg.sender, amount, totalPrice);
    }

    function automatedDividend(uint256 propertyId, uint256 amount) external {
        require(fractionalised[propertyId], "Not fractionalised");
        require(amount > 0, "Zero amount");

        require(
            stablecoin.transferFrom(msg.sender, address(this), amount),
            "Stablecoin transfer failed"
        );

        uint256 epoch = nextDividendEpoch[propertyId]++;
        Dividend storage d = dividends[propertyId][epoch];
        d.totalAmount = amount;
        d.totalSharesSnapshot = totalShares[propertyId];
        d.distributedAt = uint64(block.timestamp);

        emit DividendDeposited(propertyId, epoch, amount);
    }

    function claimDividend(uint256 propertyId, uint256 epoch) external {
        Dividend storage d = dividends[propertyId][epoch];
        require(d.distributedAt != 0, "No such epoch");
        require(!d.claimed[msg.sender], "Already claimed");

        uint256 bal = shareBalances[propertyId][msg.sender];
        require(bal > 0, "No shares");

        uint256 payout = (d.totalAmount * bal) / d.totalSharesSnapshot;
        require(payout > 0, "Zero payout");

        d.claimed[msg.sender] = true;
        require(stablecoin.transfer(msg.sender, payout), "Payout failed");

        emit DividendClaimed(propertyId, epoch, msg.sender, payout);
    }

    function hasClaimed(uint256 propertyId, uint256 epoch, address holder) external view returns (bool) {
        return dividends[propertyId][epoch].claimed[holder];
    }

    function getDividend(uint256 propertyId, uint256 epoch)
        external
        view
        returns (uint256 totalAmount, uint256 totalSharesSnapshot, uint64 distributedAt)
    {
        Dividend storage d = dividends[propertyId][epoch];
        return (d.totalAmount, d.totalSharesSnapshot, d.distributedAt);
    }

    function redeem(uint256 propertyId) external {
        require(fractionalised[propertyId], "Not fractionalised");
        uint256 total = totalShares[propertyId];
        require(shareBalances[propertyId][msg.sender] == total, "Need all shares");
        require(complianceRegistry.isCompliant(msg.sender), "Not compliant");

        shareBalances[propertyId][msg.sender] = 0;
        totalShares[propertyId] = 0;
        fractionalised[propertyId] = false;

        propertyRegistry.releaseEscrow(propertyId, msg.sender);

        emit ShareTransfer(propertyId, msg.sender, address(0), total);
        emit Redeemed(propertyId, msg.sender);
    }

    function _complianceHook(address from, address to) internal view {
        require(complianceRegistry.isCompliant(from), "From not compliant");
        require(complianceRegistry.isCompliant(to), "To not compliant");
    }

    function _moveShares(uint256 propertyId, address from, address to, uint256 amount) internal {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Zero amount");
        require(shareBalances[propertyId][from] >= amount, "Insufficient shares");

        shareBalances[propertyId][from] -= amount;
        _creditShares(propertyId, to, amount);

        emit ShareTransfer(propertyId, from, to, amount);
    }

    function _creditShares(uint256 propertyId, address to, uint256 amount) internal {
        if (!isHolder[propertyId][to]) {
            isHolder[propertyId][to] = true;
            holderIndex[propertyId].push(to);
        }
        shareBalances[propertyId][to] += amount;
    }
}
