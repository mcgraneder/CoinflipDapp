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
