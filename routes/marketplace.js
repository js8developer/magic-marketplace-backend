const { ethers } = require("hardhat")

const { magicMarketplaceAddress } = require("../addresses/MagicMarketplace")
const MagicMarketplaceABI = require('../artifacts/contracts/MagicMarketplace.sol/MagicMarketplace.json')


async function fetchMarketItems(req, res){
    const provider = new ethers.providers.JsonRpcProvider(process.env.GOERLI_RPC_URL)
    const magicMarketplaceContract = new ethers.Contract(magicMarketplaceAddress, MagicMarketplaceABI.abi, provider)
    const marketItems = await magicMarketplaceContract.fetchMarketItems()
    let objects = await processMarketItems(marketItems)
    res.send(objects)
}

async function fetchMarketItem(req, res){
    const provider = new ethers.providers.JsonRpcProvider(process.env.GOERLI_RPC_URL)
    const magicMarketplaceContract = new ethers.Contract(magicMarketplaceAddress, MagicMarketplaceABI.abi, provider)
    const { itemId } = req.query;
    const marketItem = await magicMarketplaceContract.fetchMarketItem(itemId)
    let itemObject = {
      itemId: marketItem.itemId.toString(),
      nftAddress: marketItem.nftAddress.toString(),
      tokenId: marketItem.tokenId.toString(),
      seller: marketItem.seller,
      owner: marketItem.owner,
      price: marketItem.price.toString(),
      sold: marketItem.sold
    }
    res.send(itemObject)
}

async function processMarketItems(marketItems){
    let objects = []
    marketItems.map(async (item) => {
      let itemObject = {
        itemId: item.itemId.toString(),
        nftAddress: item.nftAddress.toString(),
        tokenId: item.tokenId.toString(),
        seller: item.seller,
        owner: item.owner,
        price: item.price.toString(),
        sold: item.sold
      }
      objects.push(itemObject)
    })
    return objects
}

module.exports = {
    fetchMarketItems,
    fetchMarketItem
}