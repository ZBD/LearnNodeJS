jQuery(function($) {
    'use strict';

    var IO = {
        /**
         * This is called when the page is displayed. It connects the Socket.IO client
         * to the Socket.IO server
         */
        init: function() {
            IO.socket = io.connect();
            IO.bindEvents();
        },

        /** 
         * While connected, Socket.IO will listen to the folloing events emitted
         * by the Socket.IO server, then run the appropriate function
         */
        bindEvents: function() {
            IO.socket.on('connected', IO.onConnected);
            IO.socket.on('newGameCreated', IO.onNewGameCreated);
            IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom);
            IO.socket.on('beginNewGame', IO.beginNewGame);
            IO.socket.on('newWordData', IO.onNewWordData);
            IO.socket.on('hostCheckAnswer', IO.hostCheckAnswer);
            IO.socket.on('gameOver', IO.gameOver);
            IO.socket.on('error', IO.error);
        },

        /**
         * The client is successfully connected
         */
        onConnected: function() {
            App.mySocketId = IO.socket.Socket.sessionid;
        },

        /**
         * A new game has been created and a random game ID has been generated.
         * @param data {{ gameId: int, mySocketId: *}}
         */
        onNewGameCreated: function(data) {
            App.Host.gameInit(data);
        },

        /**
         * A player has successfully joined the game.
         * @param data {{playerName: string, gameId: int, mySocketId: int}}
         */
        playerJoinedRoom: function(data) {
            // When a player joineds a room, do the updateWaitingScreen function
            // There are two versions of this function: one for 'host' and another for the 'player'
            // App.myRole is the role name
            App[App.myRole].updateWaitingScreen(data);
        },

        /**
         * A new set of words for the round is returned from the server.
         * @param data
         */
        onNewWordData: function(data) {
            // Update the current round
            App.currentRound = data.round;
            // Change the word for the Host and Player
            App[App.myRole].newWor(data);
        },

        /**
         * A player answered. If this is the hos, check the answer.
         * @param data
         */
        hostCheckAnswer: function(data) {
            if (App.myRole == 'Host') {
                App.Host.checkAnswer(data);
            }
        },

        /**
         * Let everyone know the game has ended
         */
        gameOver: function(data) {
            App[App.myRole].endGame(data);
        },

        /**
         * An error has occurred.
         * @param data
         */
        error: function(data) {
            alert(data.message);
        }
    };

    var App = {

        /**
         * Keep track of the gameId, which is identical to the ID of the Socket.IO Room used for the players and host to communicate
         */
        gameId: 0,

        /**
         * This is used to differentiate between 'Host' and 'Player' browsers
         * 'Player' or 'Host'
         */
        myRole: '',

        /**
         * The Socket.IO socket object identifier. This is unique for each player and host.
         * It is generated when the browser initially connects to the server when the page loads for the first time
         */
        mySocketId: '',

        /**
         * Identifies the current round. Starts at 0 because it corresponds to the array of word data stored on the server.
         */
        currentRound: 0,

        /* **************************************** *
         *                  Setup                   *
         * **************************************** */

        /**
         *  This runs when the page initially loads.
         */
        init: runction() {
            App.cacheElements();
            App.showInitScreen();
            App.bindEvents();
            FastClick.attach(document.body);
        },

        /**
         * Create references to on-screen elements used throughout the game
         */
        cacheElements: function() {
            App.$doc = $(document);
            App.$gameArea = $('#gameArea');
            App.$templateIntroScreen = $('#intro-screen-template').html();
            App.$templateNewGame = $('#create-game-template').html();
            App.$templateJoinGame = $('#join-game-template').html();
            App.$hostGame = $('#host-game-template').html();
        },

        /**
         * Create some click handlers for the various buttons that appear on-screen
         */
        bindEvents: function() {
            App.$doc.on('click', '#btnCreateGame', App.Host.onCreateClick);
            App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
            App.$doc.on('click', '#btnStart', App.Player.onPlayerStartClick);
            App.$doc.on('click', '.btnAnswer', App.Player.onPlayerAnswerClick);
            App.$doc.on('click', '#btnPlayerRestart', App.Player.onPlayerRestart);
        },

        /* *************************************** *
         *              Game Logic                 *
         * *************************************** */

        /**
         * Show the initial Anagrammatix Title Screen
         * (with Start and Join buttons)
         */
        showInitScreen: function() {
            App.$gameArea.html(App.$templateIntroScreen);
            App.doTextFit('.title');
        },

        /* *************************************** *
         *              Host Code                  *
         * *************************************** */
        Host: {

            /**
             * Contains references to a player data
             */
            players: [],

            /**
             * Flag to indicate if a new game is starting.
             * This is used after the first game ends and players initiate a new game without refreshing the browser windows.
             */
            isNewGame: false,
            
            /**
             * Keep track of the number of players that have joined the game.
             */
            numPlayersInRoom: 0,

            /**
             * A reference to the correct answer for the current round.
             */
            currentCorrectAnswer: '',

            /**
             * Handler for the "Start" button on the Title Screen.
             */
            onCreateClick: function() {
                console.log('Clicked "Create A Game"');
                IO.socket.emit('hostCreateNewGame');
            },

            /**
             * The Host screen is displayed for the first time.
             * @param data{{ gameId: int, mySocketId: *}}
             */
            gameInit: function(data) {
                App.gameId = data.gameId;
                App.mySocketId = data.mySocketId;
                App.myRole = 'Host';
                App.Host.numPlayersInRoom = 0;

                App.Host.displayNewGameScreen();
                console.log("Game started with ID: " + App.gameId + ' by host: ' + App.mySocketId);                
            }

            /**
             * show the Host screen containing the game URL and unique game ID
             */
            displayNewGameScreen: function() {
                // Fill the game screen with the appropriate HTML
                App.$gameArea.html(App.$templateNewGame);

                // Display the URL on screen
                $('#gameURL').text(windows.location.href);
                App.doTextFit('#gameURL');

                //show the gameId / room id on screen
                $('#spanNewGameCode').text(App.gameId);
            },

            updateWaitingScreen: function(data) {
                if (App.Host.isNewGame) {
                    App.Host.displayNewGameScreen();
                }
                $('#playersWaiting').append('<p/>').text('Player ' + data.playerName + ' joined the game.');

                // Store the new player's data on the Host.
                App.Host.players.push(data);

                App.Host.numPlayersInRoom += 1;

                if (App.Host.numPlayersInRoom === 2) {
                    IO.socket.emit('hostRoomFull', App.gameId);
                }
            },

            /**
             * show the countdown screen
             */
            gameCountdown: function() {
                App.$gameArea.html(App.$hostGame);
                App.doTextFit('#hostWord');

                var $secondsLeft = $('#hostWord');
                App.countDown( $secondsLeft, 5, function() {
                    IO.socket.emit('hostCountdownFinished', App.gameId);
                });

                $('#player1Score').find('.playerName').html(App.Host.players[0].playerName);
                $('#player2Score').find('.playerName').html(App.Host.players[1].playerName);

                // Set the score section on screen to 0 for each player.
                $('#player1Score').find('.score').attr('id', App.Host.players[0].mySocketId);
                $('#player2Score').find('.score').attr('id', App.Host.players[1].mySocketId);
            },

            /**
             * Show the word for the current round on screen.
             * @param data{{round: *, word: *, answer: *, list: Array}}
             */
            newWord: function(data) {
                $('#hostWord').text(data.word);
                App.doTextFit('#hostWord');

                App.Host.currentCorrectAnswer = data.answer;
                App.Host.currentRound = data.round;
            }

            /**
             * check the answer clicked by a player.
             * @param data{{round: *, playerId: *, answer: *, gameId: *}}
             */
            checkAnswer: function(data) {
                if (data.round === App.currentRound) {
                    var $pScore = $('#' + data.playerId);
                    if (App.Host.currentCorrectAnswer === data.answer) {
                        $pScore.text( +$pScore.text() + 5);
                        App.currentRound += 1;

                        var data = {
                            gameId: App.gameId,
                            round: App.currentRound
                        };

                        IO.socket.emit('hostNextRound', data);
                    } else {
                        $pScore.text( +$pScore.text() - 3);
                    }
                }
            },


                



