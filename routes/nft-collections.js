const { 
  insideOutAddress,
  frozenAddress,
  disneyRandomAddress
} = require("../addresses")


async function fetchNFTCollections(req, res){
    // Core components inside each nft collection
    const abi = [
        "function getMintFee() public view returns(uint256)",
        "function requestNft() public payable returns(uint256 requestId)",
        "event NftRequested(uint256 indexed requestId, address requester)",
        "event NftMinted(Character character, address minter)"
    ]
    
    const collections = [
      {
        address: insideOutAddress,
        abi: abi,
        name: "Inside Out NFT",
        symbol: "INSO",
        description: "Mint one of your favorite emotions and use your new emotion to unlock new emotions in the Experiences tab or sell on the marketplace!"
      },
      {
        address: frozenAddress,
        abi: abi,
        name: "Frozen NFT",
        symbol: "FRZN",
        description: "Mint one of your favorite characters from Frozen and unlock new adventures in the Experiences tab or sell them on the marketplace!"
      },
      {
        address: disneyRandomAddress,
        abi: abi,
        name: "Disney Random NFT",
        symbol: "DIS",
        description: "Mint one of your favorite Disney Characters and use your new NFT to unlock new experiences in the Experiences tab or sell on the marketplace!"
      }
      ]
    res.send(collections)
}


module.exports = {
    fetchNFTCollections
}