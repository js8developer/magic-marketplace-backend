// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

error MagicMarketplace__PriceMustBeAboveZero();
error MagicMarketplace__NotApprovedForMarketplace();
error MagicMarketplace__AlreadyListed(address nftAddress, uint256 tokenId);
error MagicMarketplace__NotOwner();
error MagicMarketplace__NotListed(address nftAddress, uint256 tokenId);
error MagicMarketplace__PriceNotMet(address nftAddress, uint256 tokenId, uint256 price);
error MagicMarketplace__NoProceeds();
error MagicMarketplace__TransferFailed();


/** @title A contract for the Magic Marketplace
*   @author Jason Schneider
*   @notice This contract is to demo an NFT marketplace where users can buy and sell NFTs
*           on a decentralized marketplace.
*/

contract MagicMarketplace is ReentrancyGuard {

    struct MarketItem {
        uint itemId;
        address nftAddress;
        uint tokenId;
        address payable seller;
        address payable owner;
        uint price;
        bool sold;
    }

    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemCanceled(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId
    );

    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ProceedsCollected(
        address indexed account,
        uint256 amount
    );
  
    using Counters for Counters.Counter;
    Counters.Counter private s_itemIds;
    Counters.Counter private s_itemsSold;

    mapping(uint => MarketItem) private s_marketItems;
    mapping(address => mapping(uint256 => MarketItem)) private s_listings;
    mapping(address => uint) private s_proceeds;


    // // // // // // //
    // Modifiers
    // // // // // // //

    /**
    *   @notice This modifier checks to make sure the nft is not already listed.
    *   @param nftAddress The address of the nft 
    *   @param tokenId The tokenId of the nft
    *   @param owner The owner of the potential listing
    */
    modifier notListed(address nftAddress, uint256 tokenId, address owner) {
        // if it already has a price, that means it is already created. 
        MarketItem memory listing = s_listings[nftAddress][tokenId];
        if (listing.price > 0){
            revert MagicMarketplace__AlreadyListed(nftAddress, tokenId);
        }
        _;
    }

    /**
    *   @notice This modifier checks to make sure the caller is the owner of the nftAddress they are supplying.
    *   @param nftAddress The address of the nft 
    *   @param tokenId The tokenId of the nft
    *   @param spender The caller of the function
    */
    modifier isOwner(address nftAddress, uint256 tokenId, address spender) {
        // check to make sure the caller is the owner of the nftAddress they are supplying. 
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (spender != owner) {
            revert MagicMarketplace__NotOwner();
        }
        _;
    }
    
    /**
    *   @notice This modifier checks to see if the nft is already listed on the marketplace.
    *   @param nftAddress The address of the nft looking to be listed for sale on the marketplace
    *   @param tokenId The tokenId of the nft looking to be listed for sale on the marketplace
    */
    modifier isListed(
        address nftAddress,
        uint256 tokenId
    ) {
        // 
        MarketItem memory listing = s_listings[nftAddress][tokenId];
        if (listing.price <= 0){
            revert MagicMarketplace__NotListed(nftAddress, tokenId);
        }
        _;
    }


    // // // // // // //
    // Main Functions
    // // // // // // //

    /**
    *   @notice This function list NFTs on the marketplace
    *   @param nftAddress The address of the nft being listed for sale on the marketplace
    *   @param tokenId The tokenId of the nft being listed for sale on the marketplace
    *   @param price The listing price for this nft
    */
    function listItemForSale(
        address nftAddress, 
        uint tokenId, 
        uint price
        ) 
        external
        notListed(nftAddress, tokenId, msg.sender)
        isOwner(nftAddress, tokenId, msg.sender)
        {
        
        // listing price for more than 0 wei.
        if (price <= 0) {
            revert MagicMarketplace__PriceMustBeAboveZero();
        }

        // Check to see if the marketplace has been approved by the owner to transfer the nft if it sells. 
        if (nftIsApprovedForListing(nftAddress, tokenId) == false){
            revert MagicMarketplace__NotApprovedForMarketplace();
        }
        
        // Marketplace is approved, continue!

        // Increment the _itemsId so we can track how many items there have been and in order.
        s_itemIds.increment();
        uint itemId = s_itemIds.current();

        // Add market item to listings.
        s_listings[nftAddress][tokenId] = MarketItem(
            itemId,
            nftAddress,
            tokenId,
            payable(msg.sender),
            payable(address(this)),
            price,
            false
        );
        // Add market item to s_marketItems.
        s_marketItems[itemId] = MarketItem(
            itemId,
            nftAddress,
            tokenId,
            payable(msg.sender),
            payable(address(this)),
            price,
            false
        );

        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    /**
    *   @notice This function buys NFTs on the marketplace
    *   @param nftAddress The address of the nft looking to be purchased
    *   @param tokenId The tokenId of the nft looking to be purchased
    */
    function buyItem(address nftAddress, uint tokenId) 
    external 
    payable 
    isListed(nftAddress, tokenId)
    nonReentrant
    {
        // create listedItem in memory
        MarketItem memory listedItem = s_listings[nftAddress][tokenId];
        // check to see if the amount sent from the buyer is more than the listed price
        if (msg.value < listedItem.price){
            revert MagicMarketplace__PriceNotMet(nftAddress, tokenId, listedItem.price);
        }

        // increase the sellers proceeds by the msg.value amount
        s_proceeds[listedItem.seller] += msg.value;

        // delete the current listing for the nft to take it off the marketplace now that has been bought
        delete (s_listings[nftAddress][tokenId]);
        delete (s_marketItems[listedItem.itemId]);

        // increment s_itemsSold
        s_itemsSold.increment();
        
        // call safeTransferFrom
        IERC721(nftAddress).safeTransferFrom(listedItem.seller, msg.sender, tokenId);

        // emit item bought event
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    /**
    *   @notice This function cancels a current listing on the marketplace
    *   @param nftAddress The address of the nft listed
    *   @param tokenId The tokenId of the nft listed
    */
    function cancelListing(address nftAddress, uint256 tokenId) external
    isOwner(nftAddress, tokenId, msg.sender)
    isListed(nftAddress, tokenId)
    {
        MarketItem memory listedItem = s_listings[nftAddress][tokenId];
        delete (s_marketItems[listedItem.itemId]);
        delete(s_listings[nftAddress][tokenId]);
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    /**
    *   @notice This function updates the price of a current listing on the marketplace
    *   @param nftAddress The address of the nft listed
    *   @param tokenId The tokenId of the nft listed
    *   @param newPrice The new price that the user wants to list the nft for in ETH
    */
    function updateListing(address nftAddress, uint256 tokenId, uint256 newPrice) external
    isOwner(nftAddress, tokenId, msg.sender)
    isListed(nftAddress, tokenId)
    {
        MarketItem memory listedItem = s_listings[nftAddress][tokenId];
        s_marketItems[listedItem.itemId].price = newPrice;
        s_listings[nftAddress][tokenId].price = newPrice;
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }

    /**
    *   @notice This function withdraws the earnings for an accounts sold NFTs on the marketplace
    */
    function withdrawProceeds() external {
        uint256 proceeds = s_proceeds[msg.sender];
        if (proceeds <= 0){
            revert MagicMarketplace__NoProceeds();
        }
        s_proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: proceeds}("");
        if (!success){
            revert MagicMarketplace__TransferFailed();
        }
        
        emit ProceedsCollected(msg.sender, proceeds);
    }


    // // // // // // //
    // Getter Functions
    // // // // // // //

    /**
    *   @notice This function fetches the MarketItems currently listed on the marketplace
    *   @return MarketItems The MarketItems currently listed on the marketplace
    */
    function fetchMarketItems() public view returns (MarketItem[] memory){
        uint itemCount = s_itemIds.current();
        uint unsoldItemCount = itemCount - s_itemsSold.current();
        uint currentIndex = 0;

        MarketItem[] memory items = new MarketItem[](unsoldItemCount);

        for (uint i = 0; i < itemCount; i++){
            if (s_marketItems[i + 1].owner == address(this)){
                // Currently listed, yet to be sold...
                uint currentId = s_marketItems[i + 1].itemId;
                MarketItem storage currentItem = s_marketItems[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    /**
    *   @notice This function checks if the nft being listed is approved for listing on the marketplace
    *   @param nftAddress The address of the nft you want to look up
    *   @param tokenId The tokenId of the nft you want to look up
    *   @return isApproved If the nft is approved to be listed by the marketplace
    */
    function nftIsApprovedForListing(address nftAddress, uint tokenId) private view returns(bool){
         // create a nft object
        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)){
            return false;
        }
        return true;
    }

    /**
    *   @notice This function fetches a specific MarketItem currently listed on the marketplace based on itemId
    *   @param itemId The itemId of the MarketItem you want to look up
    *   @return MarketItem The MarketItem being searched for  
    */
    function fetchMarketItem(uint256 itemId) public view returns(MarketItem memory){
        return s_marketItems[itemId];
    }

    /**
    *   @notice This function fetches a specific MarketItem currently listed on the marketplace based on nftAddress and tokenId
    *   @param nftAddress The address of the nft you want to look up
    *   @param tokenId The tokenId of the nft you want to look up
    *   @return MarketItem The listing being searched for
    */
    function fetchListing(address nftAddress, uint256 tokenId) public view returns(MarketItem memory){
        return s_listings[nftAddress][tokenId];
    }

    /**
    *   @notice This function fetches the count of current items for sale on the marketplace
    *   @return ItemsForSaleCount The count of current items for sale on the marketplace
    */
    function fetchItemsForSaleCount() public view returns (uint256){
        uint itemCount = s_itemIds.current();
        uint unsoldItemCount = itemCount - s_itemsSold.current();
        return unsoldItemCount;
    }

    /**
    *   @notice This function fetches the count of items sold on the marketplace
    *   @return ItemsSoldCount The count of items sold on the marketplace
    */
    function fetchItemsSoldCount() public view returns (uint256){
        return s_itemsSold.current();
    }

    /**
    *   @notice This function fetches the earnings of an address from their sales on the marketplace
    *   @param _address The address of the wallet you want to fetch the earnings for
    *   @return Proceeds The earnings of the address passed
    */
    function fetchProceeds(address _address) public view returns(uint256){
        return s_proceeds[_address];
    }

}

