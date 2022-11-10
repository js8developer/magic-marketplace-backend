const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require('fs');

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    log("------------------------------------------")

    let args

    if (!developmentChains.includes(network.name)){
        // Already deployed Stitch Contract
        args = ["0x9e13590269045B90a2468E888F01061eF4A2eA14"]
    } else {
        const mockNFT = await deploy("MockNFT", {
            from: deployer,
            args: [],
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1
        })
        args = [mockNFT.address]
    }

    const stitchExperience = await deploy("StitchExperience", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    })
    
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY){
        log("Verifying...")
        await verify(stitchExperience.address, args)
    }

    log("------------------------------------------")

    if (chainId != 31337){
        // Keep a copy here in the config.js file
        fs.writeFileSync('./addresses/StitchExperience.js', `
            const stitchExperienceAddress = "${stitchExperience.address}"
        `)
        // Write updated contract to the frontend
        fs.writeFileSync('../magic-marketplace-frontend/src/blockchain/address/StitchExperience.js', `
            export const stitchExperienceAddress = "${stitchExperience.address}"
        `)
    }
}

module.exports.tags = ["all", "stitch-experience"]