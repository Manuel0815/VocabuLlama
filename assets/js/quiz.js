$(document).ready(function () {
    // $("#test").text("Hello, World!");

    words = 'https://raw.githubusercontent.com/Manuel0815/VocabuLlama/refs/heads/main/words.csv';
    jokers = 'https://raw.githubusercontent.com/Manuel0815/VocabuLlama/refs/heads/main/joker.csv';
    const wordList = [];
    let jokerList = [];
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

        $.get(jokers, function (data) {
            const lines = data.split('\n');
            jokerList = [];

            for (let i = 1; i < lines.length; i++) {
                const columns = lines[i].split(';');
                if (columns.length === 5) {
                    jokerList.push({
                        type: columns[0].trim(),
                        title: columns[1].trim(),
                        text: columns[2].trim(),
                        points: parseInt(columns[3].trim()),
                        affects: columns[4].trim()
                    });
                }
            }
            console.log("Loaded " + jokerList.length + " jokers.");
        });
    });

    function setPlayerPoints() {
        console.log("Setting points: P1=" + p1points + ", P2=" + p2points);
        animatePoints("#p1points", p1points);
        animatePoints("#p1pointssingle", p1points);
        animatePoints("#p2points", p2points);
    }

    function animatePoints(selector, targetPoints) {
        const $element = $(selector);
        const currentPoints = parseInt($element.text()) || 0;
        const increment = Math.ceil((targetPoints - currentPoints) / 10);
        let currentValue = currentPoints;

        const interval = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetPoints) {
                currentValue = targetPoints;
                clearInterval(interval);
            }
            $element.text(currentValue + " Points");
        }, 50);
    }

    function wrongSound() {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // wrong buzzer: two detuned oscillators, descending pitch, 1s total
        const duration = 1.0;
        const now = ctx.currentTime;

        // primary buzzer (square) and a second detuned voice (sawtooth) for body
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + duration);

        const osc2 = ctx.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(330, now);
        osc2.frequency.exponentialRampToValueAtTime(82.5, now + duration);

        // amplitude envelope: quick attack then decay over duration
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.setValueAtTime(0.25, now + 0.01); // quick attack
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        // connect and play
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc2.start(now);
        osc.stop(now + duration + 0.02);
        osc2.stop(now + duration + 0.02);

        // close context shortly after playback finishes
        setTimeout(() => {
            try { ctx.close(); } catch (e) { /* ignore */ }
        }, (duration + 0.1) * 1000);
    }

    function correctSound() {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const duration = 0.6;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        // bright, pleasant chord-ish sound using three oscillators
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5

        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(659.25, now); // E5

        const osc3 = ctx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(783.99, now); // G5

        // slight detune for richness
        osc1.detune.setValueAtTime(-5, now);
        osc2.detune.setValueAtTime(3, now);
        osc3.detune.setValueAtTime(6, now);

        // subtle upward glide
        osc1.frequency.exponentialRampToValueAtTime(540, now + duration);
        osc2.frequency.exponentialRampToValueAtTime(680, now + duration);
        osc3.frequency.exponentialRampToValueAtTime(810, now + duration);

        osc1.connect(gain);
        osc2.connect(gain);
        osc3.connect(gain);
        gain.connect(ctx.destination);

        // staggered start for a pleasant arpeggio feel
        osc1.start(now);
        osc2.start(now + 0.02);
        osc3.start(now + 0.04);

        osc1.stop(now + duration + 0.02);
        osc2.stop(now + duration + 0.02);
        osc3.stop(now + duration + 0.02);

        setTimeout(() => {
            try { ctx.close(); } catch (e) { /* ignore */ }
        }, (duration + 0.1) * 1000);
    }

    function jokerSound() {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const duration = 0.5;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        // tense rising synth with vibrato
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(800, now + duration);

        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(8, now); // vibrato speed
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(50, now); // vibrato depth

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        lfo.start(now);
        osc.stop(now + duration + 0.05);
        lfo.stop(now + duration + 0.05);

        setTimeout(() => {
            try { ctx.close(); } catch (e) { /* ignore */ }
        }, (duration + 0.1) * 1000);
    }

    function gameOverSound() {
        // simple celebratory sound
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const duration = 1.2;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        // triumphant fanfare: rising notes
        const notes = [
            { freq: 523.25, start: 0 },    // C5
            { freq: 659.25, start: 0.15 }, // E5
            { freq: 783.99, start: 0.3 }   // G5
        ];

        notes.forEach(note => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.freq, now + note.start);
            osc.frequency.exponentialRampToValueAtTime(note.freq * 1.2, now + note.start + 0.5);
            osc.connect(gain);
            osc.start(now + note.start);
            osc.stop(now + duration + 0.05);
        });

        gain.connect(ctx.destination);

        setTimeout(() => {
            try { ctx.close(); } catch (e) { /* ignore */ }
        }, (duration + 0.1) * 1000);
    }

    function displayNextWord() {
        const currentWord = quizConfig.words[quizConfig.currentIndex];
        if (currentWord.german === "JOKER") {
            jokerSound();
            const joker = jokerList.find(j => j.title === currentWord.english);
            if (joker) {
                $("#quizWord").text(joker.title);
                setTimeout(() => {
                    $("#quizWordSolution").text(joker.text);
                    $("#btnShow").addClass("d-none");
                    $("#btnAcceptJoker").removeClass("d-none");
                }, 10);
            }
        }
        else {
            if(quizConfig.language == "2")
                $("#quizWord").text(currentWord.english);
            else
                $("#quizWord").text(currentWord.german);
            $("#quizWordSolution").text("_____________");
            $("#btnShow").removeClass("d-none");
            $("#btnAcceptJoker").addClass("d-none");
        }
        $("#statusQuestions").text("Question " + (quizConfig.currentIndex + 1) + " of " + quizConfig.words.length);
        $("#btnCorrect").addClass("d-none");
        $("#btnWrong").addClass("d-none");
    }

    function startQuiz() {
        $("#config").addClass("d-none");
        $("#quiz").removeClass("d-none");
        gameOverSound();

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
        displayNextWord();
    }

    function showSolution() {
        const currentWord = quizConfig.words[quizConfig.currentIndex];
        if(quizConfig.language == "2")
            $("#quizWordSolution").text(currentWord.german);
        else
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

            $("#finalP1points").text("0 Points");
            $("#finalP1pointsSingle").text("0 Points");
            $("#finalP2points").text("0 Points");
            animatePoints("#finalP1points", p1points);
            animatePoints("#finalP1pointsSingle", p1points);
            animatePoints("#finalP2points", p2points);
            gameOverSound();
            window.scrollTo(0, 0);
            if (quizConfig.players > 1) {
                $("#summaryMultiPlayerCards").removeClass("d-none");
                $("#summarySinglePlayerCards").addClass("d-none");
            } else {
                $("#summarySinglePlayerCards").removeClass("d-none");
                $("#summaryMultiPlayerCards").addClass("d-none");
            }

            if (quizConfig.players === 1) {
                $("#summaryWinner").text("Game Over!");
                $("#finalp1card").addClass("featured");
                $("#finalp2card").removeClass("featured");
            } else {
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
        displayNextWord();
    }

    $("#btnShow").click(function () {
        showSolution();
    });

    $("#btnCorrect").click(function () {
        correctSound();
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
        // play a short "wrong" sound using Web Audio API
        wrongSound();
        nextWord();
    });

    $("#btnAcceptJoker").click(function () {
        console.log("Accepting joker for player " + currentPlayer);
        const currentWord = quizConfig.words[quizConfig.currentIndex];
        const joker = jokerList.find(j => j.title === currentWord.english);
        if (joker) {
            setTimeout(() => {
                console.log("Applying joker effect: " + JSON.stringify(joker));
                // apply joker effect
                const pts = parseInt(joker.points, 10) || 0;
                switch ((joker.type || '').toLowerCase()) {
                    case 'add':
                        if (pts > 0)
                            correctSound();
                        else
                            wrongSound();
                        if (currentPlayer === 1) p1points += pts;
                        else p2points += pts;
                        break;
                    case 'steal':
                        if (pts > 0)
                            correctSound();
                        else
                            wrongSound();
                        if (currentPlayer === 1) {
                            p1points += pts;
                            p2points -= pts;
                        } else {
                            p2points += pts;
                            p1points -= pts;
                        }
                        break;
                    case 'swap':
                        jokerSound();
                        [p1points, p2points] = [p2points, p1points];
                        break;
                    case 'double':
                        correctSound();
                        if (currentPlayer === 1) p1points *= 2;
                        else p2points *= 2;
                        break;
                    case 'reset':
                        wrongSound();
                        p1points = 0;
                        p2points = 0;
                        break;
                    default:
                        console.warn('Unhandled joker type:', joker.type);
                }
                setPlayerPoints();
                nextWord();
            }, 10);
        }
    });

    $("#btnRestart").click(function () {
        $("#summary").addClass("d-none");
        $("#config").removeClass("d-none");
    });

    $("#btnStart").click(function () {
        const wordCount = parseInt($("#wordCount").val());
        const unitSelect = $("#unitSelect").val();
        const playerCount = parseInt($("#playerCount").val());
        const language = $("#language").val();

        // Filter words by unit if specified
        let filteredWords = wordList;
        if (unitSelect !== "-1") {
            filteredWords = wordList.filter(word => word.unit === unitSelect);
        }

        // Calculate joker count and select random jokers (only for multiplayer)
        let selectedJokers = [];
        const jokerCount = (playerCount !== 1 && wordCount > 0) ? Math.floor(wordCount / 7) : 0;
        if (jokerCount > 0 && jokerList.length > 0) {
            const shuffled = jokerList.slice();
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            selectedJokers = shuffled.slice(0, Math.min(jokerCount, jokerList.length));
        }

        // Calculate number of regular words needed
        const adjustedWordCount = (wordCount === -1) ? -1 : wordCount - selectedJokers.length;

        // Sample regular words if needed
        let finalWords = filteredWords;
        if (wordCount !== -1 && adjustedWordCount < filteredWords.length) {
            // take a random sample using Fisher-Yates shuffle
            const shuffled = filteredWords.slice();
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            finalWords = shuffled.slice(0, adjustedWordCount);
        }

        // Add jokers to the final word list (only if multiplayer)
        if (playerCount !== 1) {
            selectedJokers.forEach(joker => {
                finalWords.push({
                    english: joker.title,
                    german: "JOKER",
                    unit: "joker"
                });
            });
        }

        // Shuffle final combined list
        const combined = finalWords.slice();
        for (let i = combined.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [combined[i], combined[j]] = [combined[j], combined[i]];
        }
        filteredWords = combined;

        quizConfig = {
            currentIndex: 0,
            words: filteredWords,
            players: playerCount,
            language: language // 1 = english, 2 = german
        };

        console.log(filteredWords.length + " words selected.\n" + JSON.stringify(quizConfig, null, 2));

        startQuiz();
    });
});