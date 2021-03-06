// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;

import "./ProovableABI.sol";

contract CoinFlip is usingProvable {


    // *************************************************************************************************
    // *            -------------------CONTRACT EVENTS--------------------------                       *                                                                            *
    // *************************************************************************************************

    event depositMade(address depositedBy, uint amount);
    event withdrawMade(address withdrawedBy, uint amount);
    event betInitialized(address player_address, uint amount, uint betId);
    event coinFlipped(address playerAddress, uint result, uint betId, bool hasWon);
    event newProvableQuerey(address indexed player);
    event balanceUpdated(address player, uint newBalance, uint oldBalance);
    event generatedRandomNumber(uint randomNumber);


    // *************************************************************************************************
    // *            -------------------DATA STRUCTURES--------------------------                       *                                                                            *
    // *************************************************************************************************

    struct Player {
        address playerAddress;
        uint256 betAmount;
        bool isActive;
        bool hasWon;
        uint id;
    }

    struct OracleQuery {
        bytes32 id;
        address playerAddress;
  }
    
    mapping(address => bool) waitingForOracle;          //stores result of the oracle RN fetch request for a player true/false
    mapping(address => uint) result;                    //stores the result of the oracles random number for a player
    mapping(address => bytes32) qid;                    //stores the oracle querey iD for a player
    mapping(bytes32 => OracleQuery) public playerOracleqQuerey;     //oracle querey
    mapping(address => Player) player;                  //player struct has attributes such as address, betAmount, player ID etc
    mapping(address => uint256) playerbalance;          //player balance mapping
    mapping(address => uint256) contratcBalance;        //contratc balance mappping


    //initial vars set id globally increment each time a player is made
    //NUM random bytes is how much bytes we request from the oracle 1 = range(0, 256) bytes
    //initilaise Player array which will store each instance of a player bet for lookups
    uint  private _id = 0;
    uint amt;
    uint private constant NUM_RANDOM_BYTES_REQUESTED = 1;
    uint private contractBalance;
    Player[] betLog;
    

    // *************************************************************************************************
    // *            -------------------CONSTRUCTORS & MODIFIERS--------------------------                       *                                                                            *
    // *************************************************************************************************

    //init contratc balance to 0
    constructor() public {
       
        contratcBalance[address(this)] = 0;

    }
    
    //modifier for the bet Conditions function. cannot create a bet smaller than 0.01 eth
    //the betAmiunt must be less thatn half of the contratc bal or else they payout is not possible
    //no player can have more than one bet ongoing handle this with an isActive attribute
    // modifier betConditions {
    //     require(amt >= 0.001 ether, "Insuffisant amount, please increase your bet!");
    //     require(amt <= contratcBalance[address(this)] / 2, "You can't bet more than half the contracts bal");
    //     _;
    // }
    

    // *************************************************************************************************
    // *            -------------------COINFLIP ALGORITHM--------------------------                    *                                                                            *
    // *************************************************************************************************


    
    function setBet(uint amount) public  {

        require(playerbalance[msg.sender] > 0);
        require(amount >= 0.001, "Insuffisant amount, please increase your bet!");
        require(amount <= contratcBalance[address(this)] / 2, "You can't bet more than half the contracts bal");

        //initalize a player
        player[msg.sender].playerAddress = msg.sender;
        player[msg.sender].betAmount = amount * 10 ** 18;
        player[msg.sender].isActive = true;
        player[msg.sender].hasWon = false;
        player[msg.sender].id = _id;

        //push the player to the betLog
        betLog.push(Player(msg.sender, amount, true, false, _id));

        //set waiting for oracle result to true
        //and update balances / id accordingly
    	waitingForOracle[msg.sender] = true;
        playerbalance[msg.sender] -= player[msg.sender].betAmount;
        contratcBalance[address(this)] += player[msg.sender].betAmount;
        _id++;

        //call the update function which is responsible for handlu=ing the
        //oracle querey request to get a external trully random number
        _update();
        
        emit betInitialized(msg.sender, player[msg.sender].betAmount, _id);
    }

    //update funcion
    function _update() internal {

        //set execution delay to 0 and set the gas required
        //to pay for the oracle for submitting a querey
        uint QUERY_EXECUTION_DELAY = 0;
        uint GAS_FOR_CALLBACK =200000;

        //submit the oracle querey, this function is called from
        //the provableABI contratc
        //bytes32 query_id = provable_newRandomDSQuery(QUERY_EXECUTION_DELAY, NUM_RANDOM_BYTES_REQUESTED, GAS_FOR_CALLBACK);
        bytes32 query_id = testRandom();

        //after the oracle querey is settled store the result in the player
        //Oracle querey struct allows us to distingish between players
        playerOracleqQuerey[query_id].id = query_id;
        playerOracleqQuerey[query_id].playerAddress = msg.sender;
        qid[msg.sender] = query_id;

        //emit LogNewProvableQuery(msg.sender);
    }

    //call back function is called by the oracle once the querey has been settled. 
    //thia function is caled via the provableABI contract. It finalises the random result
    function __callback(bytes32 _queryId, uint _result, bytes memory _proof) public returns(uint) {
        //require(msg.sender == provable_cbAddress());

        //store the oracle generated random num
        //update the player result mapping accordingly
        //set waiting for oracle to false
        uint randomNumber = _result;
        result[msg.sender] = randomNumber;
        waitingForOracle[msg.sender] = false;
        // if (provable_randomDS_proofVerify__returnCode(_queryId, _result, _proof) == 0){
        // uint randomNumber = uint(keccak256(abi.encodePacked(_result)))%2;
        // settleBet(randomNumber, _queryId);
        // emit GeneratedRandomNumber(randomNumber);
        //}
        // flipCoin(randomNumber);
        return(randomNumber);
    }

    //testing function which mimics the oracle querey func
    function testRandom() public returns (bytes32) {

        uint randomSeed = random();
        bytes32 quereyId = bytes32(keccak256(abi.encodePacked(msg.sender)));
        __callback(quereyId, randomSeed, bytes("test"));
        return quereyId;

        emit  generatedRandomNumber(randomSeed); 
    }
   
    //update tomorrow to have the flip function update struct values
    //have another funcion which is then called that puts into play the effects
    function flipCoin(uint randomNumber) public view returns(bool) {
        
        //cannot flip the coin if the player is still waiting for the 
        //oracles result handle that here
        bytes32 quereyId = qid[msg.sender];
        address playerAddress = playerOracleqQuerey[quereyId].playerAddress;
        require(player[msg.sender].isActive == true);
        require(waitingForOracle[playerAddress] == false);
        bool betWin;
        
        //finalise flip
        if (randomNumber == 1) {
            betWin = true;
        }
        else {
            betWin = false;
        }

        // emit coinFlipped(msg.sender, randomNumber, player[msg.sender].id, player[msg.sender].hasWon);
      
        return(betWin);
    }

    
    //this function takes the result from the flipCoin function and settles the bet
    //decreases player balance if coinflip is 0 and increases player bal in the
    //coinFlip result is 1
    function settleBet(bool randomSeed) public {

        //store old player balance for events
        uint256 oldPlayerBalance = playerbalance[msg.sender];
        uint256 oldContractBalance = contratcBalance[address(this)];

        bytes32 quereyId = qid[msg.sender];
        address playerAddress = playerOracleqQuerey[quereyId].playerAddress;
        uint betAmount = player[playerAddress].betAmount;

        //update player balances respectively depending
        //on the coinflip result
        if(randomSeed) {
           player[playerAddress].hasWon = true;
           contratcBalance[address(this)] -= betAmount;
           playerbalance[playerAddress] += 2 * betAmount;
        }   
        else {
            player[playerAddress].hasWon = false;
            contratcBalance[address(this)] += betAmount;
        }

        //delete player result for fresh new bet
        //delete player oracle querey for fresh bet also
        delete(result[msg.sender]);
        delete(playerOracleqQuerey[quereyId]);
        player[playerAddress].isActive = false;

        emit balanceUpdated(msg.sender, playerbalance[msg.sender], oldPlayerBalance);
        emit balanceUpdated(address(this), contratcBalance[address(this)], oldContractBalance);

        
        
    }


    // *************************************************************************************************
    // *            -------------------DEPOSIT/WITHDRAWABLE FUNCTIONS--------------------------        *                                                                            *
    // *************************************************************************************************

    function withdraw(uint amount) public payable {

        require(playerbalance[msg.sender] != 0);
        amount = amount * 10 ** 18;
        
        playerbalance[msg.sender] -= amount;
        contratcBalance[address(this)] -= amount;
        msg.sender.transfer(amount);

        emit withdrawMade(msg.sender, amount);

    }

    function deposit() public payable {
        playerbalance[msg.sender] += msg.value;
        contratcBalance[address(this)] += msg.value;

        emit depositMade(msg.sender, msg.value);
    }


    // *************************************************************************************************
    // *            ------------------_HELPER FUNCTIONS--------------------------                      *                                                                            *
    // *************************************************************************************************

    //return oracle result
    function getResult() public view returns (uint) {
        return result[msg.sender];
    }

    //get Bet status, is player playing or not
    function getBetStatus() public view returns(bool) {
        return player[msg.sender].isActive;
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
        return playerbalance[msg.sender];
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
