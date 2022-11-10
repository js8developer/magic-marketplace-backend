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
app.get('/nftMetadata', fetchNFTMetadata)
app.get('/user-nfts', fetchWalletNFTs)


// Marketplace
const { fetchMarketItems, fetchMarketItem } = require('./routes/marketplace')
app.get('/fetchMarketItems', fetchMarketItems)
app.get('/fetchMarketItem', fetchMarketItem)


// Experiences
const { fetchExperiences } = require("./routes/experiences");
app.get('/experiences', fetchExperiences)

