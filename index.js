var food = []

function AddDummyData(count) {
  var i, j;
  for(i = 0; i < count; i++) {
    var arr = [];
    arr.push(Math.floor(Math.random() * 300));  //cal
    arr.push(Math.floor(Math.random() * 10));   //pro
    arr.push(Math.floor(Math.random() * 10));   //fat
    arr.push(Math.floor(Math.random() * 10));   //carb
    if(i < (count / 3))
      arr.push(0);
    else if(i < (count * 2) / 3)
      arr.push(1);
    else 
      arr.push(2);
    food.push(arr);
  }
}

function RandomPopulation(popCount, menuCount, mealSize, mealCat) {
  var population = [];
  var i, j;
  
  for(i = 0; i < popCount; i++) {
    var newPop = new Set();
    var mealCatCount = mealCat.slice();

    while(newPop.size < mealSize) {
      var temp = [Math.floor(Math.random() * menuCount)];
      
      if(mealCatCount[food[temp][4]] != 0)
      {
        mealCatCount[food[temp][4]]--;
        newPop.add(temp);
      }
    }

    population.push(Array.from(newPop));
    for(j = 0; j < mealSize; j++) {
        population[i][j].push(Math.floor(Math.random() * 3) + 1);
    }
  }
  return population;
}

function CalcFitness(population, goal, mealSize) {
  var i, j, k;
  
  var totalFitness = [];
  for(i = 0; i < population.length; i++) {
    var pop = population[i];
    var fitness = [0, 0, 0, 0];

    //console.log(goal);
    //for(j = 0; j < 9; j++)
    //{
    //  console.log(food[pop[j][0]]);
    //}

    for(j = 0; j < 4; j++)
    {
      for(k = 0; k < mealSize; k++)
      {
        fitness[j] += (food[pop[k][0]][j] * pop[k][1]);
      }

      fitness[j] -= goal[j];
    }

    var weightAdjFitness = Math.abs((fitness[0] * 0.01) +
                            (fitness[1] * 1) +
                            (fitness[2] * 1) +
                            (fitness[3] * 0.1));

    //console.log(fitness[0]);
    //console.log(fitness[1]);
    //console.log(fitness[2]);
    //console.log(fitness[3]);
    //console.log(weightAdjFitness);

    totalFitness.push(weightAdjFitness);
  }

  return totalFitness;
}

function Mutate(item, menuCount) {
  var idx = Math.floor(Math.random() * item.length);
  var newItem = item.slice();
  newItem[idx][0] = Math.floor(Math.random() * menuCount);
  newItem[idx][1] = Math.floor(Math.random() * menuCount);
  return newItem;
}

function Crossover(itemA, itemB) {
  var idx = Math.floor(Math.random() * (itemA.length - 1));
  
  var newItemA = itemA.slice(0, idx).concat(itemB.slice(idx));
  var newItemB = itemB.slice(0, idx).concat(itemA.slice(idx));
  
  return [newItemA, newItemB];
}

function CheckMealCat(item, mealCat)
{
  var mealCatCount = [0, 0, 0];
  var i;
  for(i = 0; i < item.length; i++)
  {
    mealCatCount[food[item[i][0]][4]]++;
  }

  if(mealCat[0] != mealCatCount[0] || mealCat[1] != mealCatCount[1] || mealCat[2] != mealCatCount[2])
    return false;
  else
    return true;
}

