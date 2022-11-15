const { networkConfig } = require("../helper-hardhat-config")
const { network, ethers } = require("hardhat")
const { verify } = require("../utils/verify")
const { storeImages, storeTokenUriMetadata } = require("../utils/uploadToPinata")
const fs = require('fs');

const imagesLocation = "./images/InsideOut"
const metadataTemplate = {
    name: "Inside Out",
    description: "Emotions are complicated. We already trade them between one another on a daily basis. Why not do it (and prove it) on the blockchain?!",
    image: "",
    attributes: [
        {
            trait_type: "Rarity",
            value: "Super Rare",
        },
    ]
}
// Uploading Anger...
// Uploading Disgust...
// Uploading Fear...
// Uploading Joy...
// Uploading Sadness...
// Token URIs Successfully Uploaded! They are:
let tokenUris = [
    'ipfs://QmdV9YeoUm2heWrGeAZK3mu3jEv5bZkbkdFP1vx6rDruhV',
    'ipfs://QmcNp1KAd418jY3Pb6wNYnxWc7EMZx7na635VMh1cndkSh',
    'ipfs://QmZYAbn5KkEAURokcGjcoG6N8tKBX3ppb4dfu2HL4GAmKE',
    'ipfs://QmPyeYKZALv9xKT1MFemxLk1dfVhMwV36gtBwMrQAsANpN',
    'ipfs://QmcbzpR7t4Gwi7G2ATSciSh5acswVQAHwV7BGBNYL5kp5G'
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
    const insideOutNFT = await deploy("InsideOutNFT", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
        log("Verifying InsideOutNFT on Etherscan...")
        await verify(insideOutNFT.address, args)
    }

    log("--------------------------------------------")

    if (chainId != 31337){
        // Keep a copy here in the config.js file
        fs.writeFileSync('./addresses/InsideOutNFT.js', `
            const insideOutAddress = "${insideOutNFT.address}"
        `)
        // Write updated contract to the frontend
        fs.writeFileSync('../magic-marketplace-frontend/src/blockchain/address/InsideOutNFT.js', `
            export const insideOutAddress = "${insideOutNFT.address}"
        `)
    }
}

function decideRarity(name){
    if (name === "Joy"){
        return [
            {
                trait_type: "Rarity",
                value: "Super Rare",
            },
        ]
    } else if (name === "Disgust") {
        return [
            {
                trait_type: "Rarity",
                value: "Rare",
            },
        ]
    } else if (name === "Sadness") {
        return [
            {
                trait_type: "Rarity",
                value: "Uncommon",
            },
        ]
    } else if (name === "Fear") {
        return [
            {
                trait_type: "Rarity",
                value: "Common",
            },
        ]
    } else if (name === "Anger") {
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
        tokenUriMetadata.description = `Say hello to your newest emotion: ${tokenUriMetadata.name}!`
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

module.exports.tags = ["all", "inside-out", "main"]