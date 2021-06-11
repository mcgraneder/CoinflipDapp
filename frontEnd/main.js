var web3 = new Web3(Web3.givenProvider);
var contractInstance;
contract_address = "0x964E19399fe7FdDb9522E4026D4217D0946c2dEd";
var Stop;
var exit;
var acc1;
var betisActive = false;
var active;
var waitingForOracle;
var heads_tails = 0;
var _betType = 0;

$(document).ready(function() {
  
    window.ethereum.enable();
    // const accounts = web3.eth.requestAccounts();  
    // console.log(accounts[0]);
    // var account = await web3.eth.getAccounts();
    window.ethereum.enable().then(function(accounts) {

        //define contract instance
       
        contractInstance = new web3.eth.Contract(abi, contract_address, {from: accounts[0]});
        
        // await connectMetamask();
        console.log(contractInstance);

    });
    //we want to make a clickable button that executes our create person instance
    //we can use j query but must include our function call in the window
    //this represents the ID of our button tag in index.html
    $("#deposit_button").click(deposit)

    $("#add_bet_button").click(betData)

    // contractInstance.once('LogNewProvableQuery', 
    // {
    //     filter: { player: getPlayer() },
    //     fromBlock: 'latest'
    // }, (error, event) => {
    //     if(error) throw("Error fetching events");
    //     // jQuery("#events").text(`User ${event.returnValues.player} is waiting for the flip result`);
    //     console.log("waiting for result");
    // });

    


    //to solve issue of clicking flip button when bet is loading
    //wrap this call in a function so that it calls an instance of the
    //contratcs is_loading function and only let syou click if true
    $("#flip_coin_button").click(flipData)

    // contractInstance.once('FlipResult', 
    // {
    //   filter: { player: getPlayer() },
    //   fromBlock: 'latest'
    // }, (error, event) => {
    //   if(error) throw("Error fetching events");
    //   console.log("oracle resolved");
    // //   jQuery("#events").text(`User ${event.returnValues.player} won: ${event.returnValues.won}`);
    // });
  

    $("#withdraw_b").click(withdrawData)

    $("MenuList").hover(function(adminMenu){
       
    });

    // $("#cancel_bet").click(CancelBet)



    
    //insyanciate the get data button
   

})

async function connectMetamask() {
    if (typeof window.ethereum !== undefined) { 
      const accounts = await web3.eth.requestAccounts();  
    //   let p = await getPlayerAddress();
    //   jQuery("#playerAddress").text(p);
    }
  }

function deposit() {

    var depositAmount = $("#deposit_input_box").val();
    var config = {
        value: web3.utils.toWei(String(depositAmount), "ether")
    }

    // if (depositAmount == 0) {
    //     return;
    // }

    contractInstance.methods.deposit().send(config)
    //get transaction has on creation
   
    

}
function betData(){

    // active = false;


   
    
    var h = contractInstance.methods.getBetStatus().call().then(function(res) {
        if (res == true) {
            console.log("cannot make 2 bets");
            console.log(res);
            active = true;
        }
        else {
            active = false;
        }

        //make new popup
        
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
        // jQuery("#events").text(`User ${event.returnValues.player} is waiting for the flip result`);
        console.log("bet init");
        var betisActive = true;
    });
    
    var betAmount = $("#bet_input").val();
   //.val() gets the value 
   
    var config = {
        value: web3.utils.toWei(String(betAmount), "ether")
    }

    
    //now that we have gotten our inut data via jQuery we can call out
    //contratc function instance
    ///we use .on() which is an event listener which we can use to get qlerts f
    //for events
    const currentBet = contractInstance.methods.getCurrentBet().call()


    $("#bet_output").text(`You bet ${(String(betAmount))} ether`);
    
    // contractInstance.methods.setBet().call().then(function(res) {
        // document.getElementById("loading").style.display ="flex";
        
        
    // })
    // contractInstance.methods.setBet().call().then(function() {
        
    // })
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




function flipData(){

    // console.log(betisActive);
    // if(betisActive) {
    //     checkForBlankFlip();
    //     return;
    // }
    // var status = checkForBlankFlip();
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
        



    //   jQuery("#events").text(`User ${event.returnValues.player} won: ${event.returnValues.won}`);
    });

    // loadLoader();
    

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
    // .on("error", function(error) {
    //     console.log("user denied transaction");
    //     $("#bet_output").text("User denied the transaction");
    //     $(".loading").hide();
    // }).then(function() {
    //     $(".loading").hide();

    // })
     



    
    

 
    const balance = contractInstance.methods.getContratcBalance().call().then(function(balance) {
        $("#bet-output").text(String(balance) + " Eth");
    })
    console.log(balance);
    console.log("Finished this function");
    
   
   
}

