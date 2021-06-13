var web3 = new Web3(Web3.givenProvider);
var contractInstance;
contract_address = "0x964E19399fe7FdDb9522E4026D4217D0946c2dEd";

//helper variables 
var betisActive = false;
var active;
var waitingForOracle;
var heads_tails = 0;
var _betType = 0;


 // *************************************************************************************************
    // *            -------------------Main structure on page load--------------------------                       *                                                                            *
    // *************************************************************************************************

$(document).ready(function() {
  
    window.ethereum.enable();
    window.ethereum.enable().then(function(accounts) {

       
        contractInstance = new web3.eth.Contract(abi, contract_address, {from: accounts[0]});
        console.log(contractInstance);

    });
    
    //we have 4 main buttons. The deposit button/withdraw button which are
    //restricted to the contract creator. The we have the betData and flipData
    //buttons which the player used to execute the bet algorithm logic
    $("#deposit_button").click(deposit)
    $("#add_bet_button").click(betData)
    $("#flip_coin_button").click(flipData);
    $("#withdraw_b").click(withdrawData)

    //the menulist button shows a hover menu which have more buttons
    //such as getBalance, dapp Rules, cancel bet Button and a choose
    //betType button
    $("MenuList").hover(function(adminMenu){
       
    });
})


 // *************************************************************************************************
    // *            -------------------MONATAREY FUNCTIONS--------------------------                       *                                                                            *
    // *************************************************************************************************


//this function is seecuted when the admin clicks the depost button and it
//calls our deposit function from the coinflip smart contract
function deposit() {

    var depositAmount = $("#deposit_input_box").val();
    var config = {
        value: web3.utils.toWei(String(depositAmount), "ether")
    }

    contractInstance.methods.deposit().send(config)
    //get transaction has on creation

}

function withdrawData() {

    const balance = contractInstance.methods.getContratcBalance().call().then(function(balance) {
        $("#bet-output").text(String(balance) + " Eth");
    })
    console.log(balance);
    contractInstance.methods.withdraw().send();

}


 // *************************************************************************************************
    // *            -------------------MAIN FUNCTIONS--------------------------                       *                                                                            *
    // *************************************************************************************************

//this function is called when the player clicks the place bet button and this functiion calls
//the setBet function in our smart contract which initialises a player bet and depositis the players 
//bet amount into the contracts funds. We first call the getBetStatus function and if its true then we
//set a var active to true and we use this to prevent the player clicking the place bet button again if 
//they already have an unresolved bet. We do this by returning from the function if active == true. We then 
//call the setBet function. On the genration of the transction hash we show the loader animation so that the player
//knows the function is being processed, on the transction confirmation we conversly hide the loading anim
function betData(){

    var h = contractInstance.methods.getBetStatus().call().then(function(res) {
        if (res == true) {
            active = true;
        }
        else {
            active = false;
        }
        
    })

    if (active == true) {
        checkForActiveBet();
        return;
    }


    contractInstance.once('betInitialized', 
    {
       
        fromBlock: 'latest'
    }, (error, event) => {
        if(error) throw("Error fetching events");
        console.log("bet init");
        var betisActive = true;
    });

    
    var betAmount = $("#bet_input").val();
    var config = {
        value: web3.utils.toWei(String(betAmount), "ether")
    }

    const currentBet = contractInstance.methods.getCurrentBet().call()


    $("#bet_output").text(`You bet ${(String(betAmount))} ether`);
    contractInstance.methods.setBet(_betType).send(config)
        .on("transactionHash", function(hash) {
            $("#bet_output").text(`Confirming bet transaction..`);
            console.log(hash);
            loadLoader();
            
        })
        //get confirmation message on confirmation
        .on("confirmation", function(confirmationNr) {
            console.log(confirmationNr);
            

        })
        //get receipt when ransaction is first mined
        .on("receipt", function(receipt) {
            console.log(receipt);
            alert("Transaction successful");
            $(".loader").hide();
            $("#bet_output").text("You can now flip the coin");



        }).on("error", function(error) {
            console.log("user denied transaction");
            $("#bet_output").text("User denied the transaction");
            $(".loading").hide();
            
        }).then(function() {
            $(".loading").hide();

        })
    
   
}



