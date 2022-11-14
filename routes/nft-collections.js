const { disneyRandomAddress } = require('../addresses/DisneyRandomNFT')

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
          address: disneyRandomAddress,
          abi: abi,
          name: "Disney Random NFT",
          symbol: "DIS",
          description: "Mint one of your favorite Disney Characters and use your new NFT to unlock new experiences in the experiences tab or sell on the marketplace!"
        }
      ]
    res.send(collections)
}


module.exports = {
    fetchNFTCollections
}