pragma solidity >=0.5.16 <0.7.0;
pragma experimental ABIEncoderV2;
import "./TurnBasedGame.sol";

contract Zoom is TurnBasedGame {
    // The queue for waiting area
    uint256 queue = 0;
    uint256 number = 1;

    // holds the template hash for the Cartesi Machine computation that runs the Texas Holdem poker game
    bytes32 constant texasHoldemTemplateHash = '0x123';

    // Records details of users waiting to play
    struct gameDetails {
        // details of both players
        user[] players;
        // funds for both playes
        uint256[] playerFunds;
        // metadata for the game
        bytes metadata;
    }

    // Records information of a user
    struct user {
        // stores nickname as metadata
        string nickname;
        // stores user address
        address owner;
    }

    // User instances
    mapping(address => user) public users;
    mapping(uint256 => gameDetails) internal allGames;

    // @notice To create new User
    // @params nickname (metadata)
    function createUser(string memory _nickname) public {
        users[msg.sender].nickname = _nickname;
        users[msg.sender].owner = msg.sender;
    }

    // @notice to get details about queue
    function queueDetails() public view returns (uint256) {
        //get queue status
        return queue;
    }

    // @notice players coming to play game
    // @params _metaData stores the encrypted data for card
    // @params _playerFund stores the amount which player is staking
    function playUser(bytes calldata _metaData, uint256 _playerFund)
        external
        returns (gameDetails memory)
    {
        //if no one is waiting
        if (queue == 0) {
            // creates new game
            gameDetails storage game = allGames[number];
            game.players.push(users[msg.sender]);
            game.playerFunds.push(_playerFund);
            game.metadata = _metaData;

            // to record that queue is not empty
            // number is the game instance to which user is waiting
            queue = number;
            number++;
            return game;

            //if someone is already waiting
        } else {
            //second user registers and play game

            // stores the number in which game instance user is waiting
            uint256 temp = queue;

            queue = 0;

            // Records the second user details
            gameDetails storage game = allGames[temp];
            game.players.push(users[msg.sender]);
            game.playerFunds.push(_playerFund);
            game.metadata = _metaData;
            
            address [] memory add = new address[](game.players.length);
            for (uint256 i = 0; i<game.players.length; i++){
                add[i] = game.players[i].owner;
            }
            
            startGame(texasHoldemTemplateHash, add, game.playerFunds, game.metadata);
            return game;
        }
    }

    // @notice to get user details
    function getUserDetails() public view returns (user memory) {
        return users[msg.sender];
    }

    // @notice to get game details with waiting players
    function getGameDetails() public view returns (gameDetails memory){
        require(queue!=0);
        return allGames[queue];
    }

    // @notice get queue details
    function getQueueDetails() public view returns (uint256){
        return queue;
    }

}