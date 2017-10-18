
export enum Player {
    WHITE = 0,
    BLACK = 1
}

export interface Stone {
    readonly moveNumber: number;
    readonly player: Player;
    readonly location: Location;
    readonly x;
    readonly y;
}

export interface StoneGroup {
    readonly stones: ReadonlySet<Stone>
}

/**
 * Error class indicates that an illegal move was tried
 */
export class IllegalMoveError {
    constructor(readonly moveNumber: number,
                readonly player: Player,
                readonly location?: Location) {

    }

}

/**
 * Error class indicates that an illegal move on an occupied location was tried
 */
export class LocationOccupiedError extends IllegalMoveError {
    constructor(moveNumber: number, player: Player, readonly stone: Stone) {
        super(moveNumber, player, stone.location);
    }
}


/**
 * Error class indicates that an illegal move was tried that will result into suicide of stones
 */
export class SuicideNotAllowedError extends IllegalMoveError {
    constructor(moveNumber: number,
                player: Player,
                location: Location | null,
                readonly stoneGroupsWouldSuicide: StoneGroup[]) {
        super(moveNumber, player, location);
    }


}

/**
 * Error class indicates that an illegal move was tried that will result into
 * repeating of the game board position
 */
export class PositionRecreatedError extends IllegalMoveError {
    constructor(moveNumber: number,
                player: Player,
                location: Location | null,
                readonly repeatedPositionMoveNumber: number) {
        super(moveNumber, player, location);
    }
}


export interface Location {
    readonly x: number,
    readonly y: number
}

export interface LocationState {
    /* Whether a location was occupied by a stone */
    readonly stone?: Stone
}

// GameRule
// typical instance: Chinese Rule, Japanese Rule, AGA Rule
export interface GameRule {
    prepareGameBoard(width: number, height: number): GameStateInitializer
}

export interface GameStateInitializer {
    readonly width: number;
    readonly height: number;
    applyPresetStone(location: Location, player: Player): this
    setFirstMovePlayer(player: Player): this
    build():GameState;
}


    
export interface GameState {
    getStateOfLocation(location: Location): LocationState

    /**
     * Apply a move
     * @param {Location} location Location where the stone will placed,
     *                   if no value was passed, assuming pass
     * @returns {GameState}
     */
    applyMove(location?: Location): GameState
    getNextMoveNumber(): number;
    getNextMovePlayer(): Player
}

namespace Implement {

    export class StoneGroup implements StoneGroup {
        public readonly stones: Set<Stone> = new Set();

        constructor(readonly player: Player) {
        }

        addStone(stone: Stone) {
            this.stones.add(stone);
        }
    }

    export class Stone implements Stone {
        constructor(readonly location: Location,
            readonly moveNumber: number,
            readonly player: Player,
            readonly belongingGroup = new StoneGroup(player)) {
            this.belongingGroup.addStone(this);
        }

        get x() {return this.location == null ? null :this.location.x;}

        get y() {return this.location == null ? null :this.location.y;}

        transferToAnotherGroup(group: StoneGroup)  {
            return new Stone(this.location, this.moveNumber, this.player, group);
        }
    }

    export class LocationState {
        constructor(readonly stone: Stone | null) {}
    }

    /**
     * Generic Game Rule state suitable for all rule
     */
    abstract class GenericGameState implements GameState {
        protected moves: Array<Location|null> = [];
        protected locationPool: LocationState[];
        protected capturedStones: Set<Stone> = new Set();
        constructor(readonly _width: number,
                    readonly _height: number,
                    readonly _firstMovePlayer: Player,
                    readonly _presetMoves: Array<{location:Location, player: Player}>) {

            this.locationPool = [];
            for (let i = 0; i < _width; i++) {
                for (let j = 0; j < _height; j++) {
                    this.locationPool.push(new LocationState(null))
                }
            }

            _presetMoves.forEach((p)=>this.placePresetStone(new Stone(p.location, 0, p.player)));
        }


        protected _updateLocationState(location: Location, stone: Stone | null) {
            this.locationPool[location.x * this._width + location.y] = new LocationState(stone);
        }

        protected _hasLiberty(stoneGroup: StoneGroup):boolean {
            let hasLiberty = false;
            stoneGroup.stones.forEach((stone)=> {
                this._getStatesOfAdjacentLocation(stone.x, stone.y)
                    .forEach((ps)=> hasLiberty = hasLiberty || (ps.stone == null))
            });
            return hasLiberty;
        }

        protected _getStatesOfAdjacentLocation(x: number, y: number):LocationState[] {
            let result = [];
            if (x > 0) {
                result.push(this.getStateOfLocation({x:x - 1, y}));
            }
            if (x < this._width) {
                result.push(this.getStateOfLocation({x:x + 1, y}));
            }
            if (y > 0) {
                result.push(this.getStateOfLocation({x, y:y - 1}));
            }
            if (y < this._height) {
                result.push(this.getStateOfLocation({x, y:y + 1}));
            }
            return result;
        }


        getNextMoveNumber(): number {
            return this.moves.length + 1;
        }

