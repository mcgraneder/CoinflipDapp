var web3 = new Web3(Web3.givenProvider);
var contractInstance;
contract_address = "0xa5bF67cA51e9706B91a9FF5B9ef8B008566A6304";
var Stop;
var exit;

$(document).ready(function() {
  
    window.ethereum.enable();

    window.ethereum.enable().then(function(accounts) {

        //define contract instance
        
        contractInstance = new web3.eth.Contract(abi, contract_address, {from: accounts[0]});
        console.log(contractInstance);

    });
    //we want to make a clickable button that executes our create person instance
    //we can use j query but must include our function call in the window
    //this represents the ID of our button tag in index.html
    $("#deposit_button").click(deposit)

    $("#add_bet_button").click(betData)

    $("#flip_coin_button").click(flipData)

    $("#withdraw_b").click(withdrawData)

    
    //insyanciate the get data button
   

})

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
    .on("transactionHash", function(hash) {
        console.log(hash);

    })
    //get confirmation message on confirmation
    .on("confirmation", function(confirmationNr) {
        console.log(confirmationNr);
        

    })
    //get receipt when ransaction is first mined
    .on("receipt", function(receipt) {
        console.log(receipt);
        alert("Transaction successful");


    });
    
    

    const balance = contractInstance.methods.getPlayerBalance().call().then(function(balance) {
        $("#bet-output").text(String(balance) + " Eth");
    })
    console.log(balance);

}
function betData(){
    
    
    // to input data we need the values of the create person forum
    contractInstance.methods.getBetStatus().call().then(function(res){
        if (res == true) {
            console.log("I MADE IT");
            setTimeout(function () {
                document.getElementById("popup-input").classList.toggle("active");
            }, 40000)
            
            if (i != 0) { return; }
        }
    }) 


    
    var betAmount = $("#bet_input").val(); //.val() gets the value 
   
    var config = {
        value: web3.utils.toWei(String(betAmount), "ether")
    }

    
    //now that we have gotten our inut data via jQuery we can call out
    //contratc function instance
    ///we use .on() which is an event listener which we can use to get qlerts f
    //for events
    const currentBet = contractInstance.methods.getCurrentBet().call();
    $("#bet_output").text(`${(String(betAmount))} ether`);
    contractInstance.methods.setBet(betAmount).send().then(function(re) {
        console.log("HelloWorld");
    })
    //get transaction has on creation
    
    

   
}

async function flipData(){
    
    var winAmount = $("#bet_input").val() * 2;
    var looseAmount = $("#bet_input").val();

    let output = contractInstance.methods.flipCoin().call().then(function (res) {
        console.log(res);
        if(res == true) {
            console.log("goodbye")
        }
        else if (res == false) {
            console.log("hellow");
            // return(res.data);
        }
        contractInstance.methods.settleBet(res).send().then(function (out) {


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
                $("#bet-output").text("You won " + String(balance) + " Eth");
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
 
    const balance = contractInstance.methods.getPlayerBalance().call().then(function(balance) {
        $("#bet-output").text(String(balance) + " Eth");
    })
    console.log(balance);
    
   
   
}

function withdrawData() {

    
    var withdrawAmount = $("#withdraw_input").val();
    console.log(withdrawAmount);
    // const etherValue = Web3.utils.fromWei(String(withdrawAmount), 'ether');
    // withdrawAmount * 2 * 10 ** 18;
    const balance = contractInstance.methods.getPlayerBalance().call().then(function(balance) {
        $("#bet-output").text(String(balance) + " Eth");
    })
    console.log(balance);
    contractInstance.methods.withdraw(withdrawAmount).send().then();

}

function togglePopup() {
    document.getElementById("popup-1").classList.toggle("active");
    // document.getElementById("btn").style.display = "none";;

    // var balance = $("#balance_output").val();
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

