const express = require('express')
const app = express()
const cors = require("cors")
const port = 8081
require("dotenv").config()

app.use(cors());

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// // // //
// Routes
// // // //

// NFTs - General
const { fetchNFTMetadata, fetchWalletNFTs } = require("./routes/nfts");
app.get('/nft-metadata', fetchNFTMetadata)
app.get('/user-nfts', fetchWalletNFTs)

// Marketplace
const { fetchMarketItems, fetchMarketItem } = require('./routes/marketplace')
app.get('/market-items', fetchMarketItems)
app.get('/market-item', fetchMarketItem)

// Experiences
const { fetchExperiences } = require("./routes/experiences");
app.get('/experiences', fetchExperiences)

// Collections
const { fetchNFTCollections } = require("./routes/nft-collections");
app.get('/nft-collections', fetchNFTCollections)

// Token Prices
const { fetchTokenPrices } = require("./routes/token-prices");
app.get('/token-prices', fetchTokenPrices)

