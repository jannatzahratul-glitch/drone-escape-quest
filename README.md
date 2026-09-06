# Labyrinth Escape

Build a mobile-first 3D maze escape game prototype called “Maze Escape”.

IMPORTANT:

This is the FOUNDATION version of the game. Do not add AdMob, payments, authentication, leaderboards, or Play Store packaging yet. First make the core 3D gameplay fully playable and stable.

1. CORE GAME CONCEPT

The player controls a person trapped inside a large maze.

The entire game should feel like a realistic drone camera looking down at a physical maze from above.

The player must navigate through the maze and find the ONE correct exit.

Every level contains multiple visible gates, but only ONE gate is the real exit.

The other gates are fake exits/dead ends.

The game should feel like:

* strategic maze solving

* exploration

* observation

* mild suspense

* gradually increasing difficulty

Do NOT make it a flat 2D maze.

Do NOT use a static maze image.

The maze must be rendered as a real-time 3D scene.

2. TECHNOLOGY

Use:

* React

* TypeScript

* Three.js / WebGL

* React Three Fiber if appropriate

* a clean component-based architecture

Keep the 3D game engine separated from the UI so future features can be added without rewriting the game.

The application must run smoothly in modern mobile browsers.

3. 3D VISUAL STYLE

Create a cinematic realistic top-down drone-view environment.

The maze should look like a physical stone labyrinth.

Visual elements:

* stone walls

* stone floor

* realistic wall height

* subtle weathering

* warm torches/lights

* realistic shadows

* ambient lighting

* slight atmospheric fog

* dark cinematic environment

* visible player character

* visible gates

* depth and perspective

The camera should be positioned high above the maze at an angle, similar to a drone observing the maze.

The camera should smoothly follow the player while keeping the maze readable.

Do not make the camera too close to the player.

The player and important gates must remain clearly visible on mobile screens.

4. CAMERA

Create a dedicated 3D drone camera system.

Requirements:

* high-angle top-down perspective

* slight perspective rather than completely flat orthographic view

* smooth camera follow

* camera remains above the maze

* camera should not enter walls

* smooth movement when the player moves

* maintain enough distance to understand the maze layout

Add a simple camera system that can later support:

* zoom

* camera rotation

* cinematic camera effects

For the first version, prioritize stability and readability.

5. PLAYER

Create a simple 3D human character.

The character should:

* stand inside the maze

* move smoothly

* have basic walking animation or visually convincing movement

* collide with maze walls

* never walk through walls

* start at a designated starting position

For the prototype, a simple low-poly or basic 3D character is acceptable.

Do not spend excessive development time on character realism yet.

6. MOBILE CONTROLS

The game must be designed primarily for smartphones.

Add a virtual joystick in the bottom-left corner.

The joystick should control:

* forward

* backward

* left

* right

The controls should feel smooth and responsive.

Also make the game compatible with keyboard controls for desktop testing:

* WASD

* Arrow keys

Do not allow accidental page scrolling while playing.

7. MAZE SYSTEM

Create a procedural maze system.

The maze should NOT be a single hard-coded image.

Create a reusable maze-generation system that can generate different maze layouts.

The system should support:

* maze width

* maze height

* wall density

* dead ends

* starting position

* exit positions

* difficulty parameters

The maze must always be solvable.

8. LEVEL 1

Create Level 1 as the first playable level.

Level 1 should already be somewhat challenging.

Do NOT make Level 1 extremely easy.

Level 1:

* small/medium maze

* 2 visible gates

* exactly 1 correct exit

* 1 fake gate

* several dead-end paths

* enough maze complexity to make the player think

* no impossible sections

The player should understand the basic game within the first level.

When the player reaches the correct exit:

* show a short success animation

* display “LEVEL COMPLETE”

* show the player’s completion time

* provide a “NEXT LEVEL” button

If the player reaches the fake gate:

* do not immediately end the game

* clearly indicate that it is a fake/dead-end gate

* allow the player to return into the maze

9. FUTURE LEVEL ARCHITECTURE

Create the level system so more levels can easily be added later.

Use configurable difficulty parameters.

Example future progression:

