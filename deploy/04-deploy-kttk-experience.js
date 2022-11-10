const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require('fs');
const { disneyRandomAddress } = require('../addresses/DisneyRandomNFT') 

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    log("------------------------------------------")
    
    let args

    if (!developmentChains.includes(network.name)){
        // Already deployed Disney Random NFT
        args = [disneyRandomAddress]
    } else {
        const mockNFT = await deploy("MockNFT", {
            from: deployer,
            args: [],
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1
        })
        args = [mockNFT.address]
    }

    const kttkExperience = await deploy("KTTKExperience", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    })
    
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY){
        log("Verifying...")
        await verify(kttkExperience.address, args)
    }

    log("------------------------------------------")

    if (chainId != 31337){
        // Keep a copy here in the config.js file
        fs.writeFileSync('./addresses/KTTKExperience.js', `
            const kttkExperienceAddress = "${kttkExperience.address}"
        `)
        // Write updated contract to the frontend
        fs.writeFileSync('../magic-marketplace-frontend/src/blockchain/address/KTTKExperience.js', `
            export const kttkExperienceAddress = "${kttkExperience.address}"
        `)
    }
}

module.exports.tags = ["all", "kttk-experience"]