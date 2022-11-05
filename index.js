const { ethers } = require("hardhat")
const { magicMarketplaceAddress } = require("./config")
const Moralis = require("moralis").default;
const MagicMarketplaceABI = require('./artifacts/contracts/MagicMarketplace.sol/MagicMarketplace.json')

const express = require('express')
const app = express()
const cors = require("cors")
const port = 8081
require("dotenv").config()

app.use(cors());

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})




// Routes

/*
  1. fetch marketplace nfts
  2. fetch current users nfts

  3. list item for sale
  4. buy item
  5. cancel listing
  6. update price for listing
  7. withdraw proceeds
*/

const provider = new ethers.providers.JsonRpcProvider('https://eth-goerli.g.alchemy.com/v2/13gtCuMjeWarnj3ekNo-9Y0NaWxhNzfA')

// 1. fetch marketplace nfts
app.get('/fetchMarketItems', async (req, res) => {
  const magicMarketplaceContract = new ethers.Contract(magicMarketplaceAddress, MagicMarketplaceABI.abi, provider)
  const marketItems = await magicMarketplaceContract.fetchMarketItems()
  console.log('marketItems', marketItems)

  let objects = []
  marketItems.map((item) => {
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

  res.send(objects)
  // res.send('hello')
})

// 2. load users nfts
app.get('/user-nfts', async (req, res) => {
  await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });

  try {
    //const { address, chain } = req.query;
    const address = "0xE8C53D9449c63c762e50Cfc876A24F9235C3A0A6"
    const chain = "5"

    const response = await Moralis.EvmApi.nft.getWalletNFTs({
      address: address,
      chain: chain,
    });

    res.send(response.data)
  } 
  catch (error){
    res.send(error)
  }
})


// 3. list item for sale
app.get('/list-nft', async (req, res) => {

})