(() => {
  const logInfo = (...args) => {
    console.info('%c[PCSRT]', 'color: red;', ...args)
  }

  const injectMethodBefore = (object, method, callback) => {
    const original = object[method].bind(object);
    
    object[method] = (...arguments) => {
      callback(...arguments);
      original(...arguments);
    };
  }

  const injectMethodAfter = (object, method, callback) => {
    const original = object[method].bind(object);
    
    object[method] = (...arguments) => {
      original(...arguments);
      callback(...arguments);
    };
  }

  logInfo('PokeClicker Speedrun Timer Enabled!');

  let startTime = null;
  injectMethodAfter(StartSequenceRunner, 'start', () => {
    logInfo('Game Loaded, Injecting hooks.');
    const timerContainer = document.createElement('div');
    timerContainer.id = 'speedrunTimerContainer';
    timerContainer.classList.add('card', 'sortable', 'border-secondary', 'mb-3');
    timerContainer.innerHTML = `
    <div class="card-header p-0" data-toggle="collapse" href="#speedrunTimerBody">
        <span style="text-align:center">Speedrun Timer</span>
    </div>
    <div id="speedrunTimerBody" class="card-body show p-0">
      <table id="speedrunTimerTable" class="table table-sm m-0">
        <tbody>
          <tr>
            <th class="p-0" colspan="3">
              <h3 id="speedrunTimerClock" class="text-primary">00:00:00</h3>
              <small id="speedrunTimerClockMS" class="text-primary">.000</small>
            </th>
          </tr>
        </tbody>
      </table>
    </div>`;
    document.getElementById('right-column').appendChild(timerContainer);

    injectMethodAfter(Battle, 'defeatPokemon', () => {
      // Only run if we dont have a start time
      if (startTime) return;

      logInfo('Started timer!');

      startTime = new Date();

      const clockElement = document.getElementById('speedrunTimerClock');
      const msElement = document.getElementById('speedrunTimerClockMS');
      const updateTimer = (delta) => {
        const now = Date.now();
        const time = new Date(now - startTime);
        clockElement.innerText = time.toISOString().substring(11, 19);
        msElement.innerText = time.toISOString().substring(19, 23);
        requestAnimationFrame(updateTimer);
      }
      requestAnimationFrame(updateTimer);
      
    });

    injectMethodBefore(App.game.party, 'gainPokemonById', (id, shiny) => {
      if (!App.game.party.alreadyCaughtPokemon(id)) {
        // Splits on pokemon caught?
      }
    });  

    injectMethodBefore(App.game.badgeCase, 'gainBadge', badge => {
      if (!App.game.badgeCase.hasBadge(badge)) {
        // Splits on badge gained
        logInfo(`Badge Earned: ${GameConstants.camelCaseToString(BadgeEnums[badge])}!`);

        const now = Date.now();
        const time = new Date(now - startTime);

        const table = document.getElementById('timerTable');
        const row = table.insertRow();
        badgeCell = row.insertCell();
        badgeCell.innerText = `${GameConstants.camelCaseToString(BadgeEnums[badge])} Badge`;
        timeCell = row.insertCell();
        timeCell.innerText = time.toISOString().substring(11, 23).replace(/^[0:]+/, '');
      }
    });
  });
})();