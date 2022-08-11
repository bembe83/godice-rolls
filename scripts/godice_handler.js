const connectedDice = {};

// Open the Bluetooth connection dialog for choosing a GoDice to connect
function openConnectionDialog() {
	const newDice = new GoDice();
	newDice.requestDevice();
}

/**
 * Get a new dice element or it's instance if it already exists
 * @param {string} diceID - the die unique identifier	 
 */
function getDiceHtmlEl(diceID) {
	if (!document.getElementById(diceID)) {
		const newDiceEl = document.createElement("div");
		newDiceEl.id = diceID;
		newDiceEl.className = "dice-wrapper";
		return newDiceEl;
	}
	return document.getElementById(diceID);
}

function setDiceType(diceInstance)
{
	//Show popup to select the dice Type
	diceType = prompt("Select the dice Type","D6");
	diceInstance.setDieType(GoDice.diceTypes[diceType]);
	return diceType;
}

GoDice.prototype.onDiceConnected = (diceId, diceInstance) => {
	console.log("Dice connected: ", diceId);

	diceType = setDiceType(diceInstance);

	// Called when a new die is connected - create a dedicate panel for this die
	var diceInfos = {};
	diceInfos["instance"] = diceInstance;
	diceInfos["type"] = diceType;
	diceInfos["color"] = "";
	diceInfos["battery"] = 0;

	connectedDice[diceId] = diceInfos;

	placeholder = document.getElementById("placeholder");
	if (placeholder != null) {
       placeholder.remove();
	}

	// get die host from html, where we will put our connected dices
	diceManager = document.getElementById("diceManager");
	diceHtmlEl = getDiceManager(diceId, diceInstance);
	diceManager.appendChild(diceHtmlEl);
	diceInstance.getDiceColor();
	diceInstance.getBatteryLevel();

	diceResults = document.getElementById("diceResults");
	diceResult = document.getElementById(diceType+"-group");
	if(diceResult == null)
	{
		diceResult = addDiceResult(diceId, diceInstance, diceType);
		diceResults.append(diceResult);
	}

};

function addRoll(diceId, value)
{
	var maxDiceRolls = 10;
	var diceType = connectedDice[diceId]["type"];
	var diceRolls = document.getElementById(`${diceId}-rolls`);
	if(diceRolls != null && diceRolls.children.length > maxDiceRolls)
	{
		// clear existing die element content if it exists
		while (diceRolls.firstChild) {
        	diceRolls.removeChild(diceHtmlEl.lastChild);
		}
	}
	var diceRoll = document.createElement('div')
	diceRoll.id = diceType+"roll"+diceRolls.children.length;
	diceRoll.textContent = value;
	diceRolls.appendChild(diceRoll);
}

GoDice.prototype.onRollStart = (diceId) => {
	console.log("Roll Start: ", diceId);

	// get rolling indicator
	const diceIndicatorEl = document.getElementById(diceId + "-die-status");

	// show rolling 
	diceIndicatorEl.textContent = "Rolling....";
};

GoDice.prototype.onStable = (diceId, value, xyzArray) => {
	console.log("Stable event: ", diceId, value);

	// Get roll value indicator and show stable value
	const diceIndicatorEl = document.getElementById(diceId + "-die-status");
	diceIndicatorEl.textContent = "Stable";

	addRoll(diceId, value);
};

GoDice.prototype.onTiltStable = (diceId, xyzArray, value) => {
	console.log("TiltStable: ", diceId, xyzArray);

	// Get tile indicator and show raw data
	const diceIndicatorEl = document.getElementById(diceId + "-die-status");
	diceIndicatorEl.textContent = "Tilt Stable";

	addRoll(diceId, value);
};

GoDice.prototype.onFakeStable = (diceId, value, xyzArray) => {
	console.log("FakeStable: ", diceId, value);

	// Get tile indicator and show fake value
	const diceIndicatorEl = document.getElementById(diceId + "-die-status");
	diceIndicatorEl.textContent = "Fake Stable";

	addRoll(diceId, value);
};

GoDice.prototype.onMoveStable = (diceId, value, xyzArray) => {
	console.log("MoveStable: ", diceId, value);

	// Get tile indicator and show fake value
	const diceIndicatorEl = document.getElementById(diceId + "-die-status");
	diceIndicatorEl.textContent = "Move Stable";

	addRoll(diceId, value);
};

GoDice.prototype.onBatteryLevel = (diceId, batteryLevel) => {
	console.log("BetteryLevel: ", diceId, batteryLevel);
	
	// get dice battery indicator element
	const batteryLevelEl = document.getElementById(diceId + "-battery-indicator");

	// put battery level value into battery indicator html element
	batteryLevelEl.textContent = batteryLevel;
	batteryLevelInt = parseInt(batteryLevel);
	if(batteryLevelInt > 80)
		batteryLevelEl.setAttribute('class', 'battery_high');
	else if(batteryLevelInt > 30)
		batteryLevelEl.setAttribute('class', 'battery_medium');
	else
		batteryIndicator.setAttribute('class', 'battery_low');
};

GoDice.prototype.onDiceColor = (diceId, color) => {
	
	diceInstance = connectedDice[diceId]["instance"];
	colorString =  Object.keys(diceInstance.diceColour)[color].toLowerCase();
	connectedDice[diceId]["color"]= colorString;

	console.log("DiceColor: ", diceId, color, colorString);
	
	// get dice color indicator element
	const diceColorEl = document.getElementById(diceId + "-type-img");
	// put dice color value into battery indicator html element
	diceColorEl.style.backgroundColor = colorString;
};


