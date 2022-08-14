const connectedDice = {};

function LoadStoredInfos(event)
{
	let storedConnectedDice = sessionStorage.getItem('connectedDice');
	if(storedConnectedDice != null)
	{
		document.getElementById("placeholder").textContent= 'Wait... Reloading Stored dices...'
		storedConnectedDice = JSON.parse(storedConnectedDice);	
		Object.values(storedConnectedDice).forEach( function(diceInstance, diceId) {
			newDiceInstance = new GoDice(diceInstance);
			newDiceInstance.reconnectDevice();
		});
	}
	let storedPlayerName = sessionStorage.getItem('playerName');
	document.getElementById('player_name').value = storedPlayerName;
}

if (window.addEventListener) { // Mozilla, Netscape, Firefox
    window.addEventListener('load', LoadStoredInfos, false);
} else if (window.attachEvent) { // IE
    window.attachEvent('onload', LoadStoredInfos);
}

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

function selectDiceType(diceInstance)
{
	let diceType = "";
	if(diceInstance.newConnection)
	{	
		//Show popup to select the dice Type
		diceType = prompt("Select the dice Type","D6");
		diceInstance.setDieType(GoDice.diceTypes[diceType]);
	}

	return;
}

function getDiceTypeString(diceInstance)
{
	return Object.keys(GoDice.diceTypes)[diceInstance.getDieType()];
}

function addConnectedDice(diceId, diceInstance)
{
	let diceType = getDiceTypeString(diceInstance);
	diceInstance.setDiceColor();

	placeholder = document.getElementById("placeholder");
	if (placeholder != null) {
       placeholder.remove();
	}

	// get die host from html, where we will put our connected dices
	diceManager = document.getElementById("diceManager");
	diceHtmlEl = getDiceManager(diceId, diceInstance);
	diceManager.appendChild(diceHtmlEl);
	
	diceInstance.getBatteryLevel();

	diceResults = document.getElementById("diceResults");
	diceResult = document.getElementById(diceType+"-group");
	if(diceResult == null)
	{
		diceResult = addDiceResult(diceId, diceInstance);
		diceResults.append(diceResult);
	}

}

GoDice.prototype.onDiceConnected = (diceId, diceInstance) => {

	if(connectedDice[diceId] != null)
	{
		console.log('Dice already connected');
	}
	else
	{
		console.log("Dice connected: ", diceId);
		selectDiceType(diceInstance);
		// Called when a new die is connected - create a dedicate panel for this die
		addConnectedDice(diceId, diceInstance);
		connectedDice[diceId] = diceInstance;
		sessionStorage.setItem('connectedDice', JSON.stringify(connectedDice));
	}
};

GoDice.prototype.onRollStart = (diceId) => {
	console.log("Roll Start: ", diceId);
	let diceType =  getDiceTypeString(connectedDice[diceId]);
	// get rolling indicator
	const diceIndicatorEl = document.getElementById(diceType + "-die-status");
	// show rolling 
	diceIndicatorEl.textContent = "Rolling....";
};

GoDice.prototype.onStable = (diceId, value, xyzArray) => {
	console.log("Stable event: ", diceId, value);
	let diceType =  getDiceTypeString(connectedDice[diceId]);
	// Get roll value indicator and show stable value
	const diceIndicatorEl = document.getElementById(diceType + "-die-status");
	diceIndicatorEl.textContent = "Stable";

	addRoll(diceId, value);
};

GoDice.prototype.onTiltStable = (diceId, xyzArray, value) => {
	console.log("TiltStable: ", diceId, xyzArray);
	let diceType =  getDiceTypeString(connectedDice[diceId]);
	// Get tile indicator and show raw data
	const diceIndicatorEl = document.getElementById(diceType + "-die-status");
	diceIndicatorEl.textContent = "Tilt Stable";

	addRoll(diceId, value);
};

GoDice.prototype.onFakeStable = (diceId, value, xyzArray) => {
	console.log("FakeStable: ", diceId, value);
	let diceType =  getDiceTypeString(connectedDice[diceId]);
	// Get tile indicator and show fake value
	const diceIndicatorEl = document.getElementById(diceType + "-die-status");
	diceIndicatorEl.textContent = "Fake Stable";

	addRoll(diceId, value);
};

GoDice.prototype.onMoveStable = (diceId, value, xyzArray) => {
	console.log("MoveStable: ", diceId, value);
	let diceType =  getDiceTypeString(connectedDice[diceId]);
	// Get tile indicator and show fake value
	const diceIndicatorEl = document.getElementById(diceType + "-die-status");
	diceIndicatorEl.textContent = "Move Stable";

	addRoll(diceId, value);
};

