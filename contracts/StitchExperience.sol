// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

interface I_StitchNft {
    function isNFTHolder(address _address) external view returns (bool);
    function getBalanceForAddress(address _address) external view returns(uint256);
}

error StitchExperience__DoesNotOwnNFTFromCollection();
error StitchExperience__AllTicketsHaveBeenClaimed();

contract StitchExperience is ERC721 {

    using Counters for Counters.Counter;
    Counters.Counter private s_tokenIds;
    string private constant TOKEN_URI = "ipfs://QmQ9d84oKi9QBhGF6NtJwm1Yq1WkGH9Poac86Yhp9Vg9Wm";

    // Events
    event TicketMinted(address indexed wallet, uint256 ticketsClaimed);

    // State variables
    address private s_stitchCollectionAddress;
    I_StitchNft private s_StitchNft;

    mapping(address => uint256) private addressToTickets;
    mapping(address => bool) private addressToCheckedIn;

    // // // // // // //
    // Constructor
    // // // // // // //

    constructor(address stitchCollectionAddress) ERC721("Stitch's Galactic Experience Ticket", "SGET"){
        s_stitchCollectionAddress = stitchCollectionAddress;
        s_StitchNft = I_StitchNft(s_stitchCollectionAddress);
    }

    // // // // // // //
    // Main Functions
    // // // // // // //

    function claimTicketToExperience() public {
        if (!walletHoldsNFT()){ revert StitchExperience__DoesNotOwnNFTFromCollection(); }
        if (ticketsLeftToClaim() < 1){ revert StitchExperience__AllTicketsHaveBeenClaimed(); }

        addressToTickets[msg.sender] += 1;
        mintNft();
    }

    function mintNft() private {
        // increment first! seen in openzeppelin contracts.
        s_tokenIds.increment();
        // mint nft
        uint256 newTokenId = s_tokenIds.current();
        _safeMint(msg.sender, newTokenId);

        emit TicketMinted(msg.sender, 1);
    }

    // // // // // // //
    // Getter Functions
    // // // // // // //

    function walletHoldsNFT() public view returns(bool){
        // Check StitchNft collection if the msg.sender owns an nft
        return s_StitchNft.isNFTHolder(msg.sender);
    }

    function maxTicketsAvailableForAddress() public view returns(uint256){
        return s_StitchNft.getBalanceForAddress(msg.sender);
    }
    
    function ticketsClaimedByAddress() public view returns(uint256){
        return addressToTickets[msg.sender];
    }

    function ticketsLeftToClaim() public view returns(uint256){
        return maxTicketsAvailableForAddress() - ticketsClaimedByAddress();
    }

}