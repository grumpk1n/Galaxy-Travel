// starwars-travel.js

/**
 * Main module logic to load data, set up sockets, and define the GalaxyTravelApp.
 */
Hooks.once("ready", async () => {
  console.log("[Star Wars Galaxy Travel] Module is ready!");

  // 1) Register a socket listener so anyone can broadcast "openAstrogationApp"
  //    This will cause all clients to open the app
  game.socket.on("module.star-wars-galaxy-travel", (data) => {
    if (data.action === "openAstrogationApp") {
      // Everyone receiving this message opens the Astrogation Computer
      new GalaxyTravelApp(window.StarWarsGalaxyData).render(true);
    }
  });

  // 2) Load galaxy data
  const galaxyData = await fetch("modules/star-wars-galaxy-travel/data/galaxy_data_full.json")
    .then((response) => response.json())
    .catch((error) => {
      console.error("[Star Wars Galaxy Travel] Error loading galaxy data:", error);
      ui.notifications.error("Failed to load galaxy data. Check the module's data folder.");
      return {};
    });

  if (!galaxyData?.planets?.length) {
    console.warn("[Star Wars Galaxy Travel] Galaxy data is empty. Verify galaxy_data_full.json.");
    return;
  }

  // Make data accessible for macros or other scripts
  window.StarWarsGalaxyData = galaxyData;

  // Register a control button in the UI to open the travel calculator
  Hooks.on("getSceneControlButtons", (controls) => {
    const tokenControls = controls.find((control) => control.name === "token");
    if (tokenControls) {
      tokenControls.tools.push({
        name: "galaxy-travel",
        title: "Galaxy Travel Calculator",
        icon: "fas fa-rocket",
        onClick: () => new GalaxyTravelApp(galaxyData).render(true),
        visible: true
      });
    }
  });
});


// Pathfinder handles BFS routing and cost calculations
class Pathfinder {
  constructor(galaxyData) {
    this.galaxyData = galaxyData;
    this.hyperspaceLanes = galaxyData.hyperspace_lanes || [];
    // Cache for random same-grid fractions
    this._sameGridCache = {};
  }

  /**
   * BFS to find the cheapest route from start -> destination,
   * returns: { pathString, cost, planetArray }
   */
  findOptimalRoute(startPlanetName, destinationPlanetName, hyperdriveRating, avoidHyperspaceLanes = false) {
    const startPlanet = this.galaxyData.planets.find(p => p.name === startPlanetName);
    const destinationPlanet = this.galaxyData.planets.find(p => p.name === destinationPlanetName);
    if (!startPlanet || !destinationPlanet) return null;

    const visited = new Set();
    const queue = [{ planet: startPlanet, path: [startPlanet], cost: 0 }];

    while (queue.length > 0) {
      queue.sort((a, b) => a.cost - b.cost);
      const { planet, path, cost } = queue.shift();

      if (planet.name === destinationPlanetName) {
        // Build a readable route string
        const pathString = path.map(p => `${p.name} (${p.grid})`).join(" -> ");
        return { pathString, cost, planetArray: path };
      }

      if (!visited.has(planet.name)) {
        visited.add(planet.name);

        const neighbors = this.findNeighbors(planet, avoidHyperspaceLanes);
        neighbors.forEach(neighbor => {
          if (!visited.has(neighbor.name)) {
            let dist = this._computeGridDistance(planet, neighbor);
            // If same-grid => random fraction
            if (dist === 0) {
              dist = this._getSameGridFraction(planet, neighbor);
            }
            const travelTime = this.calculateTravelTime(dist, hyperdriveRating, planet, neighbor);
            queue.push({
              planet: neighbor,
              path: [...path, neighbor],
              cost: cost + travelTime
            });
          }
        });
      }
    }
    return null;
  }

