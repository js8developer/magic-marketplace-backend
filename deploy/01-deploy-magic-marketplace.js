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

    fs.writeFileSync('./config.js', `
        const magicMarketplaceAddress = "${magicMarketplace.address}"
    `)

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY){
        log("Verifying...")
        await verify(magicMarketplace.address, args)
    }

    log("------------------------------------------")
}

module.exports.tags = ["all", "magic-marketplace"]