        getNextMovePlayer(): Player {
            if ((this.getNextMoveNumber() + this._firstMovePlayer) % 2 == 0)
                return Player.WHITE;
            return Player.BLACK;
        }

        getStateOfLocation(location: Location): LocationState {
            return this.locationPool[location.x * this._width + location.y];
        }

        applyMove(location?: Location): GameState {
            this.placeStone(location == null
                ? null
                : new Stone(location, this.getNextMoveNumber(), this.getNextMovePlayer()));
            return this;
        }

        placeStone(stone?: Stone) {
            if (stone) {
                let locationState = this.getStateOfLocation(stone.location);

                if (locationState.stone !== null)
                    throw new LocationOccupiedError(stone.moveNumber, stone.player, locationState.stone);

            }
            let originLocationStatePool = this.locationPool.slice();
            let originMoves = this.moves.slice();
            let originCapturedStones: Set<Stone> = new Set(this.capturedStones);
            if (stone) {
                this.moves.push(stone.location);
            } else {
                this.moves.push(null);
            }
            try {
                this.tryPlaceStone(stone);
            } catch(e) {
                this.moves = originMoves;
                this.locationPool = originLocationStatePool;
                this.capturedStones = originCapturedStones;
                throw e;
            }
        }

        placePresetStone(stone: Stone) {
            let locationState = this.getStateOfLocation(stone.location);

            if (locationState.stone !== null)
                throw new LocationOccupiedError(stone.moveNumber, stone.player, locationState.stone);

            let originLocationStatePool = this.locationPool.slice();
            let originMoves = this.moves.slice();
            let originCapturedStones: Set<Stone> = new Set(this.capturedStones);
            try {
                this.tryPlaceStone(stone);
            } catch(e) {
                // Recover state
                this.moves = originMoves;
                this.locationPool = originLocationStatePool;
                this.capturedStones = originCapturedStones;
                throw e;
            }
        }

        abstract tryPlaceStone(stone?: Stone);

    }

    export class ChineseRuleGameState extends GenericGameState implements GameState {
        private _situationMap: Map<String, number> = new Map();

        private _encodeState() {
            let turn = this.getNextMovePlayer();
            let board = this.locationPool.map((ps)=> (ps.stone == null) ? ' ' : ps.stone.player.toString()).join('');
            return turn + ':'+ board;
        }

        public tryPlaceStone(stone?: Stone) {

            if (stone) {
                let opponentAdjacentGroups: StoneGroup[] = [];
                let friendAdjacentGroups: StoneGroup[] = [];

                this._getStatesOfAdjacentLocation(stone.x, stone.y)
                    .map((ps) => ps.stone)
                    .filter((stone) => stone != null)
                    .map((stone) => stone.belongingGroup)
                    .forEach((group) => {
                        if (group.player === stone.player) {
                            friendAdjacentGroups.push(group);
                        } else {
                            opponentAdjacentGroups.push(group);
                        }
                    });

                this._updateLocationState(stone.location, stone);
                let stoneCaptured = 0;
                opponentAdjacentGroups
                    .filter((group) => !this._hasLiberty(group))
                    .forEach((group) => {
                        stoneCaptured += group.stones.size;
                        group.stones.forEach((s) => {
                            this.capturedStones.add(s);
                            this._updateLocationState(
                                s.location,
                                null)
                        });
                    });
                friendAdjacentGroups
                    .forEach((group) => {

                        group.stones.forEach((s) => {
                            this._updateLocationState(
                                s.location,
                                s.transferToAnotherGroup(stone.belongingGroup))
                        })
                    });

                if (!stoneCaptured && !this._hasLiberty(stone.belongingGroup)) {
                    throw new SuicideNotAllowedError(this.getNextMoveNumber(),
                        stone.player, stone.location, friendAdjacentGroups);
                }
            }

            let situation = this._encodeState();

            if (this._situationMap.has(situation))
                throw new PositionRecreatedError(stone.moveNumber,
                    stone.player, stone.location, this._situationMap.get(situation));

            this._situationMap.set(situation, stone.moveNumber);
        }

    }


    export class ChineseRuleGameStateInitializer implements GameStateInitializer {
        private _firstMovePlayer: Player = Player.BLACK;
        private _presetStone: Array<{player: Player, location: Location}> = [];
        constructor(readonly width: number,
                    readonly height: number) {}
        applyPresetStone(location: Location, player: Player):this {
            this._presetStone.push({player, location});
            return this;
        }

        setFirstMovePlayer(player: Player):this {
            this._firstMovePlayer = player;
            return this;
        }

        build(): ChineseRuleGameState {
            return new ChineseRuleGameState(this.width, this.height, this._firstMovePlayer, this._presetStone);
        }

        
    }
    export class ChineseRule implements GameRule {
        prepareGameBoard(width: number, height: number):  ChineseRuleGameStateInitializer {
            return new ChineseRuleGameStateInitializer(width, height);
        }
    }
}

export const ChineseRule = new Implement.ChineseRule();