GoDice.prototype.onBatteryLevel = (diceId, batteryLevel) => {
	console.log("BetteryLevel: ", diceId, batteryLevel);
	
	// get dice battery indicator element
	const batteryLevelEl = document.getElementById(diceId + "-battery-indicator");
	connectedDice[diceId].batteryLevel = batteryLevel;
	sessionStorage.setItem('connectedDice', JSON.stringify(connectedDice));

	// put battery level value into battery indicator html element
	batteryLevelEl.textContent = batteryLevel;
	batteryLevelInt = parseInt(batteryLevel);
	if(batteryLevelInt > 80)
		batteryLevelEl.setAttribute('class', 'battery-indicator battery_high');
	else if(batteryLevelInt > 30)
		batteryLevelEl.setAttribute('class', 'battery-indicator battery_medium');
	else
		batteryLevelEl.setAttribute('class', 'battery-indicator battery_low');
};

GoDice.prototype.onDiceColor = (diceId, color) => {
	let colorString =  Object.keys(this.diceColour)[color].toLowerCase();
	console.debug('DiceColor: ', diceId, color, colorString);
	//Set dice Color to class attribute as String
	connectedDice[diceId].dieColor = color;
	sessionStorage.setItem('connectedDice', JSON.stringify(connectedDice));

	const diceColorEl = document.getElementById(diceId+'-type-img');
	if(diceColorEl!= null)
		diceColorEl.style.backgroundColor = colorString;
};

function addRoll(diceId, value)
{
	let diceType =  getDiceTypeString(connectedDice[diceId]);
	let colorString =  Object.keys(connectedDice[diceId].diceColour)[connectedDice[diceId].dieColor].toLowerCase();
	
	removeRolls(diceType, true);

	let diceRolls = document.getElementById(`${diceType}-rolls`);
	let diceRoll = document.createElement('div')
	diceRoll.id = diceType+"roll";
	diceRoll.setAttribute('class','roll');
	diceRoll.textContent = value;
	diceRoll.style.borderColor = colorString;
	diceRolls.appendChild(diceRoll);
}

function removeRolls(diceType, check)
{
	let maxDiceRolls = parseInt(document.getElementById(diceType+'-qty').value,10);
	if(maxDiceRolls == 0)
		maxDiceRolls = 1;

	let diceRolls = document.getElementById(`${diceType}-rolls`);
	if(diceRolls != null && ((check && diceRolls.children.length >= maxDiceRolls) || !check))
	{
		// clear existing die element content if it exists
		while (diceRolls.firstChild) {
	    	diceRolls.removeChild(diceRolls.lastChild);
		}
	}
}


function getDiceManager(diceId, diceInstance)
{
	// get new die element or it's instance if it's already exists
	const diceHtmlEl = getDiceHtmlEl(diceId);
	let diceType =  getDiceTypeString(diceInstance);

	// clear existing die element content if it exists
	while (diceHtmlEl.firstChild) {
        	diceHtmlEl.removeChild(diceHtmlEl.lastChild);
	}

	// add name to die element
	const diceName = document.createElement('div');
	diceName.id = diceId;
	diceName.className = 'dice-name';
	diceName.textContent = `Dice ID: ${diceId}`;
	diceName.setAttribute('hidden', true);
	diceHtmlEl.append(diceName);


	var colorString =  Object.keys(diceInstance.diceColour)[diceInstance.dieColor].toLowerCase();
	diceTypeImg = document.createElement('img');
	diceTypeImg.id = `${diceId}-type-img`;
	diceTypeImg.setAttribute('src', 'images/'+diceType+'.webp');
	diceTypeImg.style.width = '40px';
	diceTypeImg.style.backgroundColor = colorString;
	diceTypeImg.onclick = diceInstance.pulseLed.bind(diceInstance, 5, 30, 20, [0, 0, 255])
	diceHtmlEl.append(diceTypeImg);

	// add battery level indicator
	const batteryIndicator = document.createElement('div');
	batteryIndicator.id = `${diceId}-battery-indicator`;
	batteryIndicator.setAttribute('class','battery-operator');
	batteryIndicator.onclick = diceInstance.getBatteryLevel.bind(diceInstance);
	diceHtmlEl.append(batteryIndicator);

	return diceHtmlEl;
}

