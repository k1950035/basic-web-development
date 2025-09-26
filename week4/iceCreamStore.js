let iceCreamFlavors = [
    {name : "Chocoloate", type : "Chocoloate", price:2},
    {name : "Strawberry", type : "fruit", price:1},
    {name : "Vanilla", type : "Vanilla", price:2},
    {name : "Pistachio", type : "Nuts", price:1.5},
    {name : "Neapolitan", type : "Chocoloate", price:2},
    {name : "Mint Chip", type : "Chocoloate", price:1.5},
    {name : "Raspberry", type : "Fruit", price:1}
];


let transactions = []

transactions.push({scoops: ["Chocolate", "Vanilla", "Mint Chip"], total: 5.5})
transactions.push({scoops: ["Raspberry", "StrawBerry"], total: 2})
transactions.push({scoops: ["Vanilla", "Vanilla"], total: 4})

const total = transactions.reduce((acc,curr)=> acc + curr.total, 0);
console.log(`You've made ${total} $ today`)

let flavorDistribution = transactions.reduce((acc,curr)=>{
    curr.scoops.forEach(scoop => {
        if(!acc[scoop]){
            acc[scoop] = 0; 
        }
        acc[scoop]++;})
    return acc;
    },{})

let maxIceCream = Object.keys(flavorDistribution);
maxIceCream.sort();
console.log(maxIceCream[maxIceCream.length-1]);