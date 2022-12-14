const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require('fs');

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("------------------------------------------")

    const args = []
    const mockNFT = await deploy("MockNFT", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    })

    if (!developmentChains.includes(network.name)){
        log("Verifying...")
        await verify(mockNFT.address, args)
    }

    log("------------------------------------------")
}

module.exports.tags = ["all", "mock-nft"]