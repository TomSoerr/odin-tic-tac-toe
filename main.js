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
    let gamePageDiv;
    let menuButton;
    let gameBoardDiv;
    let gameRound;
    let playerOneDiv;
    let playerTwoDiv;
    let field;

    const build = (data) => {
      const [[playerOneName, playerOneIcon],
        [playerTwoName, playerTwoIcon]] = data;

      gamePageDiv = create('div', 'game-page', '');

      menuButton = create('button', 'menu-button', '');
      menuButton.textContent = 'Menu';
      menuButton.addEventListener('click', () => {
        pubSub.emit('removeGame');
        menuButton = null;
      });

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

      gameBoardDiv = create('div', 'game-board');
      gameBoardDiv.addEventListener('click', (e) => {
        if (!e.target.className.match(/icon/)
          && e.target.className.match(/game-board-cell/)) {
          pubSub.emit('cellClick', e.target.id);
        }
      });
      field = [];
      for (let x = 0; x < 9; x += 1) {
        const cell = create('div', `cell-${x}`, 'game-board-cell');
        field.push(cell);
        gameBoardDiv.append(cell);
      }

      gameDiv.append(gameInfoDiv, gameBoardDiv);
      gamePageDiv.append(menuButton, gameDiv);
      root.append(gamePageDiv);

      pubSub.emit('startGame', data);
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
      if (id !== null) {
        field[id].classList.add(`${icon}-icon`);
      }
    };

    const clearBoard = () => {
      field.forEach((cell) => {
        cell.classList.remove('x-icon', 'o-icon');
      });
    };

    const remove = () => {
      gameBoardDiv = null;
      menuButton = null;
      gamePageDiv.remove();
      pubSub.emit('menu');
    };

    return {
      build, updateInfo, updateBoard, clearBoard, remove,
    };
  })();

  const menuPage = () => {
    const menuPageDiv = document.createElement('div');
    menuPageDiv.id = 'menu-page';
    const menuDiv = document.createElement('div');
    menuDiv.id = 'menu';
    let gameButton = document.createElement('button');
    gameButton.id = 'game-button';
    gameButton.textContent = 'Start game';

    menuDiv.append(gameButton);
    menuPageDiv.append(menuDiv);
    root.append(menuPageDiv);

    gameButton.addEventListener('click', () => {
      pubSub.emit('play', [['Joe', 'o'], ['Bot', 'x'], 2, 'easy']);
      menuPageDiv.remove();
      gameButton = null;
    });
  };

  const overlay = (() => {
    const text = document.createElement('div');
    text.id = 'overlay-text';
    root.append(text);
    const build = (msg) => {
      text.style.display = 'grid';
      root.lastElementChild.style.filter = 'blur(5px)';
      text.textContent = msg;
      setTimeout(() => {
        text.style.display = 'none';
        root.lastElementChild.style.filter = null;
      }, 5000);
    };
    return { build };
  })();

  return { gamePage, menuPage, overlay };
})();