function addDiceResult(diceId, diceInstance)
{
		let diceType =  getDiceTypeString(diceInstance);
		var diceResult = document.createElement('div');
		diceResult.id = `${diceType}-group`;
		diceResult.setAttribute('class','diceGroup');

		var diceRollNumber = document.createElement('input');
		diceRollNumber.id = `${diceType}-qty`;
		diceRollNumber.setAttribute('type', 'number');
		diceRollNumber.setAttribute('min', 0);
		diceRollNumber.setAttribute('max', 10);
		diceRollNumber.value = 0;
		diceResult.append(diceRollNumber);

		var diceTypeIndicator = document.createElement('div');
		diceTypeIndicator.id = `${diceType}-label`;
		diceTypeIndicator.setAttribute('class','diceLabel');
		diceTypeIndicator.textContent = diceType.toLowerCase();
		diceResult.append(diceTypeIndicator);
	
		var diceTypeOperator = document.createElement('select');
		diceTypeOperator.id = `${diceType}-operator`;
		diceTypeOperator.setAttribute('class','operator');
		var diceTypeOperOpt = document.createElement('option');
		diceTypeOperOpt.textContent = '+';
		diceTypeOperOpt.value = '+';
		diceTypeOperator.append(diceTypeOperOpt);
		diceTypeOperOpt = document.createElement('option');
		diceTypeOperOpt.textContent = '-';
		diceTypeOperOpt.value = '-';
		diceTypeOperator.append(diceTypeOperOpt);
		diceResult.append(diceTypeOperator);

		var diceTypeBonus = document.createElement('input');
		diceTypeBonus.id = `${diceType}-bonus`;
		diceTypeBonus.setAttribute('type', 'number');
		diceTypeBonus.setAttribute('class', 'bonus');
		diceTypeBonus.setAttribute('min', 0);
		diceTypeBonus.setAttribute('max', 10);
		diceTypeBonus.value = 0;
		diceResult.append(diceTypeBonus);

		var diceStatus = document.createElement('div');
		diceStatus.id = `${diceType}-die-status`;
		diceStatus.setAttribute('class','die-status');
		diceStatus.setAttribute('hidden', true);
		diceResult.append(diceStatus);

		var diceRolls = document.createElement('div');
		diceRolls.id = `${diceType}-rolls`;
		diceRolls.setAttribute('class','rolls');
		diceResult.append(diceRolls);

		var diceCleanRollsEl = document.createElement('button');
		diceCleanRollsEl.id = `${diceType}-clean`;
		diceCleanRollsEl.textContent = "Clean Roll";
		diceCleanRollsEl.setAttribute('class', 'btn btn-outline-primary btn-sm');
		diceCleanRollsEl.onclick = function(){removeRolls(diceType, false)};
		diceResult.append(diceCleanRollsEl);

		return diceResult;
}

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

function SendRoll()
{
	url = "https://bembe83.moltenhosting.com/modules/external-dice-roll-connector/roll.html";

	jsonRoll = calculateTotal();
	player = document.getElementById("player").value;

	tab = window.open('about:blank',"_blank");
	tab.document.write(JSON.stringify(jsonRoll));
	tab.document.close();

	$.ajax({
		url: url,
		headers: {
        	'Content-Type': 'application/x-www-form-urlencoded'
    	},
		type: "GET",
		data: { 
		    name: player, 
		    roll: JSON.stringify(jsonRoll)
		  },
		success: function(result){
			tab = window.open('about:blank',"_blank");
			tab.document.write(JSON.stringify(result));
			tab.document.close();	
		},
		error: function(error){
			console.log(error);
		}
	});

}

function calculateTotal()
{
	jsonObj = {};

	total = 0;
	formula = "";
	terms = new Array();
	results = new Array();

	let diceResults = document.getElementById('diceResults');
	let diceGroup = diceResults.querySelectorAll('.diceGroup');

	for (let j = 0; j < diceGroup.length; j++)
	{
		let d = diceGroup[j].id.replace('-group', '').toLowerCase();
		let nrolls = parseInt(document.getElementById(d.toUpperCase()+"-qty").value,10);
		let faces = parseInt(d.replace("d",""),10);
		if(nrolls >0)
		{
			formula = formula + nrolls + d; 
			dice = {};
			dice ["number"] = nrolls;
			dice ["faces"] = faces;

			diceResults = new Array();
			diceTotal = 0
			let diceRolls = diceGroup[j].querySelectorAll('.rolls')[0].querySelectorAll('.roll');

			for (let i = 0; i < nrolls; i++) {
				let roll = 0;
				if(i< diceRolls.length)
	  				roll = parseInt(diceRolls[i].textContent,10);
	  			roll = roll==0?1:roll;

	  			diceResult = {"result": roll,"active": true};
	  			diceResults.push(diceResult);

	  			total = total + roll;
	  			diceTotal = diceTotal +roll;
			}

			dice ["results"] = diceResults;
			terms.push(dice);

			results.push(diceTotal);

			let bonus = parseInt(diceGroup[j].querySelectorAll('.bonus')[0].value, 10);
			let operator = diceGroup[j].querySelectorAll('.operator')[0].selectedOptions[0].value;
			if(operator == "-")
			{
				total = total - bonus;
			}
			else
			{
				operator = "+";
				total = total + bonus;
			}
			if(bonus > 0){
				results.push(operator);
				results.push(bonus);
				formula = formula+operator+bonus+"+";

				jsonOperator = {};
				jsonOperator ["operator"] = operator;
				jsonNumber = {};
				jsonNumber ["number"] = bonus
				terms.push(jsonOperator);
				terms.push(jsonNumber);
			}
			results.push("+");
		}
	}
	results.pop();
	jsonObj ["formula"] = formula.slice(0,-1);
	jsonObj ["terms"] = terms;
	jsonObj ["results"] = results;
	jsonObj ["_total"] = total;


	return jsonObj;
}

function storePlayerName()
{
	let storedPlayerName = document.getElementById('player_name').value;
	 sessionStorage.setItem('playerName',storedPlayerName);
}