//this function is called when the player clicks the flipCoin button. We cannot call this function
//if the player has not made a bet or is the player is waiting on the oracle result. We start off my 
//asssertig that our active variable == true s that we can enter the function. We also call the event listener
//which listenes out for the event which gets emmitted when the oracle has been resolve and has generated a random number#
//(see contract code) It is only when this happens that we call the settleBet function which gets executed when the 
//event listener has been resolved. However this takes a while so while the event listener is listeneing for out 
//gemeratedRnadomNumber event we call the flipCoin function in the smart contract which is actually
//the function which initially calls the oracle random number geneerator. It also does other things like
//seting the waiitng for oracle maping to false. When the settel bet function is enetered we display a popup whoch
//displays the result of the bet how much we won/Lost and we update our balance for the contract
function flipData(){

    if (active == false) {
        return;
    }
    if (waitingForOracle == true) {
        checkForActiveOracle();
        return;
    }

    contractInstance.once('generatedRandomNumber', 
        {
        filter: { player: "0xfEE3865AfdDF38fB691C7bE3AabCCDeB96b34499" },
        fromBlock: 'latest'
        }, (error, event) => {
        if(error) throw("Error fetching events");
        console.log("oracle resolved");
        $("#bet_output").text(`Bet Settled. Loading Result..`);

        var winAmount = $("#bet_input").val() * 2;
        var looseAmount = $("#bet_input").val();

        var randomN = contractInstance.methods.getRandomNumber().call().then(function (rand) {
            console.log(rand);
            if(rand == 1) {
                console.log("you won congrats")
            }
            else if (rand == 0) {
                console.log("unlucky you lost");
                // return(res.data);
            }

            contractInstance.methods.settleBet().send().then(function (out) {
                waitingForOracle = false;
                console.log("entered settle bet func")
                $(".loading").hide();
                active = false;
                if(rand == 1) {
                    checkForLoad();
                    setTimeout(function () {
                        $("#win-loose").text("Congratulations. You won!");
                    }, 3500)
    
                    setTimeout(function () {
                        $("#win-loose-prize").text("Winnings:\n" + String(winAmount) + " Eth");
                    }, 4500)
    
                    setTimeout(function () {
                        const balance = contractInstance.methods.getContratcBalance().call().then(function(balance) {
                            $("#win-loose-balance").text("Balance:\n" + String(balance) + " Eth");
                        });
                    
                    }, 5000)
                    $(".loader").hide();
                    $("#bet_output").text("Congratulations! You won");
                    // $("#bet-output").text("You won " + String(balance) + " Eth");
                }
                else {
    
                    checkForLoad();
                    setTimeout(function () {
                        $("#win-loose").text("Oops you lost. Hard luck!");
                    }, 3500)
    
                    setTimeout(function () {
                        $("#win-loose-prize").text("Loosings:\n" + String(looseAmount) + " Eth");
                    }, 4500)
    
                    setTimeout(function () {
                        const balance = contractInstance.methods.getContratcBalance().call().then(function(balance) {
                            $("#win-loose-balance").text("Balance:\n" + String(balance) + " Eth");
                        });
                    
                    }, 5000)
                    $("#bet-output").text("You won " + String(balance) + " Eth");
                    $(".loader").hide();
                    $("#bet_output").text("Hard luck you lost");
                    
                    
                }
            })
    
        })
        
    });

    

    var winAmount = $("#bet_input").val() * 2;
    var looseAmount = $("#bet_input").val();
    
    contractInstance.methods.flipCoin().send()
    .on("transactionHash", function(hash) {
        $("#bet_output").text("Flipping the coin..");
        waitingForOracle = true;
        console.log(hash);
        loadLoader();

    })
    //get confirmation message on confirmation
    .on("confirmation", function(confirmationNr) {
        console.log(confirmationNr);
        

    })
    //get receipt when ransaction is first mined
    .on("receipt", function(receipt) {
        console.log(receipt);
        alert("Transaction successful");
        $(".loader").hide();
        $("#bet_output").text("Retrieving Bet output from Oracle..");



    }).on("error", function(error) {
        console.log("user denied transaction");
        $("#bet_output").text("User denied the transaction");
        $(".loading").hide();
        
    }).then(function (res) {
        console.log("calling oracle");
            
            
           
    })

 
    const balance = contractInstance.methods.getContratcBalance().call().then(function(balance) {
        $("#bet-output").text(String(balance) + " Eth");
    })
    console.log(balance);
    console.log("Finished this function");
    
   
   
}


 // *************************************************************************************************
    // *            -------------------HELPER FUNCTIONS--------------------------                       *                                                                            *
    // *************************************************************************************************


