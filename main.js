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

const renderer = (() => {
  const root = document.querySelector('#root');

  // game page
  const gamePage = (() => {
    const create = (type, id = '', className = '') => {
      const el = document.createElement(type);
      if (id) el.id = id;
      if (className) el.classList.add(className);
      return el;
    };
    let playerOnePoints;
    let playerTwoPoints;
    let gameRound;


    const build = (names) => {
      const [[playerOneName, playerOneIcon],
        [playerTwoName, playerTwoIcon]] = names;
      const gamePageDiv = create('div', 'game-page', '');

      const menuButton = create('button', 'menu-button', '');
      menuButton.textContent = 'Menu';


      const gameDiv = create('div', 'game', '');

      const gameInfoDiv = create('div', 'game-info', '');

      const roundDiv = create('div', '', 'info');
      const round = create('p');
      gameRound = create('span', 'game-round');
      gameRound.textContent = '1';
      round.append('Round ', gameRound);
      const points = create('p');
      points.textContent = 'Points';
      roundDiv.append(round, points);

      const playerOneDiv = create('div', '', 'info');
      const playerOne = create('p');
      const playerOneIconSpan = create('span', `${playerOneIcon}-icon`);
      playerOne.append(`${playerOneName} `, playerOneIconSpan);
      playerOnePoints = create('p', '', 'player-points');
      playerOnePoints.textContent = 'Zerooo';
      playerOneDiv.append(playerOne, playerOnePoints);

      const playerTwoDiv = create('div', '', 'info');
      const playerTwo = create('p');
      const playerTwoIconSpan = create('span', `${playerTwoIcon}-icon`);
      playerTwo.append(`${playerTwoName} `, playerTwoIconSpan);
      playerTwoPoints = create('p', '', 'player-points');
      playerTwoPoints.textContent = 'Coca Cola';
      playerTwoDiv.append(playerTwo, playerTwoPoints);

      gameInfoDiv.append(roundDiv, playerOneDiv, playerTwoDiv);

      const gameBoardDiv = create('div', 'game-board');
      for (let x = 0; x < 9; x += 1) {
        const field = create('div', '', 'game-field');
        gameBoardDiv.append(field);
      }

      gameDiv.append(gameInfoDiv, gameBoardDiv);
      gamePageDiv.append(menuButton, gameDiv);
      root.append(gamePageDiv);
    };

    const update = (data) => {
      // some code
    };
    return { build, update };
  })();

  pubSub.on('playGame', gamePage.build);
  pubSub.on('updateGame', gamePage.update);
})();

pubSub.emit('playGame', [['Joe', 'x'], ['Bot', 'o']]);
pubSub.emit('test', [
  [0, 1, 1],
  [0, -1, 1],
  [1, -1, 0],
]);
