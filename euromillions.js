"use strict";


// Helpers

function factorial(x) {
	return x == 0 ? 1 : x * factorial(x - 1);
}

function numberOfCombinations(n, r) {
	return factorial(n) / (factorial(n - r) * factorial(r));
}

function arrayContains(array, obj) {
	return array.indexOf(obj) > -1;
}	

function generateRandomNumberInRange(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

function generateUniqueRandomNumberInRange(previous, min, max) {
	var number = generateRandomNumberInRange(min, max);
	return arrayContains(previous, number) ? generateUniqueRandomNumberInRange(previous, min, max) : number;
}

function pickSetOfNumbersFromRange(result, count, min, max) {
	result.push(generateUniqueRandomNumberInRange(result, min, max));
	var set = result.length == count ? result : pickSetOfNumbersFromRange(result, count, min, max);
	return set.sort(function(a,b) { return a-b });
}

function checkMatching(correct, counter, drawn, picked) {
	if (counter > picked.length) return correct;
	if (arrayContains(drawn, picked[counter])) {
		correct.push(picked[counter]);
	}
	return checkMatching(correct, counter+1, drawn, picked);
}

function checkWinningNumbers(draw, pick) {
	return { 
		numbers: checkMatching([], 0, draw.numbers, pick.numbers), 
		stars: checkMatching([], 0, draw.stars, pick.stars)
	};
}

function calculateProfit(result) {
	var winnings = {
		'5,2': 50000000,
		'5,1': 300000,
		'5,0': 50000,
		'4,2': 4000,
		'4,1': 200,
		'4,0': 100,
		'3,2': 60,
		'2,2': 20,
		'3,1': 15,
		'3,0': 12,
		'2,1': 8,
		'2,0': 4
	};
	return winnings[result.numbers.length + "," + result.stars.length] || 0;
}

function calculateCost(pick) {
	return numberOfCombinations(pick.numbers.length, 5) * numberOfCombinations(pick.stars.length, 2) * 2;
}

function pickNumbers(count) {
	return pickSetOfNumbersFromRange([], count || 5, 1, 50);
}

function pickStars(count) {
	return pickSetOfNumbersFromRange([], count || 2, 1, 11);
}


// Statistics

function StatisticsCollector() {
	this.numberFrequency = Array.apply(null, Array(50)).map(Number.prototype.valueOf,0);
	this.starFrequency = Array.apply(null, Array(11)).map(Number.prototype.valueOf,0);

	this.to_sorted_array = function(values, sort) {
		return Array.from(values, (x,y) => y+x*100 ).sort(sort);
	}

	this.pick_from_array = function(values, count) {
		return Array.from(values, x => x%100+1).slice(0, count || 5)
	}

	this.collect = function(draw) {
		for (var i=0, len = draw.numbers.length; i < len; i++) {
			this.numberFrequency[draw.numbers[i]-1]++;
		}
		for (var i=0, len = draw.stars.length; i < len; i++) {
			this.starFrequency[draw.stars[i]-1]++;
		}
	}
}

var statistics = new StatisticsCollector();


// Pick strategies

var pick_strategies = {
	'random': RandomPickStrategy,
	'fixed': FixedPickStrategy,
	'successive': SuccessiveNumbersPickStrategy,
	'trailing': TrailingPickStrategy,
	'highroller': HighRollerPickStrategy,
	'highfrequency': HighFrequencyPickStrategy,
	'lowfrequency': LowFrequencyPickStrategy,
	'oddeven': OddEvenPickStrategy
}


function RandomPickStrategy() {
	this.pick = function() {
		return { numbers: pickNumbers(), stars: pickStars() };	
	};
}

function FixedPickStrategy() {
	this._pick = { numbers: pickNumbers(), stars: pickStars() };
	this.pick = function() {
		return this._pick;
	};
}

function SuccessiveNumbersPickStrategy() {
	this.pick = function() {
		return { numbers: [5,6,7,8,9], stars: [10, 11]}
	}
}

function TrailingPickStrategy() {
	this.memoized = { numbers: pickNumbers(), stars: pickStars() };
	this.pick = function() {
		var result = { numbers: this.memoized.numbers, stars: this.memoized.stars }
		this.memoized = { numbers: pickNumbers(), stars: pickStars() };
		return result;
	};
}

function HighRollerPickStrategy() {
	this.pick = function() {
		return { numbers: pickNumbers(15), stars: pickStars(2) };	
	};
}


function HighFrequencyPickStrategy() {
	this.sort = function(a, b) {
		// descending
		return b-a;
	}

	this.pick = function() {
		return { 
			numbers: statistics.pick_from_array(statistics.to_sorted_array(statistics.numberFrequency, this.sort), 5),
			stars: statistics.pick_from_array(statistics.to_sorted_array(statistics.starFrequency, this.sort), 2)
		}
	}
}


function LowFrequencyPickStrategy() {
	this.sort = function(a, b) {
		// ascending
		return a-b;
	}

	this.pick = function() {
		return { 
			numbers: statistics.pick_from_array(statistics.to_sorted_array(statistics.numberFrequency, this.sort), 5),
			stars: statistics.pick_from_array(statistics.to_sorted_array(statistics.starFrequency, this.sort), 2)
		}
	}
}

function OddEvenPickStrategy() {
	this.shuffle = function(values) {
		return values.sort(function() { return .5-Math.random(); });
	}

	this.pick = function() {
		var numbers = pickNumbers(50);
		var even_numbers = this.shuffle(numbers.filter(x => x % 2 === 0)).slice(0,3);
		var odd_numbers = this.shuffle(numbers.filter(x => x % 2 !== 0)).slice(0,2);
		return {
			numbers: even_numbers.concat(odd_numbers).sort((a,b) => a-b),
			stars: pickStars()
		}
	}
}

// Draw strategies

function RandomDrawStrategy() {
	this.draw = function() {
		return { numbers: pickNumbers(), stars: pickStars() };	
	};	
}

function HistoricDrawStrategy() {
	// TODO: implement getting real historic draw data
	this.draw = function() {
		return { numbers: pickNumbers(), stars: pickStars() };	
	}
}


// Game

function Game() {
	this.play = function(pick, draw) {
		var result = checkWinningNumbers(draw, pick);
		return {
			profit: calculateProfit(result),
			pick: {
				numbers: pick.numbers,
				stars: pick.stars,
			},
			draw: {
				numbers: draw.numbers,
			 	stars: draw.stars
			},
			result: {
				numbers: result.numbers,
				stars: result.stars
			}
		};
	}
}


function GameSimulator(strategy = 'fixed') {
	// this.statistics = new StatisticsCollector();

	this.pick_strategy = new pick_strategies[strategy]();
	this.draw_strategy = new RandomDrawStrategy();

	this.game = new Game();
	this.cost_per_game = calculateCost(this.pick_strategy.pick());

	this.playGame = function() {
		var result = this.game.play(this.pick_strategy.pick(), this.draw_strategy.draw());
		statistics.collect(result.draw);

		result.cost = this.cost_per_game;
		result.statistics = {
			numbers: statistics.numberFrequency,
			stars: statistics.starFrequency
		};

		return result;
	}	
}

