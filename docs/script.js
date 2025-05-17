const highlightStart = RegExp("\\{", "g");
const highlightEnd = RegExp("\\}", "g");
var doneSpeaking = false;
var questionPool = [];
var questionNumber = -1;

async function fetchQuestions() {
    let baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
    let fileName = window.location.search.slice(1);
    if (!fileName) {
        fileName = "technician-pool.txt";  // reasonable default
    }
    let fileUrl = baseUrl + "/" + fileName;            
    console.debug("Retrieving questions from:", fileUrl);
    let filePromise = await fetch(fileUrl);
    if (!filePromise.ok) {
        alert(`Failed to load question pool from ${fileUrl}. Check the URL and try again.`);
        throw new Error(`Response status: ${filePromise.status}`);
    }
    let fileContents = await filePromise.text();
    let fileLines = fileContents.split(/\r?\n/);

    // Clean up extra whitespace, blank lines, and heading lines.
    fileLines = fileLines.map(line => line.trim());
    fileLines = fileLines.filter(line => {
        return line.length > 0;
    });
    fileLines = fileLines.filter(line => {
        return !line.match(/^SUBELEMENT [TGE][0-9] /);
    });
    fileLines = fileLines.filter(line => {
        return !line.match(/^[TGE][0-9][A-Z] /);
    });
    console.debug("File lines:", fileLines);

    // Each question and answer block is ended by a line with two tildes (~~).
    let index = 0;
    fileLines.forEach(line => {
        if (line == "~~") {
            console.debug("End of question and answer block reached.");
            index++;
            console.debug("Next question index will be:", index);
        }
        else {
            if (questionPool[index] === undefined) {
                console.debug("Adding new question:", line);
                questionPool[index] = line + "\n";
            }
            else {
                console.debug("Appending to question:", line);
                questionPool[index] += line + "\n";
            }
        }
    });
    console.debug("Question pool:", questionPool);
}

function nextQuestion() {
    console.debug("Current question index:", questionNumber);
    questionNumber++;
    console.debug("Next question index:", questionNumber)
    if (questionNumber >= questionPool.length) {
        console.debug("Out of range!");
        questionNumber = 0;
        console.debug("Resetting to:", questionNumber);
    }
    return questionPool[questionNumber];
}

function randomQuestion() {
    console.debug(`Reaching into enchanted bag of holding to pull forth a D${questionPool.length}`);
    do {
        randomRoll = Math.floor(Math.random() * questionPool.length);
    }
    while (randomRoll == questionNumber);  // prevent repeats
    questionNumber = randomRoll;
    console.debug(`The D${questionPool.length} rolled a ${questionNumber}`);
    return questionPool[questionNumber];
}

async function saySomething(textString) {
    return new Promise((resolve, reject) => {
        let utterance = new SpeechSynthesisUtterance();
        utterance.text = textString.replace(/<\/?[^>]+(>|$)/g, '');  // strip HTML tags
        // https://stackoverflow.com/questions/5002111/how-to-strip-html-tags-from-string-in-javascript#5002161
        utterance.onend = () => {
            resolve('Speech finished.');
        };
        utterance.onerror = (event) => {
            reject(new Error('Speech error: ' + event.error));
        };
        console.debug("Saying:", utterance.text);
        window.speechSynthesis.speak(utterance);
    });
}

function renderHighlights(textString, className = "highlight") {
    textString = textString.replace(highlightStart, `<span class="${className}">`);
    textString = textString.replace(highlightEnd, '</span>');
    return textString;
}

function parseMetaInfo(metaInfoString) {
    let [questionNumber, answerLetter, reference] = metaInfoString.split(" ");
    answerLetter = answerLetter.replace(/[()]/g, '');
    if (reference) {
        reference = reference.replace(/[\[\]]/g, '');
    }
    console.debug("Question #", questionNumber);
    console.debug("Correct answer:", answerLetter);
    console.debug("Reference note:", reference);
    return { questionNumber: questionNumber, answerLetter: answerLetter, reference: reference };
}

function identifyPart97(reference) {
    let part97Sections = undefined;
    if (reference) {
        const regex = /97\.[0-9]+/;
        if (reference.match(regex)) {
            part97Sections = reference.match(regex);
            console.debug("References:", part97Sections);
        }
    }
    return part97Sections;
}

function identifyFigure(questionText) {
    const regex = /[Ff]igure [TGE][0-9]?-[0-9]/;
    let figure = undefined;
    if (questionText.match(regex)) {
        figure = questionText.match(regex)[0];
    }
    return figure;
}

