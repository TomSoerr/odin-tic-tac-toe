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
        if (
          e.target.classList.contains('game-board-cell')
          && (
            !e.target.classList.contains('x-icon')
            && !e.target.classList.contains('o-icon')
          )
        ) {
          pubSub.emit('cellClick', e.target);
        }
      });
      for (let x = 0; x < 9; x += 1) {
        const field = create('div', `cell-${x}`, 'game-board-cell');
        gameBoardDiv.append(field);
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
      const [cell, turn] = updateData;
      if (cell) {
        cell.classList.add(`${(turn === 'x') ? 'o' : 'x'}-icon`);
      }
      if (turn === 'x') {
        playerTwoDiv.classList.remove('active');
        playerOneDiv.classList.add('active');
      } else {
        playerOneDiv.classList.remove('active');
        playerTwoDiv.classList.add('active');
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
  let playerTurn;
  let gameBoard;
  let maxGameRound;
  let gameRound;
  let playerOnePoints;
  let playerTwoPoints;
  let difficulty;

  const startGame = (startData) => {
    const [n1, n2, round, diff] = startData;
    playerTurn = 'x';
    gameBoard = ['', '', '', '', '', '', '', '', ''];
    maxGameRound = round;
    gameRound = 1;
    playerOnePoints = 0;
    playerTwoPoints = 0;
    difficulty = diff;
    pubSub.emit('updateInfo', [1, 0, 0]);
    pubSub.emit('updateBoard', [null, playerTurn]);
  };

  const updateGameBoard = (updateData) => {
    const cell = updateData;
    cell.classList.add(`${playerTurn}-icon`);
    playerTurn = (playerTurn === 'x') ? 'o' : 'x';
    pubSub.emit('updateBoard', [cell, playerTurn]);
  };

  return { updateGameBoard, startGame };
})();
pubSub.on('startGame', game.startGame);
pubSub.on('cellClick', game.updateGameBoard);

pubSub.emit('startGame', [['Joe', 'x'], ['Bot', 'o'], 3, 'easy']); // player one is x in every case
