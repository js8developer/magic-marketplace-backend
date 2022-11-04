const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name) ?
describe.skip :
describe("MagicMarketplace", function () {
    let magicMarketplaceContract, magicMarketplace
    let mockNFTContract, mockNFT
    let deployer, guest
    const PRICE = ethers.utils.parseEther("0.001")
    const TOKEN_ID = 1

    beforeEach(async () => {
        // set accounts
        const accounts = await ethers.getSigners()
        deployer = accounts[0]
        guest = accounts[1]
        await deployments.fixture(["all"])

        magicMarketplaceContract = await ethers.getContract("MagicMarketplace")
        magicMarketplace = await magicMarketplaceContract.connect(deployer)

        mockNFTContract = await ethers.getContract("MockNFT")
        mockNFT = await mockNFTContract.connect(deployer)

        await mockNFT.mintNft()
        await mockNFT.approve(magicMarketplaceContract.address, TOKEN_ID)
    })

    describe("listItemForSale", function(){

        it("Reverts when nft is listed for free", async function() {
            const FREE_PRICE = ethers.utils.parseEther("0")
            await expect(magicMarketplaceContract.listItemForSale(mockNFT.address, TOKEN_ID, FREE_PRICE)).to.be.revertedWithCustomError(
                magicMarketplaceContract,
                "MagicMarketplace__PriceMustBeAboveZero"
            )
        })

    })
})