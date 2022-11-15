const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require('fs');
const { frozenAddress } = require('../addresses') 

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    log("------------------------------------------")
    
    let args

    if (!developmentChains.includes(network.name)){
        // Already deployed Frozen NFT
        args = [frozenAddress]
    } else {
        const mockNFT = await deploy("MockNFT", {
            from: deployer,
            args: [],
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1
        })
        args = [mockNFT.address]
    }

    const mickeysXmasExperience = await deploy("MickeysXmasExperience", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    })
    
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY){
        log("Verifying...")
        await verify(mickeysXmasExperience.address, args)
    }

    log("------------------------------------------")

    if (chainId != 31337){
        // Keep a copy here in the config.js file
        fs.writeFileSync('./addresses/MickeysXmasExperience.js', `
            const mickeysXmasExperience = "${mickeysXmasExperience.address}"
        `)
        // Write updated contract to the frontend
        fs.writeFileSync('../magic-marketplace-frontend/src/blockchain/address/MickeysXmasExperience.js', `
            export const mickeysXmasExperience = "${mickeysXmasExperience.address}"
        `)
    }
}

module.exports.tags = ["all", "xmas-experience"]