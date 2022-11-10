const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require('fs');

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("------------------------------------------")

    let args = []
    const magicMarketplace = await deploy("MagicMarketplace", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY){
        log("Verifying...")
        await verify(magicMarketplace.address, args)
    }

    log("------------------------------------------")

    if (chainId != 31337){
        // Keep a copy here in the config.js file
        fs.writeFileSync('./addresses/MagicMarketplace.js', `
            const magicMarketplaceAddress = "${magicMarketplace.address}"
        `)
        // Write updated contract to the frontend
        fs.writeFileSync('../magic-marketplace-frontend/src/blockchain/address/MagicMarketplace.js', `
            export const magicMarketplaceAddress = "${magicMarketplace.address}"
        `)
    }
}

module.exports.tags = ["all", "magic-marketplace"]