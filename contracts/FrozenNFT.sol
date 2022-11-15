// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import '@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol';
import '@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol';
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

error FrozenNFT__RangeOutOfBounds();
error FrozenNFT__NeedMoreETHSent();
error FrozenNFT__TransferFailed();

contract FrozenNFT is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    
    using Counters for Counters.Counter;
    Counters.Counter private s_tokenCounter;
    // when we mint NFT, we will trigger a Chainlink VRF call to get us a random number
    // using that number, we will get a random NFT
        // MARSHMALLOW - Super Rare
        // SNOWGIES - Rare
        // ELSA - Uncommon
        // ANNA - Uncommon
        // OLAF - Common
        // SVEN - Common

    // users have to pay to mint an nft
    // the owner of the contract can withdraw the ETH

    // Type Declaration
    enum Character {
        MARSHMALLOW,
        SNOWGIES,
        ELSA,
        ANNA,
        OLAF,
        SVEN
    }

    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // VRF Helpers
    mapping(uint256 => address) public s_requestIdToSender;

    // NFT Variables
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    string[] internal s_characterTokenUris;
    uint256 internal immutable i_mintFee;

    // Events
    event NftRequested(uint256 indexed requestId, address requester);
    event NftMinted(Character character, address minter);

    // constructor
    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane, 
        uint32 callbackGasLimit,
        string[6] memory characterTokenUris,
        uint256 mintFee
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Frozen NFT", "FRZN"){
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        s_characterTokenUris = characterTokenUris;
        i_mintFee = mintFee;
    }

    function requestNft() public payable returns(uint256 requestId){
        if (msg.value < i_mintFee){
            revert FrozenNFT__NeedMoreETHSent();
        }
        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        s_requestIdToSender[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override  {
        address characterOwner = s_requestIdToSender[requestId];
        s_tokenCounter.increment();
        uint256 newTokenId = s_tokenCounter.current();
        uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;
        Character character  = getCharacterFromModdedRng(moddedRng);
        _safeMint(characterOwner, newTokenId);
        _setTokenURI(newTokenId, s_characterTokenUris[uint256(character)]);
        emit NftMinted(character, characterOwner);
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{ value: amount }("");
        if (!success) { revert FrozenNFT__TransferFailed(); }
    }

    function getCharacterFromModdedRng(uint256 moddedRng) public pure returns(Character){
        uint256 cumulativeSum = 0;
        uint256[6] memory chanceArray = getChanceArray();
        for (uint256 i = 0; i < chanceArray.length; i++){
            if (moddedRng >= cumulativeSum && moddedRng < cumulativeSum + chanceArray[i]){
                return Character(i);
            }
            cumulativeSum += chanceArray[i];
        }
        revert FrozenNFT__RangeOutOfBounds();
    }

    function getChanceArray() public pure returns(uint256[6] memory){
        // Marshmallow - 8% chance
        // Snowgies - 12% chance
        // Elsa - 15% chance
        // Anna - 15% chance
        // Olaf - 25% chance
        // Sven - 25% chance
        return [8, 20, 35, 50, 75, MAX_CHANCE_VALUE];
    }

    function getMintFee() public view returns(uint256){
        return i_mintFee;
    }

    function getCharacterTokenUris(uint256 index) public view returns(string memory){
        return s_characterTokenUris[index];
    }

    function getTokenCounter() public view returns(uint256){
        return s_tokenCounter.current();
    }

}