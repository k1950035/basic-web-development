const STARTING_POELR_CHIPS = 100;
const PLAYERS = 3;
const NO_OF_STARTER_CARDS = 2;
let gameHasEnded = false; 

let playerOneName = "Chole";
let playerTwoName = "Jasmine";
let playerThreeName = "Jen";

console.log(`${playerOneName}, ${playerTwoName}, ${playerThreeName}`);

let playerOnePoints = STARTING_POELR_CHIPS;
let playerTwoPoints = STARTING_POELR_CHIPS;
let playerThreePoints = STARTING_POELR_CHIPS;

playerOnePoints -= 50;
playerTwoPoints -= 25;
playerThreePoints += 75;
