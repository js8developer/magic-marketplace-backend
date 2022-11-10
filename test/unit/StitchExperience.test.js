const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name) ?
describe.skip :
describe("StitchExperience", function () {
    let stitchExperienceContract, stitchExperience
    let mockNFTContract, mockNFT
    let deployer, guest

    beforeEach(async () => {
        // set accounts
        const accounts = await ethers.getSigners()
        deployer = accounts[0]
        guest = accounts[1]
        await deployments.fixture(["all"])

        stitchExperienceContract = await ethers.getContract("StitchExperience")
        stitchExperience = stitchExperienceContract.connect(deployer)

        mockNFTContract = await ethers.getContract("MockNFT")
        mockNFT = mockNFTContract.connect(deployer)
    })

    describe("claimTicketToExperience", function(){
        it("Reverts if address does not hold nft", async function(){
            await expect(stitchExperience.claimTicketToExperience()).to.be.revertedWithCustomError(
                stitchExperienceContract,
                "StitchExperience__DoesNotOwnNFTFromCollection"
            )
        })

        it("Reverts if address does not hold nft", async function(){
            await mockNFT.mintNft()
            await stitchExperience.claimTicketToExperience()

            await expect(stitchExperience.claimTicketToExperience()).to.be.revertedWithCustomError(
                stitchExperienceContract,
                "StitchExperience__AllTicketsHaveBeenClaimed"
            )
        })

        it("Successfully claims ticket to experience", async function(){
            const preTixLeftToClaim = await stitchExperience.ticketsLeftToClaim()
            const preWalletHoldsNFT = await stitchExperience.walletHoldsNFT()
            assert.equal(preTixLeftToClaim.toString() , "0")
            assert.equal(preWalletHoldsNFT, false)

            await mockNFT.mintNft()

            const midWalletHoldsNFT = await stitchExperience.walletHoldsNFT()
            const midTixLeftToClaim = await stitchExperience.ticketsLeftToClaim()
            const midTixClaimed = await stitchExperience.ticketsClaimedByAddress()
            const midMaxTixAvailable = await stitchExperience.maxTicketsAvailableForAddress()
            assert.equal(midWalletHoldsNFT, true)
            assert.equal(midTixLeftToClaim.toString(), "1")
            assert.equal(midTixClaimed.toString(), "0")
            assert.equal(midMaxTixAvailable.toString(), "1")

            await stitchExperience.claimTicketToExperience()
            const postTixLeftToClaim = await stitchExperience.ticketsLeftToClaim()
            const postTixClaimed = await stitchExperience.ticketsClaimedByAddress()
            const postMaxTixAvailable = await stitchExperience.maxTicketsAvailableForAddress()
            assert.equal(postTixLeftToClaim.toString(), "0")
            assert.equal(postTixClaimed.toString(), "1")
            assert.equal(postMaxTixAvailable.toString(), "1")
        })

        it("Emits TicketMinted event when new ticket is claimed/minted", async function(){
            await mockNFT.mintNft()
            expect(await stitchExperience.claimTicketToExperience()).to.emit("TicketMinted")
        })
    })

})