const game = (() => {
  let gameBoard;
  let maxGameRound;
  let gameRound;
  let moves;
  let difficulty;
  let playerOne;
  let playerTwo;
  let currentPlayer;

  const noOverallWin = () => {
    gameRound += 1;
    if (gameRound > maxGameRound) {
      if (playerOne.points > playerTwo.points) {
        pubSub.emit('overlay', `${playerOne.name} is the overall Winner!`);
      } else if (playerOne.points < playerTwo.points) {
        pubSub.emit('overlay', `${playerTwo.name} is the overall Winner!`);
      } else {
        pubSub.emit('overlay', 'There is no overall Winner. Its a Draw!');
      }
    } else {
      return true;
    }
    return false;
  };

  const noWin = () => {
    if (moves <= 4) {
      if (
        (gameBoard[0] === gameBoard[1] && gameBoard[1] === gameBoard[2]
          && gameBoard[0])
        || (gameBoard[3] === gameBoard[4] && gameBoard[4] === gameBoard[5]
          && gameBoard[3])
        || (gameBoard[6] === gameBoard[7] && gameBoard[7] === gameBoard[8]
          && gameBoard[6])
        || (gameBoard[0] === gameBoard[3] && gameBoard[3] === gameBoard[6]
          && gameBoard[0])
        || (gameBoard[1] === gameBoard[4] && gameBoard[4] === gameBoard[7]
          && gameBoard[1])
        || (gameBoard[2] === gameBoard[5] && gameBoard[5] === gameBoard[8]
          && gameBoard[2])
        || (gameBoard[0] === gameBoard[4] && gameBoard[4] === gameBoard[8]
          && gameBoard[0])
        || (gameBoard[2] === gameBoard[4] && gameBoard[4] === gameBoard[6]
          && gameBoard[2])
      ) {
        currentPlayer.points += 1;
        if (noOverallWin()) {
          pubSub.emit('overlay', `${currentPlayer.name} won!`);
        } else {
          setTimeout(() => {
            pubSub.emit('removeGame');
          }, 5000);
        }
      } else if (moves < 1) {
        if (noOverallWin()) {
          pubSub.emit('overlay', 'It\'s a draw!');
        } else {
          setTimeout(() => {
            pubSub.emit('removeGame');
          }, 5000);
        }
      } else {
        return true;
      }
    } else {
      return true;
    }
    return false;
  };

  const switchCurrentPlayer = () => {
    if (noWin()) {
      if (currentPlayer === playerOne) {
        currentPlayer = playerTwo;
      } else {
        currentPlayer = playerOne;
      }
      pubSub.emit('playerChanged');
    } else {
      moves = 0;
      setTimeout(() => {
        pubSub.emit('clearBoard');
        pubSub.emit('updateInfo', [
          gameRound, playerOne.points, playerTwo.points,
        ]);
      }, 5000);
    }
  };

  const player = (playerName, playerIcon, objName) => {
    const name = playerName;
    const icon = playerIcon;
    const playerNum = objName;
    const points = 0;

    const update = (id) => {
      pubSub.emit(
        'updateBoard',
        [currentPlayer.playerNum, id.toString().match(/\d$/)[0], icon],
      );
      gameBoard[id.toString().match(/\d$/)[0]] = icon;
      moves -= 1;
      switchCurrentPlayer();
    };
    return {
      name, icon, points, playerNum, update,
    };
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
      if (emptyCells.length > 0) {
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
      }
      return null;
    };
    switch (difficulty) {
      default:
        method = easyBot;
    }

    const pick = () => {
      if (currentPlayer.name === 'Bot'
        && moves > 0) {
        setTimeout(() => {
          currentPlayer.update(method());
        }, 1500);
      }
    };
    return { pick };
  })();

  const startGame = (startData) => {
    const [[playerOneName, playerOneIcon],
      [playerTwoName, playerTwoIcon], round, diff] = startData;
    gameBoard = ['', '', '', '', '', '', '', '', ''];
    maxGameRound = round;
    gameRound = 1;
    moves = 9;
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
    pubSub.emit('playerChanged');
  };

  const updateGameBoard = (id) => {
    if (currentPlayer.name !== 'Bot'
      && moves > 0) {
      currentPlayer.update(id);
    }
  };

  const clearGameBoard = () => {
    gameBoard = ['', '', '', '', '', '', '', '', ''];
    moves = 9;
    currentPlayer = [playerOne, playerTwo][Math.floor(Math.random() * 2)];
    pubSub.emit('updateBoard', [
      (currentPlayer.playerNum === 'playerTwo') ? 'playerOne' : 'playerTwo',
      null,
    ]);
    pubSub.emit('playerChanged');
  };

  return {
    updateGameBoard, startGame, clearGameBoard, bot,
  };
})();

pubSub.on('play', builder.gamePage.build);
pubSub.on('updateInfo', builder.gamePage.updateInfo);
pubSub.on('updateBoard', builder.gamePage.updateBoard);
pubSub.on('clearBoard', builder.gamePage.clearBoard);
pubSub.on('overlay', builder.overlay.build);
pubSub.on('removeGame', builder.gamePage.remove);

pubSub.on('startGame', game.startGame);
pubSub.on('cellClick', game.updateGameBoard);
pubSub.on('playerChanged', game.bot.pick);
pubSub.on('clearBoard', game.clearGameBoard);

pubSub.on('menu', builder.menuPage);

pubSub.emit('menu');
