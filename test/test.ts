import {assert} from "chai";
import * as lanke from "..";


describe("Game", function() {

    it('should be illegal to place stone on 1x1 board', function() {
        assert.throw(()=> {
            lanke.ChineseRule.prepareGameBoard(1, 1).build().applyMove({x: 0, y:0});
        })

    })
});