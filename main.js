const pubSub = (() => {
  const events = {};
  const on = (eventName, fn) => {
    events[eventName] = events[eventName] || [];
    events[eventName].push(fn);
  };
  const emit = (eventName, data) => {
    if (events[eventName]) {
      events[eventName].forEach((fn) => {
        fn(data);
      });
    }
  };
  return { on, emit };
})();

const builder = (() => {
  const root = document.querySelector('#root');

  const gamePage = (() => {
    const create = (type, id = '', className = '') => {
      const el = document.createElement(type);
      if (id) el.id = id;
      if (className) el.classList.add(className);
      return el;
    };
    let gameRound;
    let playerOneDiv;
    let playerTwoDiv;
    const field = [];

    const build = (startData) => {
      const [[playerOneName, playerOneIcon],
        [playerTwoName, playerTwoIcon]] = startData;

      const gamePageDiv = create('div', 'game-page', '');

      const menuButton = create('button', 'menu-button', '');
      menuButton.textContent = 'Menu';

      const gameDiv = create('div', 'game', '');

      const gameInfoDiv = create('div', 'game-info', '');

      const roundDiv = create('div', '', 'info');
      const round = create('p');
      gameRound = create('span', 'game-round');
      round.append('Round ', gameRound);
      const points = create('p');
      points.textContent = 'Points';
      roundDiv.append(round, points);

      playerOneDiv = create('div', '', 'info');
      const playerOne = create('p');
      playerOne.textContent = `${playerOneName} `;
      const playerOneIconSpan = create('span', `${playerOneIcon}-icon`);
      const playerOnePoints = create('p', '', 'player-points');
      playerOneDiv.append(playerOne, playerOneIconSpan, playerOnePoints);

      playerTwoDiv = create('div', '', 'info');
      const playerTwo = create('p');
      playerTwo.textContent = `${playerTwoName} `;
      const playerTwoIconSpan = create('span', `${playerTwoIcon}-icon`);
      const playerTwoPoints = create('p', '', 'player-points');
      playerTwoDiv.append(playerTwo, playerTwoIconSpan, playerTwoPoints);

      gameInfoDiv.append(roundDiv, playerOneDiv, playerTwoDiv);

      const gameBoardDiv = create('div', 'game-board');
      gameBoardDiv.addEventListener('click', (e) => {
        if (!e.target.className.match(/icon/)
          && e.target.className.match(/game-board-cell/)) {
          pubSub.emit('cellClick', e.target.id);
        }
      });
      for (let x = 0; x < 9; x += 1) {
        const cell = create('div', `cell-${x}`, 'game-board-cell');
        field.push(cell);
        gameBoardDiv.append(cell);
      }

      gameDiv.append(gameInfoDiv, gameBoardDiv);
      gamePageDiv.append(menuButton, gameDiv);
      root.append(gamePageDiv);
    };

    const updateInfo = (updateData) => {
      const [round, pOnePoints, pTwoPoints] = updateData;
      gameRound.textContent = round;
      playerOneDiv.lastChild.textContent = pOnePoints;
      playerTwoDiv.lastChild.textContent = pTwoPoints;
    };

    const updateBoard = (updateData) => {
      const [player, id, icon] = updateData;
      if (player === 'playerOne') {
        playerOneDiv.classList.remove('active');
        playerTwoDiv.classList.add('active');
      } else if (player === 'playerTwo') {
        playerTwoDiv.classList.remove('active');
        playerOneDiv.classList.add('active');
      }
      if (id) {
        field[id.match(/\d$/)[0]].classList.add(`${icon}-icon`);
      }
    };

    return { build, updateInfo, updateBoard };
  })();

  return { gamePage };
})();
pubSub.on('startGame', builder.gamePage.build);
pubSub.on('updateInfo', builder.gamePage.updateInfo);
pubSub.on('updateBoard', builder.gamePage.updateBoard);

const game = (() => {
  let gameBoard;
  let maxGameRound;
  let gameRound;
  let difficulty;
  let playerOne;
  let playerTwo;
  let currentPlayer;

  const player = (playerName, playerIcon, objName) => {
    const name = playerName;
    const icon = playerIcon;
    const playerNum = objName;
    let points;
    const update = (id) => {
      pubSub.emit('updateBoard', [currentPlayer.playerNum, id, icon]);
      gameBoard[id.match(/\d$/)[0]] = icon;
    };
    return {
      name, icon, points, playerNum, update,
    };
  };

  const switchCurrentPlayer = () => {
    if (currentPlayer === playerOne) {
      currentPlayer = playerTwo;
    } else {
      currentPlayer = playerOne;
    }
  };
  const bot = (() => {
    let method;
    const easyBot = () => {
      const emptyCells = [];
      for (let x = 0; x < gameBoard.length; x += 1) {
        if (!gameBoard[x]) {
          emptyCells.push(x);
        }
      }
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    };
    switch (difficulty) {
      default:
        method = easyBot;
    }

    const pick = () => {
      if (currentPlayer.name === 'Bot') {
        setTimeout(() => {
          currentPlayer.update(`cell-${method()}`);
          switchCurrentPlayer();
          pubSub.emit('currentUpdated', null);
        }, 1000);
      }
    };
    return { pick };
  })();

  const checkWin = null;

  const startGame = (startData) => {
    const [[playerOneName, playerOneIcon],
      [playerTwoName, playerTwoIcon], round, diff] = startData;
    gameBoard = ['', '', '', '', '', '', '', '', ''];
    maxGameRound = round;
    gameRound = 1;
    difficulty = diff;
    playerOne = player(playerOneName, playerOneIcon, 'playerOne');
    playerTwo = player(playerTwoName, playerTwoIcon, 'playerTwo');
    currentPlayer = [playerOne, playerTwo][Math.floor(Math.random() * 2)];
    pubSub.emit('updateInfo', [1, 0, 0]);
    pubSub.emit('updateBoard', [
      /* with every player.update() the active class will be set to the opposite
      of the current player so that the next player can pick its game field.
      Because that the initial value ist the opposite */
      (currentPlayer.playerNum === 'playerTwo') ? 'playerOne' : 'playerTwo',
      null,
    ]);
    if (currentPlayer.name === 'Bot') bot.pick();
  };

  const updateGameBoard = (id) => {
    if (currentPlayer.name !== 'Bot') {
      currentPlayer.update(id);
      switchCurrentPlayer();
      pubSub.emit('currentUpdated', null);
    }
  };

  // pubSub.on('currentUpdated', checkWin);
  pubSub.on('currentUpdated', bot.pick);
  return { updateGameBoard, startGame };
})();
pubSub.on('startGame', game.startGame);
pubSub.on('cellClick', game.updateGameBoard);

pubSub.emit('startGame', [['Joe', 'x'], ['Bot', 'o'], 3, 'easy']);
