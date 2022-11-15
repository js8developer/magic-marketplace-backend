const { networkConfig } = require("../helper-hardhat-config")
const { network, ethers } = require("hardhat")
const { verify } = require("../utils/verify")
const { storeImages, storeTokenUriMetadata } = require("../utils/uploadToPinata")
const fs = require('fs');

const imagesLocation = "./images/Frozen"
const metadataTemplate = {
    name: "Frozen",
    description: "Into the Unknownnnn world of blockchain!",
    image: "",
    attributes: [
        {
            trait_type: "Rarity",
            value: "Super Rare",
        },
    ]
}

// Uploading Anna...
// Uploading Elsa...
// Uploading Marshmallow...
// Uploading Olaf...
// Uploading Snowgies...
// Uploading Sven...
// Token URIs Successfully Uploaded! They are:

let tokenUris = [
    'ipfs://QmV2iRBzpqVtYH5rYkFt8gNxMkDBGW7K4U6vhmDWyxCSW2',
    'ipfs://QmZH2V1E4wqXRctrAFGbZDxgJqjiCfPyuVsq2uEaqv43dS',
    'ipfs://QmWDkJ8q7Sp4Q6K7bX6DQbaz7RxgXsmFykguVeraxymyMb',
    'ipfs://QmRcsmqb3rQGsKoXNAv4AHYFdSUbewHpz1DfmjopqVtSNz',
    'ipfs://QmbFxcjM2MWYLGutegV3JzLB5XqciVTSUoeqFjMYsH2aLg',
    'ipfs://QmV8cw2hrx6vLvoL8ZrdeoVNVYqnQNe7P1eTJRmdM5cDkA'
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
    const frozenNFT = await deploy("FrozenNFT", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
        log("Verifying FrozenNFT on Etherscan...")
        await verify(frozenNFT.address, args)
    }

    log("--------------------------------------------")

    if (chainId != 31337){
        // Keep a copy here in the config.js file
        fs.writeFileSync('./addresses/FrozenNFT.js', `
            const frozenNFTAddress = "${frozenNFT.address}"
        `)
        // Write updated contract to the frontend
        fs.writeFileSync('../magic-marketplace-frontend/src/blockchain/address/FrozenNFT.js', `
            export const frozenNFTAddress = "${frozenNFT.address}"
        `)
    }
}

function decideRarity(name){
    if (name === "Marshmallow"){
        return [
            {
                trait_type: "Rarity",
                value: "Super Rare",
            },
        ]
    } else if (name === "Snowgies") {
        return [
            {
                trait_type: "Rarity",
                value: "Rare",
            },
        ]
    } else if (name === "Elsa") {
        return [
            {
                trait_type: "Rarity",
                value: "Uncommon",
            },
        ]
    } else if (name === "Anna") {
        return [
            {
                trait_type: "Rarity",
                value: "Uncommon",
            },
        ]
    } else if (name === "Olaf") {
        return [
            {
                trait_type: "Rarity",
                value: "Common",
            },
        ]
    } else if (name === "Sven") {
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
        tokenUriMetadata.description = `Hey ${tokenUriMetadata.name}! Do you want to build a snowman?`
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

module.exports.tags = ["all", "frozen", "main"]