const SpeedrunType = {
  tutorial: 0,
  kanto_champion: 1,
  kanto_pokedex: 2
}

const SpeedrunOptions = {
  type: 0,
};

(() => {
  const injectMethodBefore = (object, method, callback) => {
    const original = object[method].bind(object);
    
    object[method] = (...arguments) => {
      callback(...arguments);
      original(...arguments);
    };
  };

  const injectMethodAfter = (object, method, callback) => {
    const original = object[method].bind(object);
    
    object[method] = (...arguments) => {
      original(...arguments);
      callback(...arguments);
    };
  };

  const logInfo = (...args) => {
    console.info('%c[PCSRT]', 'color: red;', ...args)
  };

  logInfo('PokeClicker Speedrun Timer Enabled!');

  let startTime = null;
  let endTime = null;
  injectMethodAfter(StartSequenceRunner, 'start', () => {
    logInfo('Game Loaded, Injecting hooks.');

    // Add our timer container
    const timerContainer = document.createElement('div');
    timerContainer.id = 'speedrunTimerContainer';
    timerContainer.classList.add('card', 'sortable', 'border-secondary', 'mb-3');
    timerContainer.innerHTML = `
    <div class="card-header p-0" data-toggle="collapse" href="#speedrunTimerBody">
      <span style="text-align:center">Speedrun Timer</span>
    </div>
    <div class="card-body p-0">
      <h3 id="speedrunTimerClock" class="text-primary font-weight-bold">0</h3>
      <small id="speedrunTimerClockMS" class="text-primary font-weight-bold" style="margin-left: -5px">.000</small>
      <div id="speedrunTimerBody" class="show">
        <table id="speedrunTimerTable" class="table table-sm m-0">
          <tbody>
          </tbody>
        </table>
      </div>
    </div>`;
    document.getElementById('right-column').appendChild(timerContainer);

    // Add our speedrun options
    const speedrunModal = document.createElement('div');
    speedrunModal.id = 'speedrunModal';
    speedrunModal.classList.add('modal', 'noselect', 'fade');
    speedrunModal.role = 'dialog';
    speedrunModal.ariaLabel = 'speedrunModal';
    speedrunModal.innerHTML = `
    <div class="modal-dialog modal-dialog-scrollable modal-md" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Speedrun Options</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <h3>Type</h3>
          <div class="btn-group-toggle" data-toggle="buttons">
            <label class="btn btn-secondary btn-block active">
              <input type="radio" name="speedrunType" id="speedrunType0" value="0" onchange="SpeedrunOptions.type = this.value" checked> Tutorial
            </label>
            <label class="btn btn-secondary btn-block">
              <input type="radio" name="speedrunType" id="speedrunType1" value="1" onchange="SpeedrunOptions.type = this.value"> Kanto Champion
            </label>
            <label class="btn btn-secondary btn-block">
              <input type="radio" name="speedrunType" id="speedrunType2" value="2" onchange="SpeedrunOptions.type = this.value"> 151 Pokemon
            </label>
          </div>
          <br/>
          <button class="btn btn-primary btn-block" data-dismiss="modal">Done!</button>
        </div>
      </div>
    </div>`;
    document.body.appendChild(speedrunModal);

    const speedrunButton = document.createElement('a');
    speedrunButton.classList.add('btn', 'btn-primary', 'mr-0');
    speedrunButton.href = '#speedrunModal';
    speedrunButton.dataset.toggle = 'modal';
    speedrunButton.innerText = 'Speedrun Options';
    document.querySelector('#startSequenceModal .modal-footer').prepend(speedrunButton);

    injectMethodAfter(Battle, 'defeatPokemon', () => {
      // Only run when we defeat our first pokemon
      if (App.game.statistics.totalPokemonDefeated() > 1) return

      // Lets start our timer
      logInfo('Started timer!');

      startTime = new Date();

      const clockElement = document.getElementById('speedrunTimerClock');
      const msElement = document.getElementById('speedrunTimerClockMS');
      const updateTimer = (delta) => {
        if (!startTime) return;

        // If we finished the run
        let now = endTime || new Date();
        const time = new Date(now - startTime);
        clockElement.innerText = time.toISOString().substring(11, 19).replace(/^[0:]+/, '') || '0';
        msElement.innerText = time.toISOString().substring(19, 23);
        if (!endTime) requestAnimationFrame(updateTimer);
        else {
          clockElement.classList.remove('text-primary');
          clockElement.classList.add('text-success');
          msElement.classList.remove('text-primary');
          msElement.classList.add('text-success');
        }
      }
      requestAnimationFrame(updateTimer);
      
    });

    injectMethodBefore(App.game.party, 'gainPokemonById', (id, shiny) => {
      // If run ended
      if (endTime) return;

      // Only add a split if the pokemon is new
      if (!App.game.party.alreadyCaughtPokemon(id)) {
        // Add one as we are running this method before we catch the pokemon
        const count = App.game.party.caughtPokemon.length + 1;

        if (count % 20 == 0 || count == 151) {
          logInfo(`Pokemon Caught: ${count}!`);
  
          const now = new Date();
          const time = new Date(now - startTime);

          if (SpeedrunOptions.type == SpeedrunType.kanto_pokedex && count == 151) {
            endTime = now;
          }
  
          const table = document.getElementById('speedrunTimerTable');
          const row = table.insertRow();
          badgeCell = row.insertCell();
          badgeCell.innerText = `${count} Pokemon`;
          timeCell = row.insertCell();
          timeCell.innerText = time.toISOString().substring(11, 23).replace(/^[0:]+/, '');
        }
      }
    });  

    injectMethodBefore(App.game.badgeCase, 'gainBadge', badge => {
      // If run ended
      if (endTime) return;

      // Only add a split if the badge is new
      if (!App.game.badgeCase.hasBadge(badge)) {
        // Splits on badge gained
        logInfo(`Badge Earned: ${GameConstants.camelCaseToString(BadgeEnums[badge])}!`);

        const now = new Date();
        const time = new Date(now - startTime);

        if (SpeedrunOptions.type == SpeedrunType.tutorial && badge == BadgeEnums.Boulder) {
          endTime = now;
        }

        if (SpeedrunOptions.type == SpeedrunType.kanto_champion && badge == BadgeEnums.Elite_KantoChampion) {
          endTime = now;
        }

        const table = document.getElementById('speedrunTimerTable');
        const row = table.insertRow();
        badgeCell = row.insertCell();
        badgeCell.innerText = `${GameConstants.camelCaseToString(BadgeEnums[badge])} Badge`;
        timeCell = row.insertCell();
        timeCell.innerText = time.toISOString().substring(11, 23).replace(/^[0:]+/, '');
      }
    });
  });
})();