Level 1:

2 gates

Level 2:

2 gates, easier maze

Level 3:

3 gates

Level 4:

3 gates, more dead ends

Level 5:

4 gates

Level 6:

3 gates, easier recovery level

Level 7:

4 gates + more confusing paths

Level 8:

4 gates + longer maze

Level 9:

5 gates

Level 10:

6 gates + special challenge

Do not hard-code this entire progression yet, but create the architecture so it can be implemented later.

IMPORTANT:

Difficulty should NOT simply increase continuously.

The game should have a rhythm:

Difficult → Easy → Medium → Difficult → Easy → Very Difficult

This makes the game more addictive and prevents player fatigue.

10. GATES

Create 3D gate objects.

Each gate should:

* be clearly visible

* look different from ordinary maze walls

* have an entrance/opening

* be interactable

Every level should have:

* exactly ONE real exit

* one or more fake gates

The correct exit should NOT be visually obvious.

Do not put a green “correct” indicator on the real gate during normal gameplay.

The player must discover the correct exit by exploring.

11. GAME UI

Create a clean cinematic HUD.

Top-left:

* Pause button

* Level number

Top-right:

* Timer

Bottom-left:

* Virtual joystick

Bottom-right:

* Hint button placeholder

Center:

* no unnecessary UI

When the player completes the level:

Show a polished overlay:

LEVEL COMPLETE

Time: XX:XX

[ NEXT LEVEL ]

The UI should look premium and modern, not like a basic HTML website.

Use rounded panels, subtle transparency, clean typography and cinematic spacing.

12. START SCREEN

Create a simple start screen.

Title:

MAZE ESCAPE

Subtitle:

THE ONE WAY OUT

Button:

PLAY

Small text:

“Find the only way out.”

The background should show a blurred/cinematic 3D maze environment if technically practical.

13. PAUSE MENU

Add a pause button.

Pause screen:

PAUSED

[ RESUME ]

[ RESTART LEVEL ]

[ MAIN MENU ]

14. GAME STATES

Implement clean game states:

* Main Menu

* Level Loading

* Playing

* Paused

* Level Complete

The state system should be modular so future states such as:

* Game Over

* Revive

* Rewards

* Shop

* Daily Challenge

can be added later.

15. PERFORMANCE

This game is intended for mobile devices.

Prioritize:

* smooth rendering

* reasonable polygon count

* efficient lighting

* optimized shadows

* minimal unnecessary objects

* responsive touch controls

Do not create extremely heavy 3D assets for the prototype.

16. CODE QUALITY

Use a clean project structure.

Separate:

* UI components

* 3D scene

* player controller

* camera controller

* maze generator

* gate system

* level manager

* game state manager

* utilities

Use reusable components.

Do not put the entire game inside one large React component.

Add clear comments around the maze generation and gameplay logic.

17. IMPORTANT FUTURE REQUIREMENTS

Design the architecture so we can later add:

* 100+ levels

* different maze themes

* clues

* hints

* coins

* rewards

* player skins

* sound effects

* background music

* vibration/haptic feedback

* daily challenges

* time attack mode

* revive system

* AdMob

* Android build

* Google Play Store release

Do NOT implement these features yet.

18. FINAL REQUIREMENT

Before considering this task complete, make sure the following works:

1. Main menu opens.

2. PLAY starts Level 1.

3. 3D maze loads.

4. Drone camera works.

5. Player can move using mobile joystick.

6. Player collides with walls.

7. Two gates are visible.

8. Exactly one gate is configured as the real exit.

9. Fake gate does not complete the level.

10. Real exit completes the level.

11. Timer works.

12. Pause works.

13. Restart works.

14. Level Complete screen works.

15. NEXT LEVEL architecture is ready.

16. The game works responsively on mobile and desktop.

After implementing, test the complete gameplay flow and fix any runtime errors, broken controls, collision issues, or rendering problems.

Do not add unrelated features.

The priority is:

PLAYABLE 3D GAME > BEAUTIFUL UI > EXTRA FEATURES.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://drone-escape-quest.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ba4c6e74-55fc-4c53-8936-616fbbcf6487).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
