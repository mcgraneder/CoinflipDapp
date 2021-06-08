

// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;


import "./VRFConsumerBase.sol";
import "./OnlyOwner.sol";


//make deosit contract function
//change withdrawal function to withdraw all and set to onlyOwner
//change the setBet function to payable and depsoit in amount
//when bet is set update contract balance to inrease by bet amount
//set flip function to payable so we can do a transfer. if the
//bet is a win subtratc 2 * betAmount from conract balance
//and transfer 2 * betAmount to player address
contract CoinFlip is VRFConsumerBase, Owner{


    // *************************************************************************************************
    // *            -------------------CONTRACT EVENTS--------------------------                       *                                                                            *
    // *************************************************************************************************

    event depositMade(address depositedBy, uint amount);
    event withdrawMade(address withdrawedBy, uint amount);
    event betInitialized(address player_address, uint amount, uint betId);
    event coinFlipped(address playerAddress, uint result, uint betId, bool hasWon);
    event FlipResult(address indexed player, bool won, uint amountWon);
    event LogNewProvableQuery(address indexed player);
    event balanceUpdated(address player, uint newBalance, uint oldBalance);
    event  generatedRandomNumber(uint256 randomNumber);


    // *************************************************************************************************
    // *            -------------------DATA STRUCTURES--------------------------                       *                                                                            *
    // *************************************************************************************************

    struct Player {
        address playerAddress;
        uint256 betAmount;
        bool hasWon;
        uint id;
    }

    struct OracleQuery {
        bytes32 id;
        address playerAddress;
  }
    
    mapping(address => bytes32) oracleQuereyID;
    mapping(address => bool) waitingForOracle;          //stores result of the oracle RN fetch request for a player true/false
    mapping(address => bool) isActive;                    //stores the result of the oracles random number for a player
    mapping(uint => OracleQuery) public playerOracleqQuerey;     //oracle querey
    mapping(address => Player) player;                  //player struct has attributes such as address, betAmount, player ID etc
    mapping(address => uint256) playerbalance;          //player balance mapping
    mapping(address => uint256) contratcBalance;        //contratc balance mappping


    //initial vars set id globally increment each time a player is made
    //NUM random bytes is how much bytes we request from the oracle 1 = range(0, 256) bytes
    //initilaise Player array which will store each instance of a player bet for lookups
    uint256 public RandomResult;
    uint  private _id = 0;
    uint private contractBalance;
    bytes32 internal keyHash;
    uint256 internal fee;
    Player[] betLog;
    OracleQuery[] queryLog;
    

    // *************************************************************************************************
    // *            -------------------CONSTRUCTORS & MODIFIERS--------------------------                       *                                                                            *
    // *************************************************************************************************

    //init contratc balance to 0
    constructor() VRFConsumerBase( 0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9, 0xa36085F69e2889c224210F603D836748e7dC0088) public {
        
       
        contratcBalance[address(this)] = 0;
        {
        keyHash = 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4;
        fee = 0.1 * 10 ** 18; // 0.1 LINK (Varies by network)
        }
    

    }
    
    // modifier for the bet Conditions function. cannot create a bet smaller than 0.01 eth
    // the betAmiunt must be less thatn half of the contratc bal or else they payout is not possible
    // no player can have more than one bet ongoing handle this with an isActive attribute
    modifier betConditions {
        // require(msg.value >= 0.001 ether, "Insuffisant amount, please increase your bet!");
        // // require(msg.value <= contratcBalance[address(this)] / 2, "You can't bet more than half the contracts bal");
        // require(isActive[msg.sender] = false, "Cannot have more than one active bet at a time");
        _;
    }
    

    // *************************************************************************************************
    // *            -------------------COINFLIP ALGORITHM--------------------------                    *                                                                            *
    // *************************************************************************************************

    
    
    function setBet() public payable  {

        //initalize a player
        player[msg.sender].playerAddress = msg.sender;
        player[msg.sender].betAmount = msg.value;
        player[msg.sender].hasWon = false;
        player[msg.sender].id = _id;

        //push the player to the betLog
        betLog.push(Player(msg.sender, msg.value, false, _id));

        //set waiting for oracle result to true
        //and update balances / id accordingly
    	waitingForOracle[msg.sender] = true;
        contratcBalance[address(this)] += player[msg.sender].betAmount;
        // contratcBalance[address(this)] += player[msg.sender].betAmount;
        _id++;

        //call the update function which is responsible for handlu=ing the
        //oracle querey request to get a external trully random number
        getRandomNumber(uint256(keccak256(abi.encodePacked(msg.sender, block.timestamp))));
        
        emit betInitialized(msg.sender, player[msg.sender].betAmount, _id);
    }


     // *************************************************************************************************
    // *       -------------------CHAINLINK ORACLE FUNCS FOR RANDOMNESS--------------------------       *                                                                            *
    // **************************************************************************************************

   
    function getRandomNumber(uint256 userProvidedSeed) private returns (bytes32 requestId) {
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK - fill contract with faucet");
        return requestRandomness(keyHash, fee, userProvidedSeed);
    }

    /**
     * Callback function used by VRF Coordinator
     */
    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        
        waitingForOracle[msg.sender] = false;
        oracleQuereyID[msg.sender] = requestId;
        playerOracleqQuerey[player[msg.sender].id].playerAddress = msg.sender;
        playerOracleqQuerey[player[msg.sender].id].id = requestId;
        RandomResult = randomness % 2;

        if (RandomResult == 1) {
            player[msg.sender].hasWon = true;
        }
        
       
       
        emit  generatedRandomNumber(RandomResult);
    }
    
    //update tomorrow to have the flip function update struct values
    //have another funcion which is then called that puts into play the effects
    function flipCoin() public returns(bool) {
        
        //cannot flip the coin if the player is still waiting for the 
        //oracles result handle that here
        address playerAddress = playerOracleqQuerey[player[msg.sender].id].playerAddress;
        // require(player[playerAddress].isActive == true);
        // require(waitingForOracle[playerAddress] == false);
        bool betWin;
        
        //finalise flip
        if (player[playerAddress].hasWon == true) {
            betWin = true;
        }
        else {
            betWin = false;
        }

        emit coinFlipped(msg.sender, RandomResult, player[msg.sender].id, isActive[playerAddress]);
      
        return(betWin);
    }

    
    //this function takes the result from the flipCoin function and settles the bet
    //decreases player balance if coinflip is 0 and increases player bal in the
    //coinFlip result is 1
    function settleBet(bool randomSeed) public payable {

        //store old player balance for events
        uint256 oldPlayerBalance = playerbalance[msg.sender];
        uint256 oldContractBalance = contratcBalance[address(this)];

        // bytes32 quereyId = qid[msg.sender];
        // address playerAddress = playerOracleqQuerey[quereyId].playerAddress;
        address playerAddress = playerOracleqQuerey[player[msg.sender].id].playerAddress;
        uint betAmount = player[playerAddress].betAmount;

        //update player balances respectively depending
        //on the coinflip result
        if(randomSeed) {
            
        // contratcBalance[address(this)] -= 2 * betAmount;
           contratcBalance[address(this)] -= 2 * betAmount;
           msg.sender.transfer(2 * betAmount);
           emit FlipResult (msg.sender, true, betAmount * 2);
        }   
        else {
            
            emit FlipResult (msg.sender, false, 0);
        }

        //delete player result for fresh new bet
        //delete player oracle querey for fresh bet als
        isActive[msg.sender] = false;

        emit balanceUpdated(msg.sender, playerbalance[msg.sender], oldPlayerBalance);
        emit balanceUpdated(address(this), contratcBalance[address(this)], oldContractBalance);
        
    }


    // *************************************************************************************************
    // *            -------------------DEPOSIT/WITHDRAWABLE FUNCTIONS--------------------------        *                                                                            *
    // *************************************************************************************************

    function withdraw() public payable  {

        // require(playerbalance[msg.sender] != 0);
        // msg.value = 1 + amount * 10 ** 18;
        
        //playerbalance[msg.sender] -= amount;
       
        msg.sender.transfer(contratcBalance[address(this)]);
        contratcBalance[address(this)]-= contratcBalance[address(this)];

        emit withdrawMade(msg.sender, contratcBalance[address(this)]);

    }

    function deposit() public payable {
        playerbalance[msg.sender] += msg.value;
        contratcBalance[address(this)] += msg.value;

        emit depositMade(msg.sender, msg.value);
    }


    // *************************************************************************************************
    // *            ------------------_HELPER FUNCTIONS--------------------------                      *                                                                            *
    // *************************************************************************************************

   

    //get Bet status, is player playing or not
    function getRandomNumber() public view returns(uint) {
        return RandomResult;
    }

    function getBetStatus() public view returns(bool) {
        return isActive[msg.sender];
    }
    
     function getQueryLog() public view returns(OracleQuery[] memory) {
        return queryLog;
    }

    function hasWon() public view returns(bool) {
        return player[msg.sender].hasWon;
    }

    //return msg.sender
    function getPlayer() public view returns(address) {
      
        return msg.sender;
    }
    
    //get contraqtc bal
    function getContratcBalance() public view returns(uint) {
      
        return contratcBalance[address(this)];
    }
    
     //get player bal
    function getPlayerBalance() public view returns(uint) {
        return contratcBalance[address(this)];
    }
    
    //old random generater function
    function random() public view returns(uint) {
        return block.timestamp % 2;
    }
    
    //return the players bet
    function getCurrentBet() public view returns(uint) {
        return player[msg.sender].betAmount;
    }
    
    //return the bet Log of all bet histroys    
    function getActiveBets() public view returns(Player[] memory) {
        return betLog;
    }
}