async function showQuestion(questionText, figure) {
    console.debug("Question text:", questionText);
    questionText = renderHighlights(questionText);
    console.debug("Question marked up as:", questionText);
    document.getElementById("question-text").innerHTML = questionText;
    if (figure) {
        let figureURI = encodeURI(figure) + ".png";
        console.debug("Figure:", figure);
        console.debug("Figure URI:", figureURI);
        document.getElementById("illustration").alt = figure;
        document.getElementById("illustration").src = figureURI;
        document.getElementById("illustration").style.display = "block";
    }
    else {
        document.getElementById("illustration").style.display = "none";
    }
    window.speechSynthesis.cancel();  // Helps when rapidly pressing Next or Random
    await saySomething(questionText);
}

function showAnswerChoices(answerChoices, correctAnswer) {
    const parentElement = document.getElementById("answer-choices");
    parentElement.innerHTML = "";
    answerChoices.forEach(possibility => {
        let choiceLetter = possibility.charAt(0);
        choiceText = possibility.slice(3);
        console.debug(`Choice ${choiceLetter}: ${choiceText}`);
        choiceText = renderHighlights(choiceText);
        console.debug(`Choice ${choiceLetter} marked up as: ${choiceText}`);
        if (choiceLetter == correctAnswer) {
            parentElement.innerHTML += `<li class="correct-answer">${choiceText}</li>`;
        }
        else {
            parentElement.innerHTML += `<li class="wrong-answer">${choiceText}</li>`;
        }
    });
}

function showReferences(references) {
    const referencesElement = document.getElementById("references");
    referencesElement.innerHTML = "&nbsp;";
    if (references) {
        referencesElement.style.visibility = "hidden";
        references.forEach(ref => {
            let url = "https://www.ecfr.gov/current/title-47/chapter-I/subchapter-D/part-97/subpart-A/section-" + ref;
            console.debug("Answer reference:", URL);
            referencesElement.innerHTML += `<a href="${url}" target="_blank">${ref}</a> `;
        });
    }
}

function revealHighlights(...parentIds) {
    for (id of parentIds) {
        let parentElement = document.getElementById(id);
        let highlight = parentElement.getElementsByClassName("highlight");
        for (let i = 0; i < highlight.length; i++) {
            highlight.item(i).classList.add('highlight-on');
        }
    }
}

async function revealAnswer(parentId) {
    const parentElement = document.getElementById(parentId);

    // There can be only one correct answer, so no need to iterate.
    const correctAnswer = parentElement.getElementsByClassName("correct-answer");
    correctAnswer.item(0).classList.add('correct-answer-revealed');
    let correctAnswerText = correctAnswer.item(0).innerHTML;

    // Only strike through when it's not "All these answer are correct"
    if (!correctAnswerText.includes("All these")) {
        const wrongAnswers = parentElement.getElementsByClassName("wrong-answer");
        for (let i = 0; i < wrongAnswers.length; i++) {
            wrongAnswers.item(i).classList.add('wrong-answer-revealed');
        }
    }
    
    // Reveal reference links only when answer is shown.
    document.getElementById("references").style.visibility = "visible";
    await saySomething(correctAnswerText);
}

function parseQuestionBlock(textBlock) {
    // A multiple choice question is a newline separated block of text with:
    // 1. Meta information with question number, correct answer, and reference.
    // 2. A question.
    // 3. Four multiple choice answers labeled A. through D.
    let blockLines = textBlock.split("\n");
    blockLines = blockLines.map(line => line.trim());
    blockLines = blockLines.filter(line => {
        return line.length > 0;
    });
    console.debug("Question block:", blockLines);

    // The first line is informational, formatted something like this: T1A01 (C) [97.1]
    // where T1A01 is the question number, (C) is the correct answer, and [97.1] is the FCC rule reference.
    metaInfoLine = blockLines.shift();
    metaInfo = parseMetaInfo(metaInfoLine);

    // The second line contains the question.
    let questionText = blockLines.shift();
    let figureURI = identifyFigure(questionText);
    showQuestion(questionText, figureURI);

    // Possible answers are given on the remaining lines.
    let answerChoices = blockLines;
    fccRuleReferences = identifyPart97(metaInfo.reference);
    showAnswerChoices(answerChoices, metaInfo.answerLetter);

    // References are written, but remain hidden until answer is revealed.
    showReferences(fccRuleReferences);
}
