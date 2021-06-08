var web3 = new Web3(Web3.givenProvider);
var contractInstance;
contract_address = "0x8803B1408D39C6448C08f9Ce3ae990ca2A63F066";
var Stop;
var exit;
var acc1;

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

    // contractInstance.methods.hasWon().call().then(function (randomNum) {
    //     console.log(randomNum);
    //     if(randomNum == true) {
    //         console.log("The random number is one")
    //     }
    //     else {
    //         console.log("The random number is 0");
    //         // return(res.data);
    //     }
    // });

    contractInstance.once('generatedRandomNumber', 
    {
        filter: { player: "0xD5f21085Bc1caaB3dCeb699378fa495796Ee7C0e" },
        fromBlock: 'latest'
    }, (error, event) => {
        if(error) throw("Error fetching events");
        // jQuery("#events").text(`User ${event.returnValues.player} is waiting for the flip result`);
        console.log("waiting for result");
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


    $("#bet_output").text(`${(String(betAmount))} ether`);
    contractInstance.methods.setBet().send(config).then(function(re) {
        console.log("HelloWorld");
       
    })
    
    //get transaction has on creation

    setTimeout(function() {
        $("#status_output").text(`You can now flip the coin`); 
    }, 4000) 

    // contractInstance.methods.getResult().call().then(function (r) {
    //     console.log("Made it to the result function");
    //     console.log(r);
    // })
    
    

   
}

function flipData(){

    contractInstance.once('FlipResult', 
    {
      filter: { player: "0xfEE3865AfdDF38fB691C7bE3AabCCDeB96b34499" },
      fromBlock: 'latest'
    }, (error, event) => {
      if(error) throw("Error fetching events");
      console.log("oracle resolved");
    //   jQuery("#events").text(`User ${event.returnValues.player} won: ${event.returnValues.won}`);
    });

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
        contractInstance.methods.flipCoin().call().then(function (res) {
            console.log(res);
            if(res == true) {
                console.log("you won congrats")
            }
            else if (res == false) {
                console.log("unlucky you lost");
                // return(res.data);
            }
            contractInstance.methods.settleBet(res).send().then(function (out) {
                console.log("entered settle bet func")
    
                if(res == true) {
                    checkForLoad();
                    setTimeout(function () {
                        $("#win-loose").text("Congratulations. You won!");
                    }, 3500)
    
                    setTimeout(function () {
                        $("#win-loose-prize").text("Winnings:\n" + String(winAmount) + " Eth");
                    }, 4500)
    
                    setTimeout(function () {
                        const balance = contractInstance.methods.getPlayerBalance().call().then(function(balance) {
                            $("#win-loose-balance").text("Balance:\n" + String(balance) + " Eth");
                        });
                       
                    }, 5000)
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
                        const balance = contractInstance.methods.getPlayerBalance().call().then(function(balance) {
                            $("#win-loose-balance").text("Balance:\n" + String(balance) + " Eth");
                        });
                       
                    }, 5000)
                    $("#bet-output").text("You won " + String(balance) + " Eth");
                    
                    
                }
            })
            
           
        })
     



    })
    

 
    const balance = contractInstance.methods.getPlayerBalance().call().then(function(balance) {
        $("#bet-output").text(String(balance) + " Eth");
    })
    console.log(balance);
    console.log("Finished this function");
    
   
   
}

function withdrawData() {

    
    var withdrawAmount = $("#withdraw_input").val();
    console.log(withdrawAmount);

    var config = {
        value: web3.utils.toWei(String(withdrawAmount), "ether")
    }
    // const etherValue = Web3.utils.fromWei(String(withdrawAmount), 'ether');
    // withdrawAmount * 2 * 10 ** 18;
    const balance = contractInstance.methods.getPlayerBalance().call().then(function(balance) {
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

    const Balance = contractInstance.methods.getPlayerBalance().call().then(function(res) {
        $("#balance_output").text(String(res) + " Eth");
    })

    const owner = contractInstance.methods.getPlayer().call().then(function(res) {
        $("#address_output").text(String(res));
    })
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
    const isActive = contractInstance.methods.getCurrentBet().call().then( function(res) {
        if (res == 0) {
            document.getElementById("popup-flip").classList.toggle("active");
    
        }
    });
    
}

function checkForBlankWithdraw() {
    //handle in future by saying if isActive = flase then cannot flip coin
    const balance = contractInstance.methods.getPlayerBalance().call().then( function(res) {
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
    const balance = contractInstance.methods.getPlayerBalance().call().then( function(res) {
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

function getPlayerBalance() {

    const owner = contractInstance.methods.getPlayer().call().then(function(res) {
        console.log(res);
        const bal = web3.eth.getBalance(res).then(function (bals) {
            console.log(bals);
        });
       
    })
}
