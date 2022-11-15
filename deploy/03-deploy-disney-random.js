const { networkConfig } = require("../helper-hardhat-config")
const { network, ethers } = require("hardhat")
const { verify } = require("../utils/verify")
const { storeImages, storeTokenUriMetadata } = require("../utils/uploadToPinata")
const fs = require('fs');

const imagesLocation = "./images/DisneyRandom"
const metadataTemplate = {
    name: "Disney Random",
    description: "Your first favorites, now on the blockchain!",
    image: "",
    attributes: [
        {
            trait_type: "Rarity",
            value: "Super Rare",
        },
    ]
}
// Uploading Goofy...
// Uploading Mickey...
// Uploading Minnie...
let tokenUris = [
    'ipfs://QmTo6jdxBibW15yELBiFNED1FNodJ3SHoyQ43qo2shvnnj',
    'ipfs://QmZaovPz9ZPfbfyasBocXQRwH2xMiDnU2vxPtFK2aP2j86',
    'ipfs://QmdW6y7aWD4vECuXSedAMbsNwKDNNc6VjUdfpYLjg49yni'
]
const FUND_AMOUNT = "1000000000000000000000" // 10 LINK token

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    
    // get the ipfs hashes of our images
    if (process.env.UPLOAD_TO_PINATA == "true"){
        tokenUris = await handleTokenUris()
    }

    log("--------------------------------------------")

    let vrfCoordinatorV2Address, subscriptionId

    if (chainId == 31337) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const tx = await vrfCoordinatorV2Mock.createSubscription()
        const txReceipt = await tx.wait(1)
        subscriptionId = txReceipt.events[0].args.subId
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
        subscriptionId = networkConfig[chainId].subscriptionId
    }

    log("--------------------------------------------")

    const args = [
        vrfCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].callbackGasLimit,
        tokenUris,
        networkConfig[chainId].mintFee
    ]
    const disneyRandomNFT = await deploy("DisneyRandomNFT", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
        log("Verifying DisneyRandomNFT on Etherscan...")
        await verify(disneyRandomNFT.address, args)
    }

    log("--------------------------------------------")

    if (chainId != 31337){
        // Keep a copy here in the config.js file
        fs.writeFileSync('./addresses/DisneyRandomNFT.js', `
            const disneyRandomAddress = "${disneyRandomNFT.address}"
        `)
        // Write updated contract to the frontend
        fs.writeFileSync('../magic-marketplace-frontend/src/blockchain/address/DisneyRandomNFT.js', `
            export const disneyRandomAddress = "${disneyRandomNFT.address}"
        `)
    }
}

function decideRarity(name){
    if (name === "Mickey"){
        return [
            {
                trait_type: "Rarity",
                value: "Super Rare",
            },
        ]
    } else if (name === "Minnie") {
        return [
            {
                trait_type: "Rarity",
                value: "Rare",
            },
        ]
    } else if (name === "Goofy") {
        return [
            {
                trait_type: "Rarity",
                value: "Common",
            },
        ]
    }
}

async function handleTokenUris(){
    tokenUris = []
    // store the image in ipfs
    // store the metadata in ipfs
    const { responses: imageUploadResponses, files } = await storeImages(imagesLocation)
    for (imageUploadResponseIndex in imageUploadResponses){
        // create metadata
        // upload metadata
        let tokenUriMetadata = { ...metadataTemplate }
        // drop the extension to create the name. the name should not be pug.png...
        tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "")
        tokenUriMetadata.description = `Hey! Look who it is?! It's ${tokenUriMetadata.name}!`
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`
        tokenUriMetadata.attributes = decideRarity(tokenUriMetadata.name)
        console.log(`Uploading ${tokenUriMetadata.name}...`)
        // store the JSON to pinata/ipfs
        const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata)
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }
    console.log("Token URIs Successfully Uploaded! They are:")
    console.log(tokenUris)

    return tokenUris
}

module.exports.tags = ["all", "disney-random", "main"]