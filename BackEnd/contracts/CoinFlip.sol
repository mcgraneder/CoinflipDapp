// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;

// import "https://raw.githubusercontent.com/smartcontractkit/chainlink/master/evm-contracts/src/v0.6/VRFConsumerBase.sol";
import "./VRFConsumerBase.sol";
import "./OnlyOwner.sol";

contract CoinFlip is VRFConsumerBase, Owner{


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
    mapping(address => uint) outcome;
    

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

    //We initialise the contract balance to zero and we also define th ekeyHash and fee which are
    //required to query the chainlink oracle for a random number. We also need the chainlink token address as
    //the oracle fee is paid in chainlink not ether
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
    //flipCoin(). This function requires us to send the "fee" to the chainlink oracle for using it.
    //This fee is paid in chainlink. See constructor
    function getRandomNumber(uint256 userProvidedSeed) private returns (bytes32 requestId) {
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK - fill contract with faucet");
        return requestRandomness(keyHash, fee, userProvidedSeed);
    }

    /**
     * Callback function used by VRF Coordinator
     */
     //here we store the oracle request id in the playerOracle mapping and we also push 
     //the oracle request id and the address of the oracle caller to the queryLog which is 
     //an array which keeps track of all of the players who requested a random number off
     //of the oracle. We then define the random number. Its either a 0 or 1 if the bet is set 
     //to type 1 (50/50) and its either 0, 1 2, 3 or 4 for bet type 2 (25% odds)
    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        
        
        oracleQuereyID[msg.sender] = requestId;
        playerOracleqQuerey[player[msg.sender].id].playerAddress = msg.sender;
        playerOracleqQuerey[player[msg.sender].id].id = requestId;
        queryLog.push(OracleQuery(requestId, msg.sender));
        if (betType[msg.sender] == 0) {
            RandomResult = randomness % 2;

        }
        else {
            RandomResult = randomness % 4;

        }

        emit  generatedRandomNumber(RandomResult);
    }
    
    
    // *************************************************************************************************
    // *            -------------------COINFLIP MAIN ALGORITHM--------------------------                    *                                                                            *
    // *************************************************************************************************

    
    //the set bet function creates an instance of the player struct and assigns 
    //the strct attributes to the player who calls the function. Such as player address
    //player ID, etc. This function also takes in the bet type 1 = 50% odds and 0 = 25% odds.
    //We then set the bet mapping to the passed in bet type for later referance. We also push the 
    //created player instance to the betLog array. We set the isActive and waitingForOracle mapping
    //for the function caller (msg.sender) to true and flase respectively. and since the function
    //is payable we increment the cotract baalance by the betAmount passed in by msg.sender. The bet
    //amdount is equal to msg.value
    function setBet(uint _betType) public betConditions payable  {

        //initalize a player#
        string memory result;
        if(_betType == 1) {
            result = "Heads";
            betType[msg.sender] = 1;
        }else {
            result = "Tails";
            betType[msg.sender] = 0;
        }
        
        player[msg.sender].playerAddress = msg.sender;
        player[msg.sender].betAmount = msg.value;
        player[msg.sender].hasWon = false;
        player[msg.sender].bet_type = result;
        player[msg.sender].id = _id;

        //push the player to the betLog
        betLog.push(Player(msg.sender, msg.value, false, result, _id));
        isActive[msg.sender] = true;
        flipped[msg.sender] = false;
        waitingForOracle[msg.sender] = false;

        //set waiting for oracle result to true
        //and update balances / id accordingly
        contratcBalance[address(this)] += player[msg.sender].betAmount;
        // contratcBalance[address(this)] += player[msg.sender].betAmount;
        _id++;
        
        emit betInitialized(msg.sender, player[msg.sender].betAmount, player[msg.sender].id);
       
    }

    
    //Once the setBet function is called we can then call the flip coin function. The reason we
    //set isActive[msg.sender] = false, and waitingForOracle[msg.sender] = false is because we should
    //not be able to flip the coin either if the player has not created a bet and if the player is waiting
    //for the oracle result. We then set waiting For Oracle[msg.sender] = true because once we flip the coin
    //we are waiting for the random oracle result. We call the oracle with the generateRandomNumber function
    //which tales in a seed (this seed can be any interger it doesnt matter).
    function flipCoin() public {
        
        require(isActive[msg.sender] == true);
        require(waitingForOracle[msg.sender] == false);
        
        
        waitingForOracle[msg.sender] = true;
        flipped[msg.sender] = true;
        getRandomNumber(uint256(keccak256(abi.encodePacked(msg.sender, block.timestamp))));
        
        emit coinFlipped(msg.sender, player[msg.sender].id, isActive[msg.sender]);
      
    }

    
    //After we call the flip coin function we can call the settle bet function which settles the
    //bet and updates the player and contratc balance depending on the result generated from the
    //chainlink oracle. The reason we set waitingForOracle[msg.sender] = true in the flipCoin function
    //is because we should not be able to call settlBet until the coin is flipped. We also should not be
    //able to call this function is isActive[msg.sender] == false, as that would mean the player has not
    //created a bet. If the random result is 1 then we set player[msg.sender].hasWon == true. It is set to 
    //false by default so there is no need to make an elif satement. We then settle the bet for the two bet types
    //for (50/50) if the player wins we deduct the contract balance by 2 * betAmount and transfer 2 * betAmount
    //to the player. If they loose we just emit the avent since the player initiall bet is already part of the
    //contract balance. If the bet type is (25/75) then we do the same process only we update both balances
    //by 4 * betAmount since is the payer chooses this bet option then they win 4 times initial bet because the
    //odds are loweer. At the end of the function we set isActive and waiting for Oracle to false so that the
    //player can make a new bet
    function settleBet() public payable  {
        
        require(flipped[msg.sender] == true);
        require(isActive[msg.sender]);
        require(waitingForOracle[msg.sender] == false);
        
        if (RandomResult == 1) {
            player[msg.sender].hasWon = true;
            betLog[_id].hasWon = true;
        }
        
    
        uint256 oldContractBalance = contratcBalance[address(this)];
        uint betAmount = player[msg.sender].betAmount;

        //update player balances respectively depending
        if (player[msg.sender].hasWon && betType[msg.sender] == 0) {
            
            contratcBalance[address(this)] -= 2 * player[msg.sender].betAmount;
            msg.sender.transfer(2 * player[msg.sender].betAmount);
            emit FlipResult (msg.sender, true, betAmount * 2);
            
        }
        else if (!player[msg.sender].hasWon && betType[msg.sender] == 0) {
            emit FlipResult (msg.sender, true, betAmount * 2);
            
        }
        else if (player[msg.sender].hasWon && betType[msg.sender] == 1) {
            
            contratcBalance[address(this)] -= 4 * player[msg.sender].betAmount;
            msg.sender.transfer(4 * player[msg.sender].betAmount);
            emit FlipResult (msg.sender, true, betAmount * 2);
            
        }
        else if (!player[msg.sender].hasWon && betType[msg.sender] == 1) {
            emit FlipResult (msg.sender, true, betAmount * 2);
            
        }

        waitingForOracle[msg.sender] = false;
        isActive[msg.sender] = false;

        // emit balanceUpdated(msg.sender, playerbalance[msg.sender], oldPlayerBalance);
        emit balanceUpdated(address(this), contratcBalance[address(this)], oldContractBalance);
        
        
    }



    // *************************************************************************************************
    // *            -------------------DEPOSIT/WITHDRAWABLE FUNCTIONS--------------------------        *                                                                            *
    // *************************************************************************************************

    //this function lets the admin or contratc creator withdraw the entire contratc balance
    function withdraw() public payable isOwner  {
       
        msg.sender.transfer(contratcBalance[address(this)]);
        contratcBalance[address(this)]-= contratcBalance[address(this)];

        emit withdrawMade(msg.sender, contratcBalance[address(this)]);

    }
    

    //this function lets the contract creator deposit funds into the contract
    function deposit() public payable isOwner {
        // playerbalance[msg.sender] += msg.value;
        contratcBalance[address(this)] += msg.value;

        emit depositMade(msg.sender, msg.value);
    }


    // *************************************************************************************************
    // *            ------------------_HELPER FUNCTIONS--------------------------                      *                                                                            *
    // *************************************************************************************************
    
    
    //function that stores infromataion on if the coin has been flipped of not
    //for the player
     function Flipped() public view returns (bool) {
        return flipped[msg.sender];
    }
    
    //function that stores information on whether the player is waiting for
    //the oracle random number 
    function notWaiting() public returns (bool) {
        waitingForOracle[msg.sender] = false;
        return waitingForOracle[msg.sender];
        
    }

    //function that lets the player cancel their bet. A player can ONLY camcel an bet
    //if one, they have made a bet with the setBet function and two, they have not flipped
    //coin. I.e isActive[msg.sender] == true and waitingForOracle[msg.sender] == flase. If they
    //cancel they get transfered back their bet amount
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
    
    //function that returns the players bet type
    function getBetType() public view returns (uint) {
        return betType[msg.sender];
    }
   

    //get Bet status, is player playing or not
    function getRandomNumber() public view returns(uint) {
        return RandomResult;
    }

    //Function that gets the players bet status retrns isActive mapping
    function getBetStatus() public view returns(bool) {
        return isActive[msg.sender];
    }
    
    //returns the oracle querey log for all players
    function getQueryLog() public view returns(OracleQuery[] memory) {
        return queryLog;
    }
  

    //function that returns the status of the players winnings
    function hasWon() public view returns(bool) {
        return player[msg.sender].hasWon;
    }

    //return msg.sender
    function getPlayer() public view returns(address) {
      
        return msg.sender;
    }
    
    //returns the contract balance
    function getContratcBalance() public view returns(uint) {
      
        return contratcBalance[address(this)];
    }
 
    
    //return the players bet amount
    function getCurrentBet() public view returns(uint) {
        return player[msg.sender].betAmount;
    }
    
    //return the bet Log of all bet histroys   
    function getActiveBets() public view returns(Player[] memory) {
        return betLog;
    }
}
