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

    it('should be illegal to setup preset stone in location has no liberty', function() {
        assert.throw(() => {
            lanke.ChineseRule.prepareGameBoard(2,2)
                .applyPresetStone({x: 1, y: 0}, lanke.Player.WHITE)
                .applyPresetStone({x: 0, y: 1}, lanke.Player.WHITE)
                .applyPresetStone({x: 1, y: 1}, lanke.Player.BLACK)
                .build();
        }, lanke.SuicideNotAllowedError)
    })


});