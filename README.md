# CoinflipDapp
This is a simple betting dApp that i made. It works by letting a user connect to a front end with their metamask wallet. The contract has funds deposited into the smart 
contract by the contract owneer. The player can set bets to win ether. There are two types of bets. The first allows the user two win double there money with odds of 50%.
The second type of bet lets the user to quadruple their money with 25% odds. The way the app works is the player creates a bet. Once the bet transaction has been confirmed they 
can "flip the coin". Once the coin is flipped a request is made to the cahinlink random oracle which requests a random number. Once the oracle request is resolved the random number
is sent back to the dapp and the players bet is resolved. If the result of the random oracle is equal to 1, then the player either wins 2 * their initial bet  of 4 * their initial
bet depending on the type of bet they chose.

Th the game has a few rules. Firstly only the admin (contract creator) can deposit and withdraw funds from the contract. They act like the "House" or "casino". They player can only create one
bet at a time. They do have the option to cancel their bet but they can only do so if they have placed a bet but not flipped the coin. Omce they flip the coin they can not cancel
their bet. Also once they flip the coin they cannot reflip to try cheat the system until the random oracle number has been generated and the bet has been resolved.

Below are instructions on how to clone this repositorys code and use it for yourself on your loacl machine

# Prereqruises
to use this code you need to have truffle and node.js installed on your machine to run the code. You also need to have the MetaMask chrome browser wallet extesion installed. To install truffle you first need to install node.js. You can install node through this link. https://nodejs.org/en/ I reccomend using v14. Once node.js is installed open your cmd or terminal and install truffle using ``npm install -g truffle``. this project was coded node.js **v14.16.0** and using truffle **v5.3.2** so to remain consistent with me install truffle using ``npm install -g truffle@5.3.2``. Once truffle has been installed successfully follow the steps below to clone and begin using the project code

# Step 1
to use this repository for yourself there are a few steps you need to follow. Firstly create a new directory somewhere in your computer. Open your cmd or terminal in that directory. Once you do so come back to ths repository and copy the repository link. You can get it by clicking the "green" code bytton on the main branch page of this repo. Onc done type ``git clone`` into your terminal a space and then paste the repo link.

# step 2
the next step is to set up the truffle-config.js file inorder to be able to deploy the smart contracts to the testnet. Firstly go to the following website and make an account. Once you make an account go to projects and create a new project. Call it coinFlip or something. Once the project is made switch the network from mainnet to kovan. Copy and pase the project id into the hd wallet provider line of code on line 84 in the ``truffle-config.js`` file in the backend directory of this project. Note that you should place the project ID in the part of this code labelled "PASTE INFURA PROJECT ID HERE". Likewise go back to the infura project and copy the infura key and past it into the quotation marks on lin 42 in the ``truffle-config.js`` file. replace the temp placeholder which says PASTE YOUR INFURA KEY HERE. The next thing you will need to do is to create a file called ``.Secret`` in the same backend directory. Go to your metamask eallet and get you wallets seed phrasse from the advanced settings page and paste these into the .secret file. Once this is done in your terminal install the truffle hd wallet provider by running ``npm install --save dev @truffle/hdwallet-provider``. When this is done move onto the next step. (MAKE SURE TO NEVER REVEAL YOUR SEED PHRASE TO ANYONE.

# step 3
Once cloned successsfully, **(type ``code .`` if you use VS code to open the folder in Code. If you use another editor this will not apply to you)**. while remaining in your terminal type ``cd CoinflipDapp/`` to change intot the directory with the code. The node and truffle dependancyies will already come preinstalled so there is no need to to type ``npm  init`` or ``truffle init``. To compile the code navigate into the backend directory by typing ``cd Backend/`` and typing ``truffle migrate --network kovan --reset``. You need to deploy to a testnet in order to use this project because the chainlink random oracle does not work on local deployment chains such as ``truffle develop`` or the  ``truffle console`` enviornments. Note that most likley deploying to the kovan testnet using the command above will take multiple efforts (sometimes up to 5 or more) dont worry this is normal. Do not however, that once you run the command once, every other time you should run ``truffle migrate --network kovan`` instead.  

# step 4
Once you have successfully deployed to the kovan testnet open up a new terminal inside the frontEnd diectory. Make sure you open a new terminal do not use your current terminal which is in the backend directory. ONce in the front end directpry start up a local server to load the front end user interface by running ``python -m http.server 8000``. To do this you need to have python 3 installed on your machine. Their are plently of tutorials on youtube.

# Step 5
Have a look through the code and see what functions there are. To use this code in truffle develope initialise the dex, eth and link tokens by typing ``let dex = await Dex.deployed``. ``let eth = await Eth.deployed`` etc... When initialised simply type ``dex``, or ``eth`` to get a list of all of the functions that you can use with the instance. To know what arguments they take simply refer to the code. The way we set up the dex can be seen with the tests written in the test folder

# step 6
One final thing that may not be installed im not sure is the truffle assertions. We need these to run the ``truffle test`` command which will run all of the 15 tests i have written. If you type "truffle test" into the console and nothing happens or you dont get 15 passes then maybe try installing truffle assertions with ``npm install truffle-assertions``. This is not the most important as i have already tested the code briefly. But if you want to change and modify for yourself its a god ideaa to get the premade tests working with truffle assertions.

# Enjoy

# DEMO Of the App & UI Screenshots

Link to a video demo of the app
https://www.youtube.com/watch?v=viz6dCDS2JQ

Screenshot of the UI
![dapp screenshot](https://user-images.githubusercontent.com/40043037/121742744-2cf6bd00-caf8-11eb-8b84-2dc0d176265f.PNG)
