# Front part of the PS8 project

This folder should contain all the static files that could be returned by the file server to clients.

By default, the HTTP server used in `services/files/logic.js` will start checking for files inside this repo.
This means that when a client targets `projectName.ps8.academy/folder1/file1.png`*, 
the HTTP server will try to find `file1.png` inside `front/folder1`.

You are free to change this behavior, and to manage the folders and files inside this project however you like, 
but remember to update the `services/files/logic.js` file accordingly.

*Note: At the start of the project, you don't have a `ps8.academy` URL, so you will have to use localhost.

# Front-end Architecture (served by files service)

## Pages and navigation strategy

The front-end is organized as a multi-view SPA-like structure (different route-based pages, shared runtime/components).

Main pages implemented:

- **Authentication pages**
    - Login page
    - Signup page
    - Forgot password page
- **Home page**
    - The landing page for any user. He will have access to certain buttons or not depending on if he's connected or not.
- **Profile pages**
    - Personal profile page (owner view with editable/personal actions)
    - Public profile page (other player view)
- **Waiting room page**
    - Intermediate page before online multiplayer starts.
- **Game page**
    - Hosts the live game board and in-game interactions.

Some features are intentionally integrated as contextual UI instead of dedicated pages:

- End-game feedback is displayed through a game-over modal.
- Forfeit confirmation is displayed through a forfeit modal.
- Chat is embedded as reusable components depending on context.

## Components used


- **Game domain components**
    - `game-board`: visual board and click/interaction layer
    - `game-player-inventory`: player piece inventory rendering
    - `game-action-timer`: turn timer visualization
    - `game-turn-indicator`: current turn feedback
    - `game-rotation-indicator`: directional/rotation support UI
    - `game-over-modal` and `game-forfeit-modal`: end/exit workflows
- **Shared components**
    - `app-modal`: generic modal primitive reused by feature-specific modals
- **Chat components**
    - `chat-box`: real-time conversation UI container

Components are responsible for rendering a specific part of the UI, handling local interactions (clicks, animations, etc.), and sending user intents back to the page controllers instead of managing the overall application flow. And of course we used components whenever we needed something to be reusable.

## Components that could have been extracted

A few elements are still page-coupled and could be extracted into standalone shared components :

- Repeated profile info blocks and statistic cards.
- Friend/challenge list rows used in profile page and in the friends tab.
- Navigation/header buttons.


# Android Front-end :

## Setup

- Create `android/` folder with :
    ```sh
    npx cap add android
    ```

- Build/actualise mobile app with :
    ```sh
    npm run build
    ```
