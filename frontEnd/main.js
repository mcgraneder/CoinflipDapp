var web3 = new Web3(Web3.givenProvider);
var contractInstance;
contract_address = "0xFB327A84FbE2019AF3b83919681E65eB8fa0a589";

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
    $("#add_bet_button").click(betData)

    $("#flip_coin_button").click(flipData)
    //insyanciate the get data button
   

})

function betData(){
    //to input data we need the values of the create person forum
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
    contractInstance.methods.setBet().send(config)
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

   
}

async function flipData(){
    //to input data we need the values of the create person forum
    // var betAmount = $("#bet_input").val(); //.val() gets the value 
   
    // var config = {
    //     value: web3.utils.toWei(String(betAmount), "ether")
    // }
    
    const randomSeed = await contractInstance.methods.flipCoin().call().then( async function(res) {
        $("#bet_output").text("You won");
    });
    console.log(randomSeed);

    const owner = contractInstance.methods.getPlayer().call();

    owner.then(function(res) {
        $("#address_output").text(String(res));
    })

    

   
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
