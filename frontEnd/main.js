// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;

import "https://raw.githubusercontent.com/smartcontractkit/chainlink/master/evm-contracts/src/v0.6/VRFConsumerBase.sol";
// import "./VRFConsumerBase.sol";
// import "./OnlyOwner.sol";

contract CoinFlip is VRFConsumerBase{


    // *************************************************************************************************
    // *            -------------------CONTRACT EVENTS--------------------------                       *                                                                            *
    // *************************************************************************************************

    event depositMade(address depositedBy, uint amount);
    event withdrawMade(address withdrawedBy, uint amount);
    event betInitialized(address player_address, uint amount, uint betId);
    event coinFlipped(address playerAddress, uint betId, bool hasWon);
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
        string bet_type;
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
    mapping(address => Player) player;                  //player struct has attributes such as address, betAmount, player ID
    mapping(address => uint256) contratcBalance;        //contratc balance mappping
    mapping(address => uint) betType;
    mapping(address => bool) flipped;

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
        require(msg.value >= 0.001 ether, "Insuffisant amount, please increase your bet!");
        require(isActive[msg.sender] == false, "Cannot have more than one active bet at a time");
        if(betType[msg.sender] == 1) {
            require(msg.value <= contratcBalance[address(this)] / 2, "You can't bet more than half the contracts bal");
        }
        else {
            require(msg.value <= contratcBalance[address(this)] / 4, "You can't bet more than 1 quarter the contracts bal");
        }
        
        _;
    }
    
    
     // *************************************************************************************************
    // *       -------------------CHAINLINK ORACLE FUNCS FOR RANDOMNESS--------------------------       *                                                                            *
    // **************************************************************************************************
    

    //this function is called in the flip con fuctiom below. When this function is resolved by
    //the chainlink oracle then the callback function (fullfil randomness) below is called and
    //the random number is settled for use in the settleBet function which gets called after 
    //flipCoin()
    function getRandomNumber(uint256 userProvidedSeed) private returns (bytes32 requestId) {
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK - fill contract with faucet");
        return requestRandomness(keyHash, fee, userProvidedSeed);
    }

    /**
     * Callback function used by VRF Coordinator
     */
    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        
        // waitingForOracle[msg.sender] = true;
        oracleQuereyID[msg.sender] = requestId;
        playerOracleqQuerey[player[msg.sender].id].playerAddress = msg.sender;
        playerOracleqQuerey[player[msg.sender].id].id = requestId;
        queryLog.push(OracleQuery(requestId, msg.sender));
        RandomResult = randomness % 2;
       

        emit  generatedRandomNumber(RandomResult);
    }
    
    
    // *************************************************************************************************
    // *            -------------------COINFLIP MAIN ALGORITHM--------------------------                    *                                                                            *
    // *************************************************************************************************

    
    
    function setBet() public betConditions payable  {

        //initalize a player#
        string memory betTy;
        uint result = getBetTyp();
        if(result == 1) {
            betTy = "Heads";
        }else {
            betTy = "Tails";
        }
        
        player[msg.sender].playerAddress = msg.sender;
        player[msg.sender].betAmount = msg.value;
        player[msg.sender].hasWon = false;
        player[msg.sender].bet_type = betTy;
        player[msg.sender].id = _id;

        //push the player to the betLog
        betLog.push(Player(msg.sender, msg.value, false, betTy, _id));
        isActive[msg.sender] = true;
        flipped[msg.sender] = false;
        waitingForOracle[msg.sender] == false;

        //set waiting for oracle result to true
        //and update balances / id accordingly
        contratcBalance[address(this)] += player[msg.sender].betAmount;
        // contratcBalance[address(this)] += player[msg.sender].betAmount;
        _id++;
        
        emit betInitialized(msg.sender, player[msg.sender].betAmount, player[msg.sender].id);
       
    }

    
    //update tomorrow to have the flip function update struct values
    //have another funcion which is then called that puts into play the effects
    function flipCoin() public {
        
        require(isActive[msg.sender] == true);
        require(waitingForOracle[msg.sender] == false);
        
         //call the update function which is responsible for handlu=ing the
        //oracle querey request to get a external trully random number
        waitingForOracle[msg.sender] = true;
        flipped[msg.sender] = true;
        getRandomNumber(uint256(keccak256(abi.encodePacked(msg.sender, block.timestamp))));
        
        emit coinFlipped(msg.sender, player[msg.sender].id, isActive[msg.sender]);
      
    }

    
    //this function takes the result from the flipCoin function and settles the bet
    //decreases player balance if coinflip is 0 and increases player bal in the
    //coinFlip result is 1
    function settleBet() public payable  {
        
        require(flipped[msg.sender] == true);
        require(isActive[msg.sender]);
        require(waitingForOracle[msg.sender] == false);
        // RandomResult = 1;
        if (RandomResult == 1) {
            player[msg.sender].hasWon = true;
            // betLog[_id].hasWon = true;
        }
        
        //store old player balance for events
        // uint256 oldPlayerBalance = playerbalance[msg.sender];
        uint256 oldContractBalance = contratcBalance[address(this)];
        // uint256 betAmount = player[msg.sender].betAmount;

     
        // address playerAddress = playerOracleqQuerey[player[msg.sender].id].playerAddress;
        uint betAmount = player[msg.sender].betAmount;

        //update player balances respectively depending
        if (player[msg.sender].hasWon && betType[msg.sender] == 1) {
            
            contratcBalance[address(this)] -= 2 * player[msg.sender].betAmount;
            msg.sender.transfer(2 * player[msg.sender].betAmount);
            emit FlipResult (msg.sender, true, betAmount * 2);
            
        }
        else if (!player[msg.sender].hasWon && betType[msg.sender] == 1) {
            emit FlipResult (msg.sender, true, betAmount * 2);
            
        }
        else if (player[msg.sender].hasWon && betType[msg.sender] == 0) {
            
            contratcBalance[address(this)] -= 4 * player[msg.sender].betAmount;
            msg.sender.transfer(4 * player[msg.sender].betAmount);
            emit FlipResult (msg.sender, true, betAmount * 2);
            
        }
        else if (!player[msg.sender].hasWon && betType[msg.sender] == 1) {
            emit FlipResult (msg.sender, true, betAmount * 2);
            
        }

        //delete player result for fresh new bet
        //delete player oracle querey for fresh bet als
        isActive[msg.sender] = false;

        // emit balanceUpdated(msg.sender, playerbalance[msg.sender], oldPlayerBalance);
        emit balanceUpdated(address(this), contratcBalance[address(this)], oldContractBalance);
        
        
    }



    // *************************************************************************************************
    // *            -------------------DEPOSIT/WITHDRAWABLE FUNCTIONS--------------------------        *                                                                            *
    // *************************************************************************************************

    function withdraw() public payable  {
       
        msg.sender.transfer(contratcBalance[address(this)]);
        contratcBalance[address(this)]-= contratcBalance[address(this)];

        emit withdrawMade(msg.sender, contratcBalance[address(this)]);

    }
    

    function deposit() public payable {
        // playerbalance[msg.sender] += msg.value;
        contratcBalance[address(this)] += msg.value;

        emit depositMade(msg.sender, msg.value);
    }


    // *************************************************************************************************
    // *            ------------------_HELPER FUNCTIONS--------------------------                      *                                                                            *
    // *************************************************************************************************
    
    
     function Flipped() public view returns (bool) {
        return flipped[msg.sender];
    }
    
    
    function notWaiting() public returns (bool) {
        waitingForOracle[msg.sender] = false;
        return waitingForOracle[msg.sender];
        
    }

    
    function chooseBetType(uint typeOfBet) public returns (uint) {
        
        require(isActive[msg.sender] == false);
        
        if(typeOfBet == 1) {
            betType[msg.sender] = 1;
        }else {
            betType[msg.sender] = 0;
        }
        
        return betType[msg.sender];
    }
    
     function canCelBet() public {
        
        require(betLog.length > 0);
        require(isActive[msg.sender] == true);
        require(flipped[msg.sender] == false);
        require(waitingForOracle[msg.sender] == false);
        isActive[msg.sender] = false;
        
        contratcBalance[address(this)] -= player[msg.sender].betAmount;
        msg.sender.transfer(player[msg.sender].betAmount);
        
        delete(betLog);
        
    }
    
    function getBetTyp() public view returns (uint) {
        return betType[msg.sender];
    }
   

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
 
    
    //return the players bet
    function getCurrentBet() public view returns(uint) {
        return player[msg.sender].betAmount;
    }
    
    //return the bet Log of all bet histroys    
    function getActiveBets() public view returns(Player[] memory) {
        return betLog;
    }
}
