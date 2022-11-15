const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require('fs');
const { insideOutAddress } = require('../addresses') 

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    log("------------------------------------------")
    
    let args

    if (!developmentChains.includes(network.name)){
        // Already deployed Inside Out NFT
        args = [insideOutAddress]
    } else {
        const mockNFT = await deploy("MockNFT", {
            from: deployer,
            args: [],
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1
        })
        args = [mockNFT.address]
    }

    const afterHoursExperience = await deploy("AfterHoursExperience", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    })
    
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY){
        log("Verifying...")
        await verify(afterHoursExperience.address, args)
    }

    log("------------------------------------------")

    if (chainId != 31337){
        // Keep a copy here in the config.js file
        fs.writeFileSync('./addresses/AfterHoursExperience.js', `
            const afterHoursExperienceAddress = "${afterHoursExperience.address}"
        `)
        // Write updated contract to the frontend
        fs.writeFileSync('../magic-marketplace-frontend/src/blockchain/address/AfterHoursExperience.js', `
            export const afterHoursExperienceAddress = "${afterHoursExperience.address}"
        `)
    }
}

module.exports.tags = ["all", "afterhours-experience"]