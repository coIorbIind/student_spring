document.addEventListener("DOMContentLoaded", () => {
	const host = '192.168.1.76';
	const main = document.getElementById("main");
	if (!localStorage.getItem('sofa_questions')) {
		localStorage.setItem('sofa_questions', 0);
	}
	v = 1;
	addDataForQuestions()

	async function addDataForQuestions(num = 1) {
		let questionNum = parseInt(localStorage.getItem('sofa_questions'))
		console.log(num, questionNum)
		if (num <= questionNum) {
			data = await getQuestion(num);
			answers = data.answers;
			const container = document.createElement("div");
			container.className = "container";
			container.innerHTML += `
			<p class="container__quistion-title">${data.text}</p>
			<div style="width: 50%; margin: 0 auto; display: block;">
				<div id="divCheckbox${data.id}" style="margin-bottom: 70px;">
				</div>
			</div>`
			main.append(container);
			const divCheckbox = document.getElementById(`divCheckbox${data.id}`);
			for (var key in answers) {
				const divInput = document.createElement("div");
				divInput.style = "margin-bottom: 40px";
				divInput.innerHTML += `<label class="checkbox-label" for="check${data.id + v}">${key}\t${answers[key]}</label>`;
				divCheckbox.append(divInput);
				v += 1;
			}
			if (num !== 3) {
				addDataForQuestions(num + 1);
			}
		} else {
			data = await getQuestion(num);
			answers = data.answers
			const container = document.createElement("div");
			container.className = "container";
			container.innerHTML += `
			<p class="container__quistion-title">${data.text}</p>
			<div style="width: 50%; margin: 0 auto; display: block;">
				<div id="divCheckbox${data.id}" style="margin-bottom: 70px;">
				</div>
			</div>
			<button id="quesionBtn${data.id}" class="container__vote-btn btn">Проголосовать</button>
			`;
			main.append(container);

			const divCheckbox = document.getElementById(`divCheckbox${data.id}`);
			
			for (var key in answers) {
				const divInput = document.createElement("div");
				divInput.style = "margin-bottom: 40px";
				divInput.innerHTML += `<input type="radio" id="check${data.id + v}" class="checkbox custom-checkbox" name="scales${data.id}" value="${key}">
				<label class="checkbox-label" for="check${data.id + v}">${key}\t${answers[key]}</label>`;
				divCheckbox.append(divInput);
				v += 1;
			}
			await setAnswer(data.id, 0);
		}
	}

	async function setAnswer(id, count) {
		const divCheckbox = document.getElementById(`divCheckbox${id}`);
		const btnQuesion = document.querySelector(`#quesionBtn${id}`); //проголосовать
		btnQuesion.addEventListener("click", async () => {
			const item = document.querySelector(`input[name="scales${id}"]:checked`)
			const warningBlock = document.createElement("div");
			if (!item && count === 0) {
				warningBlock.innerHTML = `Выберите один из вариантов`;
				warningBlock.className = "warningBlock";
				divCheckbox.append(warningBlock);
				divCheckbox.style = 'margin-bottom: 20px;';
				count = 1;
			}
			else if (item) {
				if (id !== 3) {
					addDataForQuestions(id + 1);
				}
				btnQuesion.style = "display: none;";
				warningBlock.style = "display: none;";
				let data = {
					"answer": item.value,
					"votes": 1
				}
				await addVotes(id, data)
				
			}
		})
		
	}


	async function getQuestion(num) {
		let response = await fetch(`http://${host}:8000/get_question/${num}`, {
			method: "GET",
		});
	
		return await response.json();
	}

	async function addVotes(num, data) {
		let response = await fetch(`http://${host}:8000/get_votes/${num}`, {
			method: "PUT",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify(data)
		});

		sendMessage()
		localStorage.setItem('sofa_questions', num);
		// await rerender();

		console.log(await response.json());
	}

	async function getVotes(num) {
		let response = await fetch(`http://${host}:8000/get_votes/${num}`, {
			method: "GET"
		});
	
	}

	async function rerender(){
		let mainContainer = document.getElementById('main');
		let containers = mainContainer.children;

		for (let i = 0, len = containers.length; i < len; i++) {
			containers[0].remove();
		}
		await addDataForQuestions(1);
	}

	var ws = new WebSocket(`ws://${host}:8000/update_votes`);
	ws.addEventListener('message', (event) => {
		console.log('soket info: ', event.data)
		rerender()
	})
	// ws.onmessage = async function() {
	// 	console.log('it alive')
	// 	await rerender()
	// };
	function sendMessage() {
		ws.send('hi')
	}	
});

