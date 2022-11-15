const { 
  insideOutAddress,
  frozenAddress,
  disneyRandomAddress,
  afterHoursAddress,
  mickeysXmasAddress,
  kttkAddress
} = require("../addresses")

const { 
  AfterHoursABI,
  MickeysXmasABI,
  KTTKExperienceABI
} = require("../abis")


async function fetchExperiences(req, res){
    const experiences = [
      {
        address: afterHoursAddress,
        abi: AfterHoursABI.abi,
        name: "Disney After Hours at Magic Kingdom Park",
        description: "Experience a night of delight in Magic Kingdom park at a limited-capacity event with beloved attractions and tasty snacks.",
        image: "",
        featuredCollections: [
          { 
            address: insideOutAddress
          }
        ]
      },
      {
        address: mickeysXmasAddress,
        abi: MickeysXmasABI.abi,
        name: "Mickey's Very Merry Christmas Party",
        description: "Celebrate the most magical season of the year during this holly jolly event! Savor tasty holiday treats as you explore Magic Kingdom park and enjoy enchanting entertainment, favorite attractions and beloved Disney Characters.",
        image: "",
        featuredCollections: [
          { 
            address: frozenAddress
          }
        ]
      },
      {
        address: kttkAddress,
        abi: KTTKExperienceABI.abi,
        name: "Keys to the Kingdom Tour",
        description: "Unlock the fascinating history of Magic Kingdom park and gain backstage access to legendary hidden areas. This 5-hour walking tour explores the creation and remarkable growth of one of the most beloved parks at Walt Disney World Resort! Explore secret locations you’ve always wondered about and get the inside scoop on some of your favorite attractions.",
        image: "",
        featuredCollections: [
          { 
            address: disneyRandomAddress
          }
        ]
      },
     
    ]
    res.send(experiences)
}


module.exports = {
    fetchExperiences
}