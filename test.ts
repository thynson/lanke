import {ChineseRule, Game, Player} from './index';

const gameState = ChineseRule.prepareGameBoard(19,19).build();
console.log(Player[gameState.getNextMovePlayer()]);

gameState.applyMove(4, 16);
console.log(Player[gameState.getNextMovePlayer()]);
gameState.applyMove(16, 4);
