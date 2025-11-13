$(document).ready(function () {
    // $("#test").text("Hello, World!");

    words = 'https://raw.githubusercontent.com/Manuel0815/VocabuLlama/refs/heads/main/words.csv';
    const wordList = [];
    let quizConfig = {};
    let currentPlayer = 1;
    let p1points = 0;
    let p2points = 0;

    $.get(words, function (data) {
        const lines = data.split('\n');

        for (let i = 1; i < lines.length; i++) { // ignore first line (header)
            const columns = lines[i].split(';');
            if (columns.length === 3) {
                wordList.push({
                    english: columns[0].trim(),
                    german: columns[1].trim(),
                    unit: columns[2].trim()
                });
            }
        }
        const uniqueUnits = [...new Set(wordList.map(word => word.unit))];
        const unitSelect = $('#unitSelect');

        uniqueUnits.forEach(unit => {
            unitSelect.append($('<option></option>').val(unit).text(unit));
        });
        // console.log(wordList);
        // $("#test").text(JSON.stringify(wordList, null, 2));
    });

    function setPlayerPoints() {
        console.log("Setting points: P1=" + p1points + ", P2=" + p2points);
        $("#p1points").text(p1points + " Points");
        $("#p1pointssingle").text(p1points + " Points");
        $("#p2points").text(p2points + " Points");
    }

    function startQuiz() {
        $("#config").addClass("d-none");
        $("#quiz").removeClass("d-none");

        if (quizConfig.players === 1) {
            $("#multiPlayerCards").addClass("d-none");
            $("#singlePlayerCards").removeClass("d-none");
        } else {
            $("#singlePlayerCards").addClass("d-none");
            $("#multiPlayerCards").removeClass("d-none");
        }
        currentPlayer = 1;
        $("#p1card").addClass("featured");
        $("#p2card").removeClass("featured");
        p1points = 0;
        p2points = 0;
        setPlayerPoints();

        // initialize and save current question index
        quizConfig.currentIndex = 0;

        // display the first question (show English, expect German answer)
        const currentWord = quizConfig.words[quizConfig.currentIndex];
        $("#quizWord").text(currentWord.german);
        $("#statusQuestions").text("Question " + (quizConfig.currentIndex + 1) + " of " + quizConfig.words.length);
    }

    function showSolution() {
        const currentWord = quizConfig.words[quizConfig.currentIndex];
        $("#quizWordSolution").text(currentWord.english);
        $("#btnShow").addClass("d-none");
        $("#btnCorrect").removeClass("d-none");
        $("#btnWrong").removeClass("d-none");
    }

    function nextWord() {
        quizConfig.currentIndex += 1;
        if (quizConfig.currentIndex >= quizConfig.words.length) {
            // quiz over
            $("#quiz").addClass("d-none");
            $("#summary").removeClass("d-none");
            $("#finalP1points").text(p1points + " Points");
            $("#finalP2points").text(p2points + " Points");
            if (quizConfig.players > 1) {
                $("#summaryMultiPlayerCards").removeClass("d-none");
                $("#summarySinglePlayerCards").addClass("d-none");
            } else {
                $("#summarySinglePlayerCards").removeClass("d-none");
                $("#summaryMultiPlayerCards").addClass("d-none");
            }

            if (p1points > p2points) {
                $("#summaryWinner").text("Player 1 Wins!");
                $("#finalp1card").addClass("featured");
                $("#finalp2card").removeClass("featured");
            } else if (p2points > p1points) {
                $("#summaryWinner").text("Player 2 Wins!");
                $("#finalp2card").addClass("featured");
                $("#finalp1card").removeClass("featured");
            } else {
                $("#summaryWinner").text("It's a Tie!");
            }
            return;
        }

        if (quizConfig.players === 2) {
            // switch player
            if (currentPlayer === 1) {
                currentPlayer = 2;
                $("#p1card").removeClass("featured");
                $("#p2card").addClass("featured");
            } else {
                currentPlayer = 1;
                $("#p2card").removeClass("featured");
                $("#p1card").addClass("featured");
            }
        }
        // display next word
        const currentWord = quizConfig.words[quizConfig.currentIndex];
        $("#quizWord").text(currentWord.german);
        $("#quizWordSolution").text("");
        $("#statusQuestions").text("Question " + (quizConfig.currentIndex + 1) + " of " + quizConfig.words.length);
        $("#btnShow").removeClass("d-none");
        $("#btnCorrect").addClass("d-none");
        $("#btnWrong").addClass("d-none");
    }

    $("#btnShow").click(function () {
        showSolution();
    });

    $("#btnCorrect").click(function () {
        // award point to current player
        if (currentPlayer === 1) {
            p1points += 10;
        } else {
            p2points += 10;
        }
        setPlayerPoints();
        nextWord();
    });

    $("#btnWrong").click(function () {
        nextWord();
    });
    $("#btnRestart").click(function () {
        $("#summary").addClass("d-none");
        $("#config").removeClass("d-none");
    });

    $("#btnStart").click(function () {
        const wordCount = parseInt($("#wordCount").val());
        const unitSelect = $("#unitSelect").val();
        const playerCount = parseInt($("#playerCount").val());

        let filteredWords = wordList;

        if (unitSelect !== "-1") {
            filteredWords = wordList.filter(word => word.unit === unitSelect);
        }
        if (wordCount !== -1 && wordCount < filteredWords.length) {
            // take a random sample using Fisher-Yates shuffle
            const shuffled = filteredWords.slice();
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            filteredWords = shuffled.slice(0, wordCount);
        }

        quizConfig = {
            currentIndex: 0,
            words: filteredWords,
            players: playerCount
        };

        $("#test").text(filteredWords.length + " words selected.\n" + JSON.stringify(quizConfig, null, 2));

        startQuiz();
    });
});