//all of the following functions are helper functions for the User interface. Most of them are functions
//that toggle the display of variouys popups. For exampple checkForbalnkWithdraw() and checkForBlankFlip() toggle
//popups that alert the user that they cannot withdraw without specifying a withdrawal amount ot that they cannot
//flip the coin without having previously placing a bet. Other functions like get player balance and the likes are also 
//located below in this section
function checkForBlankWithdraw() {
    //handle in future by saying if isActive = flase then cannot flip coin
    const balance = contractInstance.methods.getContratcBalance().call().then( function(res) {
        if (res != 0) {
            document.getElementById("popup-withdraw").classList.toggle("active");
    
        }
    });
    
}

function togglePopup() {
    document.getElementById("popup-1").classList.toggle("active");

    const Balance = contractInstance.methods.getContratcBalance().call().then(function(res) {
        res = res / 10 ** 18;
        res = res.toFixed(3)
        $("#balance_output").text(String(res) + " Eth");
    })

    const owner = contractInstance.methods.getPlayer().call().then(function(res) {
        $("#address_output").text(String(res));
        contractInstance.methods.hasWon().call().then(function(res1) {
            console.log(res1);
        })
    })

    var bals = getPlayerBalance() 
    console.log(bals);
    $("#User-balance_output").text(String(bals));

    
    
}

function toggleRulesPopup() {
    document.getElementById("rulespopup1").classList.toggle("active");
    
}

function checkForBlank() {
    if (document.getElementById("bet_input").value == "") {
        document.getElementById("popup-input").classList.toggle("active");
    }
    else if (document.getElementById("bet_input").value == "") {
        document.getElementById("popup-flip").classList.toggle("active");

    }

    
}


function checkForBlankFlip() {
    //handle in future by saying if isActive = flase then cannot flip coin
    console.log("made it");
    
    // document.getElementById("popup-flip").classList.toggle("active");
    contractInstance.methods.getBetStatus().call().then( function(res) {
        console.log(res);
        if (res == false) {
            active = false;
            document.getElementById("popup-flip").classList.toggle("active");
    
        }
        else {
            active = true;
        }

        return active;
    });

    
}


function checkForLoad() {
    //handle in future by saying if isActive = flase then cannot flip coin
    
    document.getElementById("popup-load").classList.toggle("active");
    // document.getElementById("Winnings").classList.toggle("a")  
    
}

function withdrawRequest() {
    // handle in future by saying if isActive = flase then cannot flip coin
    const balance = contractInstance.methods.getContratcBalance().call().then( function(res) {
        if (res != 0) {
            document.getElementById("popup-withdraw2").classList.toggle("active");
    
        }
    });
    document.getElementById("popup-withdraw2").classList.toggle("active");
    
}

function checkinput() {

    var betAmount = $("#withdraw_input").val();


}

function depositQuerey() {
    
    document.getElementById("popup-deposit").classList.toggle("active");
    
   
}

function adminMenu() {
    console.log("mouse hover")
    contractInstance.methods.getPlayer().call().then(function(res) {
        console.log(res);
        if(res != "0x59C6c942cB04fe92743D40dF4A92B55E69B3D6C8") {
           
            console.log("incorrect addres");
            document.getElementById("dropdown-2").style.display = "none";
        }
    })
    
}

function adminMenu2() {
    document.getElementById("popup-admin").classList.toggle("active");

}

function getPlayerBalance() {

    const owner = contractInstance.methods.getPlayer().call().then(function(res) {
        console.log(res);
        const bal = web3.eth.getBalance(res).then(function (bals) {
            console.log(bals);
            bals = bals / 10 ** 18;
            bals = bals.toFixed(3)
            $("#User-balance_output").text("\n" + String(bals) + " Eth");
            // return bals;
        });
       
    })
}

//this function toggles the display of the loading animiation when called
function loadLoader() {
    
    $(".loading").show();
}

//this function toggles the bet type when the player clicks the 2x bet/4x bet button in
//the menu dropdown.
var BetClicked = false;
function toggleBetType() {

    

    if(!BetClicked) {
        BetClicked = true;
        document.getElementById("betType1").innerHTML = "4x Bet";
        _betType = 1;
        console.log(_betType);
       
        
    }
    else {
        BetClicked = false;
        document.getElementById("betType1") .innerHTML = "2x Bet";
        _betType = 0;
        console.log(_betType);
        
    }
}

function checkForActiveBet() {

    document.getElementById("popup-active").classList.toggle("active");

}

function checkForActiveOracle() {

    document.getElementById("popup-oracle").classList.toggle("active");

}





