import Phaser from "phaser";
import Preload from "./states/Preload";
import Menu from "./states/Menu";
import Game from "./states/Game";

const config = {
    type: Phaser.AUTO,
    width: 640,
    height: 960,
    parent: "game",
    backgroundColor: "#000000",
    scene: [Preload, Menu, Game],
    physics: {
        default: "arcade",
        arcade: { debug: false }
    }
};

new Phaser.Game(config);