  /**
   * Find neighbors: lane + adjacency if optimal, adjacency only if non-optimal
   */
  findNeighbors(planet, avoidHyperspaceLanes = false) {
    const neighbors = [];
    const [x1, y1] = this.convertGridToCoordinates(planet.grid);

    if (avoidHyperspaceLanes) {
      // Non-optimal => adjacency only
      this.galaxyData.planets.forEach(otherPlanet => {
        if (otherPlanet.name !== planet.name) {
          const [x2, y2] = this.convertGridToCoordinates(otherPlanet.grid);
          const isAdjacent = Math.abs(x2 - x1) <= 1 && Math.abs(y2 - y1) <= 1;
          if (isAdjacent) neighbors.push(otherPlanet);
        }
      });
      return neighbors;
    }

    // Otherwise, lane + adjacency
    const lane = this.hyperspaceLanes.find(l => l.route.includes(planet.grid));
    if (lane) {
      const idx = lane.route.indexOf(planet.grid);
      if (idx > 0) {
        const prevGrid = lane.route[idx - 1];
        const prevPlanet = this.galaxyData.planets.find(p => p.grid === prevGrid);
        if (prevPlanet) neighbors.push(prevPlanet);
      }
      if (idx < lane.route.length - 1) {
        const nextGrid = lane.route[idx + 1];
        const nextPlanet = this.galaxyData.planets.find(p => p.grid === nextGrid);
        if (nextPlanet) neighbors.push(nextPlanet);
      }
    }
    // adjacency fallback
    this.galaxyData.planets.forEach(otherPlanet => {
      if (otherPlanet.name !== planet.name) {
        const [x2, y2] = this.convertGridToCoordinates(otherPlanet.grid);
        const isAdjacent = Math.abs(x2 - x1) <= 1 && Math.abs(y2 - y1) <= 1;
        if (isAdjacent) neighbors.push(otherPlanet);
      }
    });
    return neighbors;
  }

  /**
   * BFS cost function = distance * 3 * hyperdrive
   * Lane bonus if both in-lane
   */
  calculateTravelTime(distanceInGrids, hyperdriveRating, startPlanet, endPlanet) {
    let time = distanceInGrids * 3 * hyperdriveRating;
    // If user is using an optimal route (not avoiding lanes),
    // BFS won't exclude lanes, so if both planets are in-lane, we apply speed
    if (startPlanet.hyperspace_lane_in_grid && endPlanet.hyperspace_lane_in_grid) {
      time *= 0.7;
      if (startPlanet.hyperspace_lane_connects_to_name === endPlanet.name) {
        time *= 0.8;
      }
    }
    return time;
  }

  convertGridToCoordinates(grid) {
    const letter = grid[0].toUpperCase();
    const number = parseInt(grid.slice(1), 10);
    const x = letter.charCodeAt(0) - 65; // A=0, B=1, ...
    const y = number - 1;
    return [x, y];
  }

