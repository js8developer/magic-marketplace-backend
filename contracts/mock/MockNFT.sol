// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MockNFT is ERC721 {
    
    using Counters for Counters.Counter;
    Counters.Counter private s_tokenIds;
    string private constant TOKEN_URI = "ipfs://QmQ9d84oKi9QBhGF6NtJwm1Yq1WkGH9Poac86Yhp9Vg9Wm";

    // State variables
    constructor() ERC721("MockNFT", "MOCK"){
    }

    function mintNft() public returns(uint256){
        // increment first! seen in openzeppelin contracts.
        s_tokenIds.increment();
        // mint nft
        uint256 newTokenId = s_tokenIds.current();
        _safeMint(msg.sender, newTokenId);
        return newTokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns(string memory){
        return TOKEN_URI;
    }

    function isNFTHolder(address _address) public view returns (bool) {
        // Check if the user owners an nft in this collection
        return balanceOf(_address) > 0;
    }

    function getBalanceForAddress(address _address) public view returns(uint256){
        return balanceOf(_address);
    }

    function getCurrentTokenCount() public view returns(uint256){
        return s_tokenIds.current();
    }

}
