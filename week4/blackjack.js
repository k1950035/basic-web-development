let cardOne = 7;
let cardTwo = 5;
let sum = cardOne + cardTwo;
let cardOneBank = 2;
let cardTwoBank = 1;
let bankSum = cardOneBank + cardTwoBank;

if(sum==21){
    console.log("BlackJack!");
}
else if (sum>21){
    console.log("You Lost");
}
console.log(`You have ${sum} points`);

if(sum+bankSum>21){
    console.log("Bust");
}

let cardThreeBank = 6;
let cardFourBank = 4;
let cardThree = 7;
sum += cardThree;


bankSum = cardOneBank + cardTwoBank + cardThreeBank + cardFourBank;

while(bankSum<17){
    let accCard = 2
    bankSum+=accCard;
}
if (bankSum > 21 || (sum<=21&&sum>bankSum)){
    console.log("You Win");
} else if(bankSum===sum){
    console.log("Draw!");
}
else {
    console.log("Bank wins");
}