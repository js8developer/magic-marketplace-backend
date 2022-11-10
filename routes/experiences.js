const { ethers } = require("hardhat")

const { stitchExperienceAddress } = require("../addresses/StitchExperience")
const StitchExperienceABI = require('../artifacts/contracts/StitchExperience.sol/StitchExperience.json')

const { kttkExperienceAddress } = require("../addresses/KTTKExperience")
const KTTKExperienceABI = require('../artifacts/contracts/KTTKExperience.sol/KTTKExperience.json')



async function fetchExperiences(req, res){
    const experiences = [
      {
        address: stitchExperienceAddress,
        abi: StitchExperienceABI.abi,
        name: "Stitch's Galactic Experience",
        description: "Unlock this private experience with Stitch as you help him save Earth!",
        image: ""
      },
      {
        address: kttkExperienceAddress,
        abi: KTTKExperienceABI.abi,
        name: "Keys to the Kingdom Tour",
        description: "Unlock the fascinating history of Magic Kingdom park and gain backstage access to legendary hidden areas. This 5-hour walking tour explores the creation and remarkable growth of one of the most beloved parks at Walt Disney World Resort! Explore secret locations you’ve always wondered about and get the inside scoop on some of your favorite attractions.",
        image: ""
      }
    ]
    res.send(experiences)
}


module.exports = {
    fetchExperiences
}