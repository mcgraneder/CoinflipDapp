// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract CoinFlip {

    
    struct Player {
        address playerAddress;
        uint256 betAmount;
        bool isActive;
        uint id;
    }
    
    mapping(address => Player) player;
    Player[] betLog;
    mapping(address => uint256) playerbalance;
    mapping(address => uint256) contratcBalance;
    
    constructor() {
       
        contratcBalance[address(this)] = 100000000;
    }
    
    modifier betConditions {
        // require(msg.value >= 0.001 ether, "Insuffisant amount, please increase your bet!");
        //require(msg.value <= getContractBalance()/2, "You can't bet more than half the contract's balance!");
        require(player[msg.sender].isActive == false, "A bet is already ongoing with this address.");
        _;
    }
    
     
    function getContratcBalance() public view returns(uint) {
      
        return contratcBalance[address(this)];
    }
    
     
    function getPlayerBalance() public view returns(uint) {
        return playerbalance[msg.sender];
    }
    
    function random() public view returns(uint) {
        return block.timestamp % 2;
    }
    
    function getCurrentBet() public view returns(uint) {
        return player[msg.sender].betAmount;
    }
    
     function getPlayerId() public view returns(uint) {
        return player[msg.sender].id;
    }
    
    function getActiveBets() public view returns(Player[] memory) {
        return betLog;
    }
    
    function setBet() public payable betConditions {
        uint  _id = 0;
        
        for (uint i = 0; i < betLog.length; i++)
        {
            require(betLog[i].playerAddress != msg.sender, "Already registered");
        }
       
        player[msg.sender].playerAddress = msg.sender;
        player[msg.sender].betAmount += msg.value;
        player[msg.sender].isActive = true;
        player[msg.sender].id = _id;
        betLog.push(Player(msg.sender, msg.value, true, _id));
        _id++;
        
       
    }
   
    
    function flipCoin() public returns(uint) {
        
        require(player[msg.sender].isActive == true);
        // uint user_index = player[msg.sender].id;
        uint randomSeed = random();
        bool betWin;
        if (randomSeed == 1) betWin = true;
        if(betWin) {
            uint amountWon = player[msg.sender].betAmount * 2;
            playerbalance[msg.sender] += amountWon;
            contratcBalance[address(this)] -= amountWon;
        }
       
            
        else {
            playerbalance[msg.sender] -= player[msg.sender].betAmount;
            contratcBalance[address(this)] += player[msg.sender].betAmount;
            
        }
        
       
        betLog.pop();
        
        delete(player[msg.sender]);
        
        return(randomSeed);
    }
}

//make playerBet struct --> address
    //                      --> betAmount
    //                      --> balance
    //                      --> id

    //make an isActibeBet mapping which maps player address to a boolean
    //flase if no bet in play, true otherwise. This saves space by having no
    //isActibe arrtibute in the struct where the only way to lok up would to 
    //make an instance array and loop through it

    //the bet Id will the index

    //no player can make more than one active bet at once.

    //payer must deposit an entrance fee into the contract for sustainbility

    //initilais the contratcs balance with 10 ether to support the small chance
    //of someone wiping it out

    //cannot make a bet more than 1/3 of the contratcs balance

    //do make an instance struct to kkp traxk of players. delete the player
    //after there bet is ettled by id, but log an event so that their histroy
    //can be tracked even after there bet is settled and deleted. Saves gas