var dices = ["D4","D6","D8","D10","D12","D20","D10X"];

function getDiceManager(diceId, diceInstance)
{
	// get new die element or it's instance if it's already exists
	const diceHtmlEl = getDiceHtmlEl(diceId);

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

	diceTypeImg = document.createElement('img');
	diceTypeImg.id = `${diceId}-type-img`;
	diceTypeImg.setAttribute('src', 'images/'+diceType+'.webp');
	diceTypeImg.style.width = '40px';
	diceTypeImg.onclick = diceInstance.pulseLed.bind(diceInstance, 5, 30, 20, [0, 0, 255])
	diceHtmlEl.append(diceTypeImg);

	// add battery level indicator
	const batteryIndicator = document.createElement('div');
	batteryIndicator.id = `${diceId}-battery-indicator`;
	diceHtmlEl.append(batteryIndicator);

	return diceHtmlEl;
}

function addDiceResult(diceId, diceInstance, diceType)
{
		var diceResult = document.createElement('div');
		diceResult.id = `${diceType}-group`;

		var diceRollNumber = document.createElement('input');
		diceRollNumber.id = `${diceType}-qty`;
		diceRollNumber.setAttribute('type', 'number');
		diceRollNumber.setAttribute('min', 0);
		diceRollNumber.setAttribute('max', 10);
		diceRollNumber.value = 0;
		diceResult.append(diceRollNumber);

		var diceTypeIndicator = document.createElement('div');
		diceTypeIndicator.id = `${diceType}-label`;
		diceTypeIndicator.textContent = diceType.toLowerCase();
		diceResult.append(diceTypeIndicator);
	
		var diceTypeOperator = document.createElement('select');
		diceTypeOperator.id = `${diceType}-operator`;
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
		diceTypeBonus.setAttribute('min', 0);
		diceTypeBonus.setAttribute('max', 10);
		diceTypeBonus.value = 0;
		diceResult.append(diceTypeBonus);

		var diceStatus = document.createElement('div');
		diceStatus.id = `${diceId}-die-status`;
		diceResult.append(diceStatus);

		var diceRolls = document.createElement('div');
		diceRolls.id = `${diceId}-rolls`;
		diceResult.append(diceRolls);

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

	for (let j = 0; j < dices.length; j++)
	{
		let d = dices[j];
		let nrolls = parseInt(document.getElementById(d+"qty").value,10);
		let faces = parseInt(d.toLowerCase().replace("d",""),10);
		if(nrolls >0)
		{
			formula = formula + nrolls + d; 
			dice = {};
			dice ["number"] = nrolls;
			dice ["faces"] = faces;

			diceResults = new Array();
			diceTotal = 0

			for (let i = 1; i <= nrolls; i++) {
	  			let roll = parseInt(document.getElementById(d+"roll"+i).value,10);
	  			
	  			roll = roll==0?1:roll;

	  			diceResult = {"result": roll,"active": true};
	  			diceResults.push(diceResult);

	  			total = total + roll;
	  			diceTotal = diceTotal +roll;
			}

			dice ["results"] = diceResults;
			terms.push(dice);

			if(results.lenght >0)
			{
				results.push("+");
			}
			results.push(diceTotal);

			let bonus = parseInt(document.getElementById(d+"bonus").value, 10);
			let operator = document.getElementById(d+"operator").value;
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
		}
	}
	jsonObj ["formula"] = formula.slice(0,-1);
	jsonObj ["terms"] = terms;
	jsonObj ["results"] = results;
	jsonObj ["_total"] = total;


	return jsonObj;
}

