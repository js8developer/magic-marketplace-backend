// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

interface I_RootNFT {
    function balanceOf(address owner) external view returns(uint256);
}

error KTTKExperience__DoesNotOwnNFTFromCollection();
error KTTKExperience__AllTicketsHaveBeenClaimed();

contract KTTKExperience is ERC721 {

    using Counters for Counters.Counter;
    Counters.Counter private s_tokenIds;

    // Events
    event TicketMinted(address indexed wallet, uint256 ticketsClaimed);

    // State variables
    address private s_nftCollectionAddress;
    I_RootNFT private s_RootNFT;

    mapping(address => uint256) private addressToTickets;
    mapping(address => bool) private addressToCheckedIn;

    // // // // // // //
    // Constructor
    // // // // // // //

    constructor(address nftCollectionAddress) ERC721("Keys To The Kingdom Ticket", "KTTK"){
        s_nftCollectionAddress = nftCollectionAddress;
        s_RootNFT = I_RootNFT(s_nftCollectionAddress);
    }

    // // // // // // //
    // Main Functions
    // // // // // // //

    function claimTicketToExperience() public {
        if (!walletHoldsNFT()){ revert KTTKExperience__DoesNotOwnNFTFromCollection(); }
        if (ticketsLeftToClaim() < 1){ revert KTTKExperience__AllTicketsHaveBeenClaimed(); }

        addressToTickets[msg.sender] += 1;
        mintNft();
    }

    function mintNft() private {
        s_tokenIds.increment();
        uint256 newTokenId = s_tokenIds.current();
        _safeMint(msg.sender, newTokenId);
        emit TicketMinted(msg.sender, 1);
    }

    // // // // // // //
    // Getter Functions
    // // // // // // //

    function walletHoldsNFT() public view returns(bool){
        return s_RootNFT.balanceOf(msg.sender) > 0;
    }

    function maxTicketsAvailableForAddress() public view returns(uint256){
        return s_RootNFT.balanceOf(msg.sender);
    }
    
    function ticketsClaimedByAddress() public view returns(uint256){
        return addressToTickets[msg.sender];
    }

    function ticketsLeftToClaim() public view returns(uint256){
        return maxTicketsAvailableForAddress() - ticketsClaimedByAddress();
    }

}