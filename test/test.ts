import {assert} from "chai";
import * as lanke from "..";


describe("Game", function() {

    it('should be illegal create 1x1 board', function() {
        assert.throw(()=> {
            lanke.ChineseRule.prepareGameBoard(1,1).applyPresetStone({x:0, y:0}, lanke.Player.BLACK).build();
        }, lanke.IllegalBoardSettingError);
        assert.throw(()=> {
            lanke.ChineseRule.prepareGameBoard(1, 1).build().applyMove({x: 0, y:0});
        }, lanke.IllegalBoardSettingError);

    });


    it('should returns right next move number', function(){
        let blackMoveFirstGame = lanke.ChineseRule.prepareGameBoard(2,2).setFirstMovePlayer(lanke.Player.BLACK).build();
        assert(blackMoveFirstGame.getNextMoveNumber() == 1);
        blackMoveFirstGame.applyMove({x:0, y: 0});
        assert(blackMoveFirstGame.getNextMoveNumber() == 2);

        let whiteMoveFirstGame = lanke.ChineseRule.prepareGameBoard(2,2).setFirstMovePlayer(lanke.Player.WHITE).build();
        assert(whiteMoveFirstGame.getNextMoveNumber() == 1);
        whiteMoveFirstGame.applyMove({x:0, y: 0});
        assert(whiteMoveFirstGame.getNextMoveNumber() == 2);
    });

    it('should returns right next move player', function() {
        let blackMoveFirstGame = lanke.ChineseRule.prepareGameBoard(2,2).setFirstMovePlayer(lanke.Player.BLACK).build();
        assert(blackMoveFirstGame.getNextMovePlayer() == lanke.Player.BLACK);
        blackMoveFirstGame.applyMove({x:0,y:0});
        assert(blackMoveFirstGame.getNextMovePlayer() == lanke.Player.WHITE);
        let whiteMoveFirstGame = lanke.ChineseRule.prepareGameBoard(2,2).setFirstMovePlayer(lanke.Player.WHITE).build();
        assert(whiteMoveFirstGame.getNextMovePlayer() == lanke.Player.WHITE);
        whiteMoveFirstGame.applyMove({x:0, y:0});
        assert(whiteMoveFirstGame.getNextMovePlayer() == lanke.Player.BLACK);

    });

    it('should be should be illegal to setup board with preset stone in same location', function() {
        assert.throw(()=> {
            lanke.ChineseRule.prepareGameBoard(2,2)
                .applyPresetStone({x: 0, y: 0}, lanke.Player.BLACK)
                .applyPresetStone({x: 0, y: 0}, lanke.Player.BLACK)
                .build();


        });
        assert.throw(()=> {
            lanke.ChineseRule.prepareGameBoard(2,2)
                .applyPresetStone({x: 0, y: 0}, lanke.Player.WHITE)
                .applyPresetStone({x: 0, y: 0}, lanke.Player.WHITE)
                .build();
        });

        assert.throw(()=> {
            lanke.ChineseRule.prepareGameBoard(2,2)
                .applyPresetStone({x: 0, y: 0}, lanke.Player.BLACK)
                .applyPresetStone({x: 0, y: 0}, lanke.Player.WHITE)
                .build();
        });

        assert.throw(()=> {
            lanke.ChineseRule.prepareGameBoard(2,2)
                .applyPresetStone({x: 0, y: 0}, lanke.Player.WHITE)
                .applyPresetStone({x: 0, y: 0}, lanke.Player.BLACK)
                .build();
        });

    });

    it('should be illegal to setup board with preset stone in same location', function() {
        assert.throw(()=> {
            lanke.ChineseRule.prepareGameBoard(2,2)
                .applyPresetStone({x: 0, y: 0}, lanke.Player.BLACK)
                .applyPresetStone({x: 0, y: 0}, lanke.Player.BLACK)
                .build();


        }, lanke.LocationOccupiedError);
        assert.throw(()=> {
            lanke.ChineseRule.prepareGameBoard(2,2)
                .applyPresetStone({x: 0, y: 0}, lanke.Player.WHITE)
                .applyPresetStone({x: 0, y: 0}, lanke.Player.WHITE)
                .build();
        }, lanke.LocationOccupiedError);

        assert.throw(()=> {
            lanke.ChineseRule.prepareGameBoard(2,2)
                .applyPresetStone({x: 0, y: 0}, lanke.Player.BLACK)
                .applyPresetStone({x: 0, y: 0}, lanke.Player.WHITE)
                .build();
        }, lanke.LocationOccupiedError);

        assert.throw(()=> {
            lanke.ChineseRule.prepareGameBoard(2,2)
                .applyPresetStone({x: 0, y: 0}, lanke.Player.WHITE)
                .applyPresetStone({x: 0, y: 0}, lanke.Player.BLACK)
                .build();
        }, lanke.LocationOccupiedError);

    });

    it('should be illegal to place stone in location has no liberty', function() {
        assert.throw(() => {
            lanke.ChineseRule.prepareGameBoard(2,2)
                .applyPresetStone({x: 1, y: 0}, lanke.Player.WHITE)
                .applyPresetStone({x: 0, y: 1}, lanke.Player.WHITE)
                .applyPresetStone({x: 1, y: 1}, lanke.Player.BLACK)
                .build();
        }, lanke.SuicideNotAllowedError)
    });

    it('should capture stone group with no liberty', function() {
        let game = lanke.ChineseRule.prepareGameBoard(2,2)
            .applyPresetStone({x:0, y: 0}, lanke.Player.BLACK)
            .applyPresetStone({x:1, y: 0}, lanke.Player.WHITE)
            .setFirstMovePlayer(lanke.Player.WHITE).build();

        game.applyMove({x: 0, y: 1});
        assert(game.getStateOfLocation({x: 0, y: 0}).stone == null);

        game = lanke.ChineseRule.prepareGameBoard(2, 2)
            .applyPresetStone({x: 0, y: 0}, lanke.Player.BLACK)
            .applyPresetStone({x: 1, y: 0}, lanke.Player.BLACK)
            .applyPresetStone({x:1, y: 1}, lanke.Player.WHITE)
            .setFirstMovePlayer(lanke.Player.WHITE)
            .build();
        game.applyMove({x:0, y: 1});
        assert(game.getStateOfLocation({x: 0, y: 0}).stone == null);
        assert(game.getStateOfLocation({x: 1, y: 0}).stone == null);

        assert(game.getStateOfLocation({x: 1, y: 1}).stone.player == lanke.Player.WHITE);
        assert(game.getStateOfLocation({x: 0, y: 1}).stone.player == lanke.Player.WHITE);

    })


});