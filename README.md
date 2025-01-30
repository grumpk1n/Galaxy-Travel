# Galaxy-Travel
Astrogation Computer Module for use in Foundry VTT

Intended for use in Foundry VTT.  System Agnostic, though it was created leveraging a very specific map (to provide coordiante locations).
Map created by https://www.deviantart.com/86botond/art/Star-Wars-Map-of-the-Galaxy-1147391245

Astrogation Computer was created with the following custom rules for a Star Wars RPG (Fantasy Flight Games) game but could adopted to any system.

![image](https://github.com/user-attachments/assets/29fbdb3d-f171-46ac-87e9-cec97218d512)

Current Logic:

Difficulty for astrogation is defined as:
Destination is in the Deep Core Worlds = 3 dd
Destination is in the Core Worlds = 2 dd
Destination is in the Colonies = 2 dd
Destination is in the Inner Rim = 1 dd
Destination is in the Expansion Region = 1 dd
Destination is in the Mid Rim = 2 dd
Destination is in the Outer Rim = 2 dd
Destination is in Unknown Regions = 3 dd

Difficulty modifier for Jump Distance:
For every 4 grid hexes travelled = +1dd
For every 4 grid hexes travelled = +1sbd
Travelling 3 grids or less, including travel in the same grid (using both optimal and non optimal routes) = +1bd
Same Grid Travel (using both optimal and non-optimal routes) = +2bd

Modifiers (Selected):
Missing Navigation Computer or Astromech Droid = Upgrade dd x 2
Emergency "Quick" Calculation (- 3 rounds calculation time) = Upgrade dd x 1
Ship is Lightly Damaged = +1 sbd
Ship is Heavily Damaged = +2 sbd
Hyperdrive Malfunctioning or Damaged = Upgrade dd x 1
Take Additional Time to Calculate (+ 5 rounds calculation time) = -1 dd

Modifiers (Encoded):
If Using Optimal Route/Hyperspace Lanes (any destination) = +2bd
Travelling to a Core World (using Optimal Route) = +1bd
Travelling to a Colonies World (using Optimal Route) = +1bd
Travelling to a Inner Rim World (using Optimal Route) = +1bd
Travelling to a Expansion Region World (Not Using Optimal Route) = +1sbd
Travelling to a Mid Rim Region World (Not using Optimal Route) = +1sbd
Travelling to a Outer Rim Region World (Not using Optimal Route) = +2sbd
Travelling to a Outer Rim Region World (using optimal route) = +1sbd
Travelling to a Unknown Regions World (Not using optimal route) = +3sbd
Travelling to a Unknown Regions World (using optimal route) = +2sbd

Traveling in same Grid:
Calculate random 20-80% parsec size if travelling in the same grid
Calculate approriate time for journey based off the result of the distance above. 

Time to Calculate the Jump:
Start and End in same system - 1 round(s)
Start and End in the same Sector - 2 round(s)
Start and End in the same Region - 4 round(s)

Modifiers to Calculation time:
Start and End in a different region - +1 round per region
Start and End in different grid - +1 round per 2 grids travelled

Dice mechanics included:
Boost Dice = Blue d6 dice denoted as "bd"
Setback Dice = Black d6 denoted as "sbd"
Challenge Dice = Red d12 dice denoted as "cd"
Upgrade Difficulty = Replace 1 dd with 1 cd.  IF there are more upgrades than difficulty dice, add 1 difficulty dice for each overage.  
Example: Upgrade dd x 1 on a difficulty 2 changes "2dd" to "1cd, 1dd".  Upgrade dd x 2 on a difficulty 1 changes "1dd" to "1cd, 1dd"

Viewing Options:
Make the window viewable by all players. App Window Share Button
Output results to chat