  _computeGridDistance(p1, p2) {
    const [x1, y1] = this.convertGridToCoordinates(p1.grid);
    const [x2, y2] = this.convertGridToCoordinates(p2.grid);
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  _getSameGridFraction(planetA, planetB) {
    const key = [planetA.name, planetB.name].sort().join("--");
    if (!this._sameGridCache[key]) {
      this._sameGridCache[key] = 0.2 + Math.random() * 0.6; // 0.2..0.8
    }
    return this._sameGridCache[key];
  }

  // Return how many difficulty dice the destination region imposes
  static getRegionDifficulty(region) {
    switch (region) {
      case "Deep Core Worlds": return 3;
      case "Core Worlds": return 2;
      case "Colonies": return 2;
      case "Inner Rim": return 1;
      case "Expansion Region": return 1;
      case "Mid Rim": return 2;
      case "Outer Rim": return 2;
      case "Unknown Regions": return 3;
      default: return 1;
    }
  }
}


// Primary app for the astrogation UI
class GalaxyTravelApp extends Application {
  constructor(galaxyData) {
    super();
    this.galaxyData = galaxyData;
    this.pathfinder = new Pathfinder(galaxyData);
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "galaxy-travel-app",
      title: "Astrogation Computer",
      template: "modules/star-wars-galaxy-travel/templates/galaxy-travel.html",
      width: 600,
      height: 500,
      resizable: true
    });
  }

  /**
   * Override this to add a "Share" button in the window header.
   */
  _getHeaderButtons() {
    const buttons = super._getHeaderButtons();

    // Insert our custom "Share" button
    buttons.unshift({
      label: "Share",
      class: "share-travel",
      icon: "fas fa-users",
      onclick: () => {
        // Emit a socket message so all connected clients open the app
        game.socket.emit("module.star-wars-galaxy-travel", {
          action: "openAstrogationApp"
        });
      }
    });

    return buttons;
  }

  getData() {
    return {
      planets: this.galaxyData.planets || []
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    // 1) "Calculate Travel" button
    html.find("#calculate-travel").click((event) => {
      event.preventDefault();

      const startPlanetInput = html.find("#start-planet").val().trim();
      const destinationPlanetInput = html.find("#destination-planet").val().trim();
      const hyperdriveRating = parseFloat(html.find("#ship-speed").val());

      // If #nav-computer is checked => we have Nav Computer => no penalty
      // If it is UNchecked => no Nav Computer => apply penalty
      const modifiers = {
        navComputer: html.find("#nav-computer").is(":checked"),
        quickCalc: html.find("#quick-calc").is(":checked"),
        lightDamage: html.find("#light-damage").is(":checked"),
        heavyDamage: html.find("#heavy-damage").is(":checked"),
        hyperdriveMalfunction: html.find("#hyperdrive-malfunction").is(":checked"),
        nonOptimalRoute: html.find("#non-optimal-route").is(":checked"),
        extraTime: html.find("#extra-time").is(":checked")
      };

      if (!startPlanetInput || !destinationPlanetInput || !hyperdriveRating) {
        ui.notifications.error("Please fill out all fields (start, destination, hyperdrive).");
        return;
      }

      const startPlanet = this.galaxyData.planets.find(
        (p) => p.name.toLowerCase() === startPlanetInput.toLowerCase()
      );
      const destinationPlanet = this.galaxyData.planets.find(
        (p) => p.name.toLowerCase() === destinationPlanetInput.toLowerCase()
      );

      if (!startPlanet || !destinationPlanet) {
        ui.notifications.error("Invalid planet names. Check your spelling.");
        return;
      }

      // 2) BFS route
      const route = this.pathfinder.findOptimalRoute(
        startPlanet.name,
        destinationPlanet.name,
        hyperdriveRating,
        modifiers.nonOptimalRoute
      );
      if (!route) {
        html.find("#travel-result").text("No valid route found between the selected planets.");
        return;
      }

      // 3) Final calculations
      const result = this.calculateTravel(route.planetArray, hyperdriveRating, modifiers);
      if (!result) {
        ui.notifications.warn("Travel calculation returned null unexpectedly.");
        return;
      }

      // 4) Display results in the UI
      html.find("#travel-time").text(result.time);
      html.find("#travel-distance").text(result.distance);
      html.find("#astrogation-roll").text(result.difficultyRoll);
      html.find("#calculation-time").text(result.calculationTime);
      html.find("#fuel-consumption").text(result.fuelConsumption);
      html.find("#optimal-route").text(route.pathString);

      // 5) Post to chat for a simple "history"
      this._postTravelResultToChat(route, result);
    });
  }

  /**
   * Summation approach: BFS route => total distance => parsecs => difficulty & time
   */
  calculateTravel(routeArray, hyperdriveRating, modifiers) {
    if (!routeArray || routeArray.length < 1) return null;

    const startPlanet = routeArray[0];
    const destinationPlanet = routeArray[routeArray.length - 1];

    // 1) Sum BFS grid distance
    let totalGridDistance = 0;
    for (let i = 0; i < routeArray.length - 1; i++) {
      const p1 = routeArray[i];
      const p2 = routeArray[i + 1];
      let dist = this.pathfinder._computeGridDistance(p1, p2);
      if (dist === 0) {
        dist = this.pathfinder._getSameGridFraction(p1, p2);
      }
      totalGridDistance += dist;
    }

    // 2) Convert to parsecs
    const parsecDistance = totalGridDistance * 1500;

    // 3) Base difficulty from region
    let dd = Pathfinder.getRegionDifficulty(destinationPlanet.region);
    let cd = 0;

    // 4) Distance-based difficulty
    const integerDistance = Math.round(totalGridDistance);
    let extraDD = 0;
    let extraBD = 0;
    let extraSBD = 0;

    // For every 4 grids => +1 dd
    const setsOfFour = Math.floor(integerDistance / 4);
    extraDD += setsOfFour;

    // If same-grid => +2bd, -1dd
    // else if <=3 => +1bd
    if (integerDistance === 0) {
      extraBD += 2;
      dd = Math.max(dd - 1, 0); 
    } else if (integerDistance <= 3) {
      extraBD += 1;
    }

    // 5) Route-based modifiers (optimal vs non-optimal)
    if (!modifiers.nonOptimalRoute) {
      // OPTIMAL => +2bd
      extraBD += 2;
      // Region extras
      switch (destinationPlanet.region) {
        case "Core Worlds":
        case "Colonies":
        case "Inner Rim":
          extraBD += 1;
          break;
        case "Outer Rim":
          extraSBD += 1;
          break;
        case "Unknown Regions":
          extraSBD += 2;
          break;
      }
    } else {
      // NON-OPTIMAL => region-based sbd
      switch (destinationPlanet.region) {
        case "Expansion Region":
        case "Mid Rim":
          extraSBD += 1;
          break;
        case "Outer Rim":
          extraSBD += 2;
          break;
        case "Unknown Regions":
          extraSBD += 3;
          break;
      }
      // Also upgrade difficulty by 1
      const upgraded = this._upgradeDifficulty(dd, cd);
      dd = upgraded.dd;
      cd = upgraded.cd;
    }

    // Tally up extraDD
    dd += extraDD;

    // Now track final boost & setback
    let boostDice = extraBD;
    let setbackDice = extraSBD;

    // 6) "Take Additional Time" => +5 calc time, -1dd min 1 total die
    let calculationTime = this._baseCalculationTime(totalGridDistance, modifiers);
    if (modifiers.extraTime) {
      calculationTime += 5; // +5
      const newDice = this._reduceOneDifficulty(dd, cd);
      dd = newDice.dd;
      cd = newDice.cd;
      // min 1 total die
      if (dd + cd < 1) dd = 1;
    }

    // 7) Ship damage
    if (modifiers.lightDamage) {
      setbackDice += 1;
    }
    if (modifiers.heavyDamage) {
      setbackDice += 2;
    }

    // 8) "No Nav Computer" => user UNCHECKS #nav-computer => apply 2 upgrades
    if (!modifiers.navComputer) {
      for (let i = 0; i < 2; i++) {
        const upgraded = this._upgradeDifficulty(dd, cd);
        dd = upgraded.dd;
        cd = upgraded.cd;
      }
    }

    // 9) Quick Calc => -3 calcTime, +1 upgrade
    if (modifiers.quickCalc) {
      calculationTime = Math.max(calculationTime - 3, 1);
      const upgraded = this._upgradeDifficulty(dd, cd);
      dd = upgraded.dd;
      cd = upgraded.cd;
    }

    // 10) Hyperdrive Malfunction => +1 upgrade
    if (modifiers.hyperdriveMalfunction) {
      const upgraded = this._upgradeDifficulty(dd, cd);
      dd = upgraded.dd;
      cd = upgraded.cd;
    }

    // Final dice string
    const difficultyRoll = `${dd}dd, ${cd}cd, ${boostDice}bd, ${setbackDice}sbd`;

    // Fuel consumption: 1 + ceil(2 * totalGridDistance)
    const fuelConsumption = 1 + Math.ceil(totalGridDistance * 2);

    // Final travel time in hours
    let travelTime = parsecDistance * (3 / 1500) * hyperdriveRating;
    // If using optimal route and both start/dest are in-lane, reduce
    if (!modifiers.nonOptimalRoute &&
      startPlanet.hyperspace_lane_in_grid &&
      destinationPlanet.hyperspace_lane_in_grid) {
      travelTime *= 0.7;
      if (startPlanet.hyperspace_lane_connects_to_name === destinationPlanet.name) {
        travelTime *= 0.8;
      }
    }

    return {
      time: travelTime.toFixed(2),
      distance: parsecDistance.toFixed(2),
      difficultyRoll,
      calculationTime,
      fuelConsumption
    };
  }

  /**
   * Base calculation time logic (simplified).
   */
  _baseCalculationTime(totalGridDistance, modifiers) {
    let calcTime = 1;
    if (totalGridDistance > 0) {
      calcTime = 2;
    }
    // +1 round per 2 grids
    calcTime += Math.ceil(totalGridDistance / 2);
    // If non-optimal => x1.5
    if (modifiers.nonOptimalRoute) {
      calcTime = Math.ceil(calcTime * 1.5);
    }
    return calcTime;
  }

  /**
   * If there's a cd, degrade it to dd, else reduce dd. 
   */
  _reduceOneDifficulty(dd, cd) {
    if (cd > 0) {
      return { dd: dd + 1, cd: cd - 1 };
    }
    if (dd > 0) {
      return { dd: dd - 1, cd };
    }
    return { dd, cd };
  }

  /**
   * Upgrade => turn 1 dd->1 cd, or if no dd, add 1 dd
   */
  _upgradeDifficulty(dd, cd) {
    if (dd > 0) {
      return { dd: dd - 1, cd: cd + 1 };
    }
    // else add a new dd if we have no dd left
    return { dd: 1, cd };
  }

  /**
   * Post the final jump to chat for a simple shared history.
   */
  _postTravelResultToChat(route, result) {
    const content = `
      <h2>Astrogation Jump</h2>
      <p><strong>Route:</strong> ${route.pathString}</p>
      <p><strong>Time:</strong> ${result.time} hours</p>
      <p><strong>Distance:</strong> ${result.distance} parsecs</p>
      <p><strong>Difficulty:</strong> ${result.difficultyRoll}</p>
      <p><strong>Calculation Rounds:</strong> ${result.calculationTime}</p>
      <p><strong>Fuel Consumption:</strong> ${result.fuelConsumption}</p>
    `;
    ChatMessage.create({
      user: game.userId,
      type: CONST.CHAT_MESSAGE_STYLES.OTHER,
      speaker: { alias: "Astrogation Computer" },
      content
    });
  }
}

// Expose so macros can do new GalaxyTravelApp(...).render(true)
window.GalaxyTravelApp = GalaxyTravelApp;
