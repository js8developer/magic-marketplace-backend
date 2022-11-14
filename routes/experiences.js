const { ethers } = require("hardhat")

const { stitchExperienceAddress } = require("../addresses/StitchExperience")
const StitchExperienceABI = require('../artifacts/contracts/StitchExperience.sol/StitchExperience.json')

const { kttkExperienceAddress } = require("../addresses/KTTKExperience")
const KTTKExperienceABI = require('../artifacts/contracts/KTTKExperience.sol/KTTKExperience.json')

const { disneyRandomAddress } = require('../addresses/DisneyRandomNFT')
const { stitchNftAddress } = require('../addresses/StitchNFT')

async function fetchExperiences(req, res){
    const experiences = [
      {
        address: kttkExperienceAddress,
        abi: KTTKExperienceABI.abi,
        name: "Keys to the Kingdom Tour",
        description: "Unlock the fascinating history of Magic Kingdom park and gain backstage access to legendary hidden areas. This 5-hour walking tour explores the creation and remarkable growth of one of the most beloved parks at Walt Disney World Resort! Explore secret locations you’ve always wondered about and get the inside scoop on some of your favorite attractions.",
        image: "",
        featuredCollections: [
          { 
            address: disneyRandomAddress
          }
        ]
      }
    ]
    res.send(experiences)
}


module.exports = {
    fetchExperiences
}