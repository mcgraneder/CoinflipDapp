// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;

contract CoinFlip {

    
    struct Player {
        address playerAddress;
        uint256 betAmount;
        uint256 balance;
        bool isActive;
        bool hasWon;
        // bool isWithdrawable;
        uint id;
    }
    
    mapping(address => Player) player;
    Player[] betLog;
    mapping(address => uint256) playerbalance;
    mapping(address => uint256) contratcBalance;
    
    constructor() public {
       
        contratcBalance[address(this)] = 10000000000000000000;

    }
    
    modifier betConditions {
        // require(msg.value >= 0.001 ether, "Insuffisant amount, please increase your bet!");
        //require(msg.value <= getContractBalance()/2, "You can't bet more than half the contract's balance!");
        // require(player[msg.sender].isActive == false, "A bet is already ongoing with this address.");
        _;
    }
    

    function getBetStatus() public view returns(bool) {
        return player[msg.sender].isActive;
    }

    function getPlayer() public view returns(address) {
      
        return msg.sender;
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
        
        // for (uint i = 0; i < betLog.length; i++)
        // {
        //     require(betLog[i].playerAddress != msg.sender, "Already registered");
        // }
       
        player[msg.sender].playerAddress = msg.sender;
        player[msg.sender].betAmount = msg.value;
        player[msg.sender].balance = msg.value;
        player[msg.sender].isActive = true;
        player[msg.sender].hasWon = false;
        player[msg.sender].id = _id;
        playerbalance[msg.sender] = msg.value;
        betLog.push(Player(msg.sender, msg.value, msg.value, true, false, _id));
        _id++;
        
       
    }
   
    //update tomorrow to have the flip function update struct values
    //have another funcion which is then called that puts into play the effects
    function flipCoin() public view returns(bool) {
        
        require(player[msg.sender].isActive == true);
        // uint user_index = player[msg.sender].id;
        bool betWin;
        uint randomSeed = random();
        if (randomSeed == 1) {
            betWin = true;
        }
        else {
            betWin = false;
        }
      
        return(betWin);
    }

    function settleBet(bool randomSeed) public {

        // bool randomSeed;
       uint betAmount = player[msg.sender].betAmount;
        if(randomSeed) {
           player[msg.sender].hasWon = true;
        //   player[msg.sender].balance = betAmount;
           contratcBalance[address(this)] -= betAmount;
           playerbalance[msg.sender] += player[msg.sender].balance;
        }   
        else {
            player[msg.sender].hasWon = false;
            // player[msg.sender].balance -= betAmount ;
            contratcBalance[address(this)] += betAmount;
            playerbalance[msg.sender] -= player[msg.sender].balance;
            
        }

        player[msg.sender].isActive = false;
        delete(player[msg.sender]);
        betLog.pop();
        
    }

    function withdraw() public payable {
        require(playerbalance[msg.sender] != 0);

        uint256 withdrawAmount = playerbalance[msg.sender] / 2;
        player[msg.sender].balance = 0;
        playerbalance[msg.sender] = 0;
        contratcBalance[address(this)] -= withdrawAmount;
        // address payable playerAddress = payable(msg.sender);
        msg.sender.transfer(withdrawAmount);

       


    }
}
