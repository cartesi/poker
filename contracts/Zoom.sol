pragma solidity >=0.5.16;
pragma experimental ABIEncoderV2;

//import "./TurnBasedGame.sol";

contract Zoom {
    // The queue for waiting area
    uint256 queue = 0;
    uint256 number = 1;

    // holds the template hash for the Cartesi Machine computation that runs the Texas Holdem poker game
    bytes32 constant texasHoldemTemplateHash = "0x123";
    address addr = 0xe23dfa6993eAA1a8a9a14EA703FD38cC0B049823;

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
    
    event GameWaitArea(gameDetails game);

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
    function playUser(bytes memory _metaData, uint256 _playerFund)
        public
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
            
            emit GameWaitArea(game);
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

            address[] memory add = new address[](game.players.length);
            for (uint256 i = 0; i < game.players.length; i++) {
                add[i] = game.players[i].owner;
            }

            TurnBasedGame c = TurnBasedGame(addr);
            c.startGame(
                texasHoldemTemplateHash,
                add,
                game.playerFunds,
                game.metadata
            );
            

            return game;
        }
    }

    // @notice to get user details
    function getUserDetails() public view returns (user memory) {
        return users[msg.sender];
    }

    // @notice to get game details with waiting players
    function getGameDetails() public view returns (gameDetails memory) {
        return allGames[queue];
    }

    // @notice get queue details
    function getQueueDetails() public view returns (uint256) {
        return queue;
    }

}

interface TurnBasedGame {
    struct Turn {
        address player;
        bytes32 stateHash;
        uint256 dataLogIndex;
    }

    struct GameContext {
        bytes32 templateHash;
        address[] players;
        uint256[] playerFunds;
        bytes metadata;
        Turn[] turns;
        uint256 descartesIndex;
    }

    event GameReady(uint256 _index, GameContext _context);
    event TurnOver(uint256 _index, Turn _turn);
    event GameEndClaimed(uint256 _index, uint256 _descartesIndex);
    event GameOver(uint256 _index, uint256[] _potShare);

    function startGame(
        bytes32 _templateHash,
        address[] calldata _players,
        uint256[] calldata _playerFunds,
        bytes calldata _metadata
    ) external returns (uint256);

    function submitTurn(
        uint256 _index,
        bytes32 _stateHash,
        bytes8[] calldata _data
    ) external;

    function claimGameEnd(uint256 _index) external;

    function applyResult(uint256 _index) external;

    function getContext(uint256 _index)
        external
        view
        returns (GameContext memory);

    function isConcerned(uint256 _index, address _player)
        external
        view
        returns (bool);

    function getSubInstances(uint256 _index, address)
        external
        view
        returns (address[] memory _addresses, uint256[] memory _indices);
}