function Genetic(popSize, roundCount, menuCount, mealSize, mealCat, nutrientGoals, cr, mr, kr) {
  var population = RandomPopulation(popSize, menuCount, mealSize, mealCat);
  var fitness = CalcFitness(population, nutrientGoals, mealSize);

  for(var i = 0; i < roundCount; i++) {

    //crossover/mutate new population
    var childCount = 0;
    var newPopulation = [];
    while(childCount < popSize) {

      //crossover random
      if(Math.random() < cr) {
        var crossA = Math.floor(Math.random() * popSize);
        var crossB = Math.floor(Math.random() * popSize);
        var crossO = Crossover(population[crossA], population[crossB]);
        
        if(crossO[0].length === new Set(crossO[0]).size && 
           CheckMealCat(crossO[0], mealCat) === true) {
          newPopulation.push(crossO[0]);
          childCount += 1;
        }

        if(crossO[1].length === new Set(crossO[1]).size && 
           CheckMealCat(crossO[1], mealCat) === true) {
          newPopulation.push(crossO[1]);
          childCount += 1;
        }
      }

      //mutate random
      if(Math.random() < mr) {
        var muteA = Math.floor(Math.random() * popSize);
        var muteO = Mutate(population[muteA], menuCount);

        if(muteO.length === new Set(muteO).size &&
           CheckMealCat(muteO, mealCat) === true) {
          newPopulation.push(muteO);
          childCount += 1;
        }
      }
    }

    //merge old and new
    population = population.concat(newPopulation);
    fitness = CalcFitness(population, nutrientGoals, 9);

    //sort by fitness
    var ids = sortIds(fitness);
    var sortedPopulation = reorder(population, ids);
    
    //cut best results out
    var keepIdx = Math.floor(sortedPopulation.length * kr);
    sortedPopulation.splice(keepIdx, sortedPopulation.length - keepIdx);
    population = sortedPopulation.concat(RandomPopulation(popSize - keepIdx, menuCount, mealSize, mealCat));
    console.log(CalcFitness([population[0]], nutrientGoals, 9));
  }

  return population[0];
}

function calcRequiredCalories(age, weight, height, sex, activityLevel, weightLossLevel) {
  var bmr = 0;
  var tdee = 0;
  var finalCal = 0;

  //weight in kg, height in cm
  //sex == 0 is male, 1 is female
  if(sex == 0)
    bmr = 66 + (13.7 * weight) + (5 * height) - (6.8 * age);
  else
    bmr = 665 + (9.6 * weight) + (1.8 * height) - (4.7 * age);
  
  //days of the week that user exercise
  //>7 is for competition-level exercise
  if(activityLevel == 0)
    tdee = bmr * 1.2;
  else if(activityLevel >= 1 && activityLevel <= 3)
    tdee = bmr * 1.375;
  else if(activityLevel >= 4 && activityLevel <= 5)
    tdee = bmr * 1.55;
  else if(activityLevel >= 6 && activityLevel <= 7)
    tdee = bmr * 1.7;
  else
    tdee = bmr * 1.9;

  if(weightLossLevel > 0)
    finalCal = tdee - 500;
  else
    finalCal = tdee;
  
  return finalCal;
}

function calcRequiredProtein(age, weight) {
  if(age >= 3 && age < 7)
    return weight * 1.1;
  else if(age >= 7 && age < 14)
    return weight * 1;
  else
    return weight * 0.8;

  //not sure about activity level yet, but around x1.4-1.7
}

function calcRequiredFat(calories) {
  var fat = (calories * 0.3) / 9;
  if(fat > 60)
    return 60;
  else
    return fat;
}

function calcRequiredCarb(calories) {
  return (calories * 0.5) / 4;
}

var sortIds = require('sort-ids');
var reorder = require('array-rearrange');

var age = 20;
var sex = 0;
var weight = 60;
var height = 170;
var activity = 0;
var weightloss = 0;

var reqNutrients = [];
var reqMealCat = [3, 3, 3];

reqNutrients[0] = calcRequiredCalories(age, weight, height, sex, activity, weightloss);
reqNutrients[1] = calcRequiredProtein(age, weight);
reqNutrients[2] = calcRequiredFat(reqNutrients[0]);
reqNutrients[3] = calcRequiredCarb(reqNutrients[0]);

console.log("Nutrients goal:");
console.log("Cal: " + reqNutrients[0]);
console.log("Protein: " + reqNutrients[1]);
console.log("Fat: " + reqNutrients[2]);
console.log("Carb: " + reqNutrients[3]);

AddDummyData(50);
//console.log(RandomPopulation(1, 50, 9, reqMealCat));
var best = Genetic(100, 100, 50, 9, reqMealCat, reqNutrients, 0.5, 0.1, 0.2);
var bestFitness = CalcFitness([best], reqNutrients, 9);

//var bestFitness = CalcFitness(RandomPopulation(1, 50, 9), reqNutrients, 9);

console.log(best);
console.log(bestFitness);

//var testPop = RandomPopulation(10, 50, 9);
//console.log(testPop);
//Crossover(testPop[5], testPop[6]);
//console.log(testPop);
//var fitness = CalcFitness(testPop);



