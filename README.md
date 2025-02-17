# Galaxy Travel Astrogation Computer
Astrogation Computer Module for use with Star Wars FFG system in Foundry VTT

Intended for use in Foundry VTT.  Designed for use with the Star Wars FFG System, though could be system agnostic with modifications. 

Created with specific map: All locations and coordinates are mapped to this map.
Map created by https://www.deviantart.com/86botond/art/Star-Wars-Map-of-the-Galaxy-1147391245

Astrogation Computer was created with the following custom rules for a Star Wars RPG (Fantasy Flight Games) game but could adopted to any system.

![image](https://github.com/user-attachments/assets/29fbdb3d-f171-46ac-87e9-cec97218d512)

# Download
* You can DL the latest reease here: https://github.com/grumpk1n/Galaxy-Travel/releases/download/1.0.3/module.json

## How to Use
1. Select which version of ruleset you want to use from Game Configuration Settings (Modified is default)
2.  Open via Scene Token Controls (Rocket Ship Icon)
Note: Click out o Scene Controls and then back into scene controls to display the Rocket ship (Known Issue)
3. You can also share the jump calculation with others via "Share" button in header.
4. Enter your Start/Destination Planet (type or dropdown search)
5. Enter your Ship Hyperdrive Rating
6. Select your Silhouette (RAW only)
7. Select your modifiers (Settings Dependent)
8. When ready click "Calculate Travel" and you're off.  Results should output to chat as well, for a record.

<details>
  <summary>Current Logic Explanation/Definition (Modified - Module Default):</summary>

### Difficulty by Destination:
* Difficulty for astrogation is defined as:
* Destination is in the Deep Core Worlds = 3 dd
* Destination is in the Core Worlds = 2 dd
* Destination is in the Colonies = 2 dd
* Destination is in the Inner Rim = 1 dd
* Destination is in the Expansion Region = 1 dd
* Destination is in the Mid Rim = 2 dd
* Destination is in the Outer Rim = 2 dd
* Destination is in Unknown Regions = 3 dd

### Difficulty modifier for Jump Distance:
* For every 4 grid hexes travelled = +1dd
* For every 4 grid hexes travelled = +1sbd
* Travelling 3 grids or less, including travel in the same grid (using both optimal and non optimal routes) = +1bd
* Same Grid Travel (using both optimal and non-optimal routes) = +2bd

### Modifiers (Selected):
* Missing Navigation Computer or Astromech Droid = Upgrade dd x 2
* Emergency "Quick" Calculation (- 3 rounds calculation time) = Upgrade dd x 1
* Ship is Lightly Damaged = +1 sbd
* Ship is Heavily Damaged = +2 sbd
* Hyperdrive Malfunctioning or Damaged = Upgrade dd x 1
* Take Additional Time to Calculate (+ 5 rounds calculation time) = -1 dd

### Modifiers (Encoded):
* If Using Optimal Route/Hyperspace Lanes (any destination) = +2bd
* Travelling to a Core World (using Optimal Route) = +1bd
* Travelling to a Colonies World (using Optimal Route) = +1bd
* Travelling to a Inner Rim World (using Optimal Route) = +1bd
* Travelling to a Expansion Region World (Not Using Optimal Route) = +1sbd
* Travelling to a Mid Rim Region World (Not using Optimal Route) = +1sbd
* Travelling to a Outer Rim Region World (Not using Optimal Route) = +2sbd
* Travelling to a Outer Rim Region World (using optimal route) = +1sbd
* Travelling to a Unknown Regions World (Not using optimal route) = +3sbd
* Travelling to a Unknown Regions World (using optimal route) = +2sbd

### Traveling in same Grid:
* Calculate random 20-80% parsec size if travelling in the same grid
* Calculate approriate time for journey based off the result of the distance above. 

### Time to Calculate the Jump:
* Start and End in same system - 1 round(s)
* Start and End in the same Sector - 2 round(s)
* Start and End in the same Region - 4 round(s)

### Modifiers to Calculation time:
* Start and End in a different region - +1 round per region
* Start and End in different grid - +1 round per 2 grids travelled

### Viewing Options:
* Make the window viewable by all players. App Window Share Button
* Output results to chat

</details>

<details>
  <summary>Current Logic Explanation/Definition (RAW - Rules as Written):</summary>

### Base Difficulty for astrogation is defined by Computing Method (see Below):

### Computing Method (Dropdown - Pick One):
* Player Skill Only (No Nav Computer or Astromech Droid) = 4 dd
* Navigation Computer = 1 dd
* Astromech Droid = 0 dd

### Modifiers (Selected):
* Damaged Navigation Computer = +3 dd
* Astromech Droid (w/destination not pre-programmed) = +3 dd
* Emergency "Quick" Calculation = +1 dd
* Ship is Lightly Damaged = +1 dd
* Ship is Heavily Damaged = +2 dd
* Outdated/Corrupt/Counterfit Nav Data = +1dd

### Traveling Time: 
* In same Grid = Calculate random 20-80% parsec size if travelling in the same grid
* In Same Sector (Separate Grid) = random 10 - 24 hours
* In Same Region (Separate Grid) = Random 10 - 72 hours
* Between Regions = 72 - 168 hours
* Across the Galaxy (10+ Grids) = 168 - 504 hours

### Time to Calculate the Jump
* Ship Sihoutte Size x2 (Field to Enter Ship Silhoutte Size)
  </details>
