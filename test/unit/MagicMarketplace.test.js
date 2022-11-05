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
    const zeroAddress = '0x0000000000000000000000000000000000000000'

    beforeEach(async () => {
        // set accounts
        const accounts = await ethers.getSigners()
        deployer = accounts[0]
        guest = accounts[1]
        await deployments.fixture(["all"])

        magicMarketplaceContract = await ethers.getContract("MagicMarketplace")
        magicMarketplace = magicMarketplaceContract.connect(deployer)

        mockNFTContract = await ethers.getContract("MockNFT")
        mockNFT = mockNFTContract.connect(deployer)

        await mockNFT.mintNft()
        await mockNFT.approve(magicMarketplaceContract.address, TOKEN_ID)
    })

    describe("listItemForSale", function(){

        it("Reverts when nft is listed for free", async function() {
            const FREE_PRICE = ethers.utils.parseEther("0")
            await expect(magicMarketplace.listItemForSale(mockNFT.address, TOKEN_ID, FREE_PRICE)).to.be.revertedWithCustomError(
                magicMarketplaceContract,
                "MagicMarketplace__PriceMustBeAboveZero"
            )
        })

        it("Reverts when non-owner tries to list nft", async function() {
            magicMarketplace = await magicMarketplaceContract.connect(guest)
            await expect(magicMarketplace.listItemForSale(mockNFT.address, TOKEN_ID, PRICE)).to.be.revertedWithCustomError(
                magicMarketplaceContract,
                "MagicMarketplace__NotOwner"
            )
        })

        it("Reverts when nft is already listed by the owner", async function() {
            await magicMarketplace.listItemForSale(mockNFT.address, TOKEN_ID, PRICE)
            await expect(magicMarketplace.listItemForSale(mockNFT.address, TOKEN_ID, PRICE)).to.be.revertedWithCustomError(
                magicMarketplaceContract, 
                "MagicMarketplace__AlreadyListed"
            )
        })

        it("Reverts when nft has not approved the marketplace contract", async function(){
            await mockNFT.mintNft() // token_id 2
            await expect(magicMarketplace.listItemForSale(mockNFT.address, TOKEN_ID + 1, PRICE)).to.be.revertedWithCustomError(
                magicMarketplaceContract,
                "MagicMarketplace__NotApprovedForMarketplace"
            )
        })

        it("Lists item successfully", async function () {
            // list item for sale appropriately
            await magicMarketplace.listItemForSale(mockNFT.address, TOKEN_ID, PRICE)
            const itemsCount = await magicMarketplace.fetchItemsForSaleCount()
            const marketItems = await magicMarketplace.fetchMarketItems()
            assert.equal(itemsCount.toString(), "1")
            assert.equal(marketItems.length.toString(), "1")
        })

        it("Emits ItemListed event when new item successfully listed", async function(){
            expect(await magicMarketplace.listItemForSale(mockNFT.address, TOKEN_ID, PRICE)).to.emit("ItemListed")
        })
    })

    describe("buyItem", function(){

        it("Reverts when item is not listed for sale yet", async function (){
            await expect(magicMarketplace.buyItem(mockNFT.address, TOKEN_ID, { value: PRICE })).to.be.revertedWithCustomError(
                magicMarketplace,
                "MagicMarketplace__NotListed"
            )
        })

        it("Reverts when price is not met for purchase", async function (){
            await magicMarketplace.listItemForSale(mockNFT.address, TOKEN_ID, PRICE)
            await magicMarketplace.connect(guest)

            const FREE_PRICE = ethers.utils.parseEther("0")
            await expect(magicMarketplace.buyItem(mockNFT.address, TOKEN_ID, { value: FREE_PRICE })).to.be.revertedWithCustomError(
                magicMarketplace,
                "MagicMarketplace__PriceNotMet"
            )
        })
        
        it("Successfully purchases nft from marketplace", async function(){
            // check previous owner for later use
            const previousOwner = await mockNFT.ownerOf(TOKEN_ID)
            // have seller list item for sale
            await magicMarketplace.listItemForSale(mockNFT.address, TOKEN_ID, PRICE)
            // connect buyer and purchase nft
            const buyerConnectedMagicMarketplace = magicMarketplace.connect(guest)
            await buyerConnectedMagicMarketplace.buyItem(mockNFT.address, TOKEN_ID, { value: PRICE })
            
            // Run checks...

            // make sure seller proceeds increased by purchase price
            const sellerProceeds = await magicMarketplace.fetchProceeds(deployer.address)
            assert(sellerProceeds.toString(), PRICE.toString())
            const buyerProceeds = await magicMarketplace.fetchProceeds(guest.address)
            assert(buyerProceeds.toString(), ethers.utils.parseEther("0"))
            // make sure item is deleted from s_listings
            const listing = await magicMarketplace.fetchListing(mockNFT.address, TOKEN_ID)
            assert.equal(listing.nftAddress, zeroAddress)
            assert.equal(listing.seller, zeroAddress)
            assert.equal(listing.owner, zeroAddress)
            assert.equal(listing.itemId.toString(), "0")
            // make sure item is deleted from s_marketItems
            const marketItems = await magicMarketplace.fetchMarketItems()
            assert.equal(marketItems.length.toString(), "0")
            // make sure s_itemsSold incremented
            const itemsSoldCount = await magicMarketplace.fetchItemsSoldCount()
            assert.equal(itemsSoldCount.toString(), "1")
            // make sure buyer currently owns the nft
            // make sure seller no longer owns the nft
            const newOwner = await mockNFT.ownerOf(TOKEN_ID)
            assert.equal(newOwner, guest.address)
            assert.notEqual(newOwner, deployer.address)
            assert.equal(previousOwner, deployer.address)
        })

        it("Emits ItemBought event when new item successfully purchased from marketplace", async function(){
            await magicMarketplace.listItemForSale(mockNFT.address, TOKEN_ID, PRICE)
            await magicMarketplace.connect(guest)
            expect(await magicMarketplace.buyItem(mockNFT.address, TOKEN_ID, { value: PRICE })).to.emit("ItemBought")
        })
    })

    describe("cancelListing", function(){

        it("Reverts if caller is not the owner of the listing/nft", async function(){
            await magicMarketplace.listItemForSale(mockNFT.address, TOKEN_ID, PRICE)
            const guestConnectedMagicMarketplace = await magicMarketplace.connect(guest)
            await expect(guestConnectedMagicMarketplace.cancelListing(mockNFT.address, TOKEN_ID)).to.be.revertedWithCustomError(
                magicMarketplace,
                "MagicMarketplace__NotOwner"
            )
        })

        it("Reverts if listing doesn't exist", async function(){
            await expect(magicMarketplace.cancelListing(mockNFT.address, TOKEN_ID)).to.be.revertedWithCustomError(
                magicMarketplace,
                "MagicMarketplace__NotListed"
            )
        })

        it("Successfully cancels listing and removes nft from marketplace", async function (){
            await magicMarketplace.listItemForSale(mockNFT.address, TOKEN_ID, PRICE)

            const listedItem = await magicMarketplace.fetchListing(mockNFT.address, TOKEN_ID)
            assert.equal(listedItem.nftAddress, mockNFT.address)
            assert.equal(listedItem.seller, deployer.address)
            assert.equal(listedItem.owner, magicMarketplace.address)
            assert.equal(listedItem.itemId.toString(), "1")

            await magicMarketplace.cancelListing(mockNFT.address, TOKEN_ID)

            // make sure item is deleted from s_listings
            const deletedListing = await magicMarketplace.fetchListing(mockNFT.address, TOKEN_ID)
            assert.equal(deletedListing.nftAddress, zeroAddress)
            assert.equal(deletedListing.seller, zeroAddress)
            assert.equal(deletedListing.owner, zeroAddress)
            assert.equal(deletedListing.itemId.toString(), "0")

            // make sure item is deleted from s_marketItems
            const deletedMarketItem = await magicMarketplace.fetchMarketItem(1)
            assert.equal(deletedMarketItem.nftAddress, zeroAddress)
            assert.equal(deletedMarketItem.seller, zeroAddress)
            assert.equal(deletedMarketItem.owner, zeroAddress)
            assert.equal(deletedMarketItem.itemId.toString(), "0")
        })

        it("Emits ItemCanceled event when listing canceled by owner", async function(){
            await magicMarketplace.listItemForSale(mockNFT.address, TOKEN_ID, PRICE)
            expect(await magicMarketplace.cancelListing(mockNFT.address, TOKEN_ID)).to.emit("ItemCanceled")
        })

    })

    describe("updateListing", function(){
        
        it("Reverts when caller is not the owner of the listing", async function(){
            await magicMarketplace.listItemForSale(mockNFT.address, TOKEN_ID, PRICE)

            await magicMarketplace.connect(guest)
            const NEW_PRICE = ethers.utils.parseEther("0.002")

            expect(await magicMarketplace.updateListing(mockNFT.address, TOKEN_ID, NEW_PRICE)).to.be.revertedWithCustomError(
                magicMarketplace,
                "MagicMarketplace__NotOwner"
            )
        })

        it("Reverts when the listing does not exist in marketplace", async function(){
            await expect(magicMarketplace.updateListing(mockNFT.address, TOKEN_ID, PRICE)).to.be.revertedWithCustomError(
                magicMarketplace,
                "MagicMarketplace__NotListed"
            )
        })

        it("Successfully updates price of listing", async function(){
            await magicMarketplace.listItemForSale(mockNFT.address, TOKEN_ID, PRICE)
            const originalListing = await magicMarketplace.fetchListing(mockNFT.address, TOKEN_ID)
            assert.equal(originalListing.price.toString(), PRICE.toString())

            const NEW_PRICE = ethers.utils.parseEther("0.002")
            await magicMarketplace.updateListing(mockNFT.address, TOKEN_ID, NEW_PRICE)
            const updatedListing = await magicMarketplace.fetchListing(mockNFT.address, TOKEN_ID)
            assert.equal(updatedListing.price.toString(), NEW_PRICE.toString())
        })

        it("Emits ItemListed event when listing price is updated by owner", async function(){
            await magicMarketplace.listItemForSale(mockNFT.address, TOKEN_ID, PRICE)
            const NEW_PRICE = ethers.utils.parseEther("0.002")
            expect(await magicMarketplace.updateListing(mockNFT.address, TOKEN_ID, NEW_PRICE)).to.emit("ItemListed")
        })
    })

    describe("withdrawProceeds", function(){

        it("Reverts when user does not have any proceeds to collect", async function(){
            await expect(magicMarketplace.withdrawProceeds()).to.be.revertedWithCustomError(
                magicMarketplace,
                "MagicMarketplace__NoProceeds"
            )
        })

        it("Successfully withdraws proceeds to user wallet", async function(){
            await magicMarketplace.listItemForSale(mockNFT.address, TOKEN_ID, PRICE)
            // connect guest
            await magicMarketplace.connect(guest)
            // buy item
            await magicMarketplace.buyItem(mockNFT.address, TOKEN_ID, { value: PRICE })
            // reconnect seller
            await magicMarketplace.connect(deployer)

            const proceedsPreWithdrawal = await magicMarketplace.fetchProceeds(deployer.address)
            assert.equal(proceedsPreWithdrawal.toString(), PRICE.toString())

            // withdraw proceeds
            await magicMarketplace.withdrawProceeds()

            const proceedsPostWithdrawal = await magicMarketplace.fetchProceeds(deployer.address)
            assert.equal(proceedsPostWithdrawal.toString(), "0")
        })

        it("Emits ProceedsCollected event when proceeds withdrawn by owner", async function(){
            await magicMarketplace.listItemForSale(mockNFT.address, TOKEN_ID, PRICE)
            // connect guest
            await magicMarketplace.connect(guest)
            // buy item
            await magicMarketplace.buyItem(mockNFT.address, TOKEN_ID, { value: PRICE })
            // reconnect seller
            await magicMarketplace.connect(deployer)
            // withdraw proceeds and emit (Need to add the ProceedsCollected event in contract)
            expect(await magicMarketplace.withdrawProceeds()).to.emit("ProceedsCollected")
        })
    })
})