function withdrawData() {

    // const etherValue = Web3.utils.fromWei(String(withdrawAmount), 'ether');
    // withdrawAmount * 2 * 10 ** 18;
    const balance = contractInstance.methods.getContratcBalance().call().then(function(balance) {
        $("#bet-output").text(String(balance) + " Eth");
    })
    console.log(balance);
    contractInstance.methods.withdraw().send();

}

function togglePopup() {
    document.getElementById("popup-1").classList.toggle("active");
    // document.getElementById("btn").style.display = "none";;

    // var balance = $("#balance_output").val();
    // const Balance = contractInstance.methods.getActiveBets().call().then(function(res) {
    //     console.log(res.length);
    //     for (let i = 0; i < res.length; i++) {
    //         for (let j = 0; j < res[i].length; j++) {
    //             // $("#balance_output").text(res[j][i]);
    //             console.log(res[i][j]);
    //         }
    //     }
    //     $("#balance_output").text(res[1][1]);
        
    // })

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

    // contractInstance.methods.getBetTyp().call().then(function (rand) {
    //     console.log(rand);
    // });
    

    // getPlayerBalance().call().then(function(res) {
    //     $("#User-balance_output").text(String(res));
    // });

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

function checkForOracle() {
    //handle in future by saying if isActive = flase then cannot flip coin
    console.log("made it");
    
    // document.getElementById("popup-flip").classList.toggle("active");
    

    
}

function checkForBlankWithdraw() {
    //handle in future by saying if isActive = flase then cannot flip coin
    const balance = contractInstance.methods.getContratcBalance().call().then( function(res) {
        if (res != 0) {
            document.getElementById("popup-withdraw").classList.toggle("active");
    
        }
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
        // if(adminMenu2()) {
        //     document.getElementById("popup-admin").classList.toggle("active");
        // }
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

function loadLoader() {
    
    $(".loading").show();
        // $(".loader").fadeOut("slow");
      

}

var clicked = false;
function toggleBet() {

    

    if(!clicked) {
        clicked = true;
        document.getElementById("betType").innerHTML = "tails";
        heads_tails = 1;
        console.log(heads_tails);
        
        
    }
    else {
        clicked = false;
        document.getElementById("betType") .innerHTML = "heads";
        heads_tails = 0;
        console.log(heads_tails);
       
    }
}

var BetClicked = false;
function toggleBetType() {

    

    if(!BetClicked) {
        BetClicked = true;
        document.getElementById("betType1").innerHTML = "2x Bet";
        _betType = 1;
        // contractInstance.methods.getBetType().call().then(function (res) {
        //     console.log(res);
        // })
        console.log(_betType);
       
        
    }
    else {
        BetClicked = false;
        document.getElementById("betType1") .innerHTML = "4x Bet";
        _betType = 0;
        // contractInstance.methods.getBetType().call().then(function (res) {
        //     console.log(res);
        // })
        console.log(_betType);
        
    }
}

function checkForActiveBet() {

    document.getElementById("popup-active").classList.toggle("active");

}

function checkForActiveOracle() {

    document.getElementById("popup-oracle").classList.toggle("active");

}





