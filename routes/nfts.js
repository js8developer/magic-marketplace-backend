const Moralis = require("moralis").default;

async function fetchNFTMetadata(req, res){
    await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });
  
    try {
      const { nftAddress, tokenId, chain } = req.query;
      const response = await Moralis.EvmApi.nft.getNFTMetadata({
        address: nftAddress,
        chain: chain,
        tokenId: tokenId
      });
  
      res.send(response.data);
    } 
    catch (error){
      res.send(error)
    }
}

async function fetchWalletNFTs(req, res){
    await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });
  
    try {
      const { address, chain } = req.query;
  
      const response = await Moralis.EvmApi.nft.getWalletNFTs({
        address: address,
        chain: chain,
      });
  
      res.send(response.data)
    } 
    catch (error){
      res.send(error)
    }
}

module.exports = {
    fetchNFTMetadata,
    fetchWalletNFTs
}