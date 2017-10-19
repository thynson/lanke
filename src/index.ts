
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

export class LankeError  {
    constructor() {
        Error.apply(this);
    }

}
LankeError.prototype = new Error();

/**
 * Error class indicates that an illegal move was tried
 */
export class IllegalMoveError extends LankeError {
    constructor(readonly moveNumber: number,
                readonly player: Player,
                readonly location?: Location) {
        super();
        // Error.apply(this);


    }
}

export class IllegalLocationError extends LankeError {
}

export class IllegalBoardSettingError extends LankeError {
    constructor(readonly message: string) {
        super();
    }
}

// IllegalBoardSettingError.prototype = new Error();

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
    prepareGameBoard(width: number, height: number): GameEngineInitializer
}

export interface GameEngineInitializer {
    readonly width: number;
    readonly height: number;
    applyPresetStone(location: Location, player: Player): this
    setFirstMovePlayer(player: Player): this
    build():GameEngine;
}


    
export interface GameEngine {
    readonly width: number;
    readonly height: number;
    getStateOfLocation(location: Location): LocationState

    /**
     * Apply a move
     * @param {Location} location Location where the stone will placed,
     *                   if no value was passed, assuming pass
     * @returns {GameEngine}
     */
    applyMove(location?: Location): GameEngine
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
    class GameEngine implements GameEngine {
        protected moves: Array<Location|null> = [];
        protected locationPool: LocationState[];
        protected capturedStones: Set<Stone> = new Set();
        constructor(readonly width: number,
                    readonly height: number,
                    readonly _firstMovePlayer: Player,
                    readonly _presetMoves: Array<{location:Location, player: Player}>,
                    readonly ruleEngine: RuleEngine) {
            if (width < 2 || height < 2)
                throw new IllegalBoardSettingError(`width: ${width}, height: ${height}`);

            this.locationPool = [];
            for (let i = 0; i < width; i++) {
                for (let j = 0; j < height; j++) {
                    this.locationPool.push(new LocationState(null))
                }
            }

            _presetMoves.forEach((p)=>this.placePresetStone(new Stone(p.location, 0, p.player)));
        }


        public _updateLocationState(location: Location, stone: Stone | null) {
            this.locationPool[location.x * this.width + location.y] = new LocationState(stone);
        }

        public _hasLiberty(stoneGroup: StoneGroup):boolean {
            let hasLiberty = false;
            stoneGroup.stones.forEach((stone)=> {
                this._getStatesOfAdjacentLocation(stone.location)
                    .forEach((ps)=> hasLiberty = hasLiberty || (ps.stone == null))
            });
            return hasLiberty;
        }

        public captureGroup(stoneGroup: StoneGroup): number {
            stoneGroup.stones.forEach((s) => {
                this.capturedStones.add(s);
                this._updateLocationState(
                    s.location,
                    null)
            });
            return stoneGroup.stones.size;
        }

        public _getStatesOfAdjacentLocation(location):LocationState[] {
            let result = [];
            if (location.x > 0) {
                result.push(this.getStateOfLocation({x: location.x - 1, y: location.y}));
            }
            if (location.x < this.width-1) {
                result.push(this.getStateOfLocation({x: location.x + 1, y: location.y}));
            }
            if (location.y > 0) {
                result.push(this.getStateOfLocation({x: location.x, y: location.y - 1}));
            }
            if (location.y < this.height-1) {
                result.push(this.getStateOfLocation({x: location.x, y: location.y + 1}));
            }
            return result;
        }


        getNextMoveNumber(): number {
            return this.moves.length + 1;
        }

        getNextMovePlayer(): Player {
            if ((this.getNextMoveNumber() + this._firstMovePlayer) % 2 == 0)
                return Player.BLACK;
            return Player.WHITE;
        }

        getStateOfLocation(location: Location): LocationState {
            return this.locationPool[location.x * this.width + location.y];
        }

        applyMove(location?: Location): GameEngine {
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
                this.ruleEngine.tryPlaceStone(this,stone);
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
                this.ruleEngine.tryPlaceStone(this,stone);
            } catch(e) {
                // Recover state
                this.moves = originMoves;
                this.locationPool = originLocationStatePool;
                this.capturedStones = originCapturedStones;
                throw e;
            }
        }

        // abstract tryPlaceStone(stone?: Stone);

    }

    interface RuleEngine {
        tryPlaceStone(gameState: GameEngine, stone?: Stone);
    }

    class ChineseRuleEngine implements RuleEngine {
        private _situationMap: Map<String, number> = new Map();
        constructor() {

        }
        private static _encodeState(gameState: GameEngine) {
            let turn = gameState.getNextMovePlayer();
            let encoded = [];
            encoded.push(turn.toString());
            encoded.push(':');
            for (let x = 0; x < gameState.width; x++)
                for (let y = 0; y < gameState.height; y++) {
                    let stone =  gameState.getStateOfLocation({x, y}).stone;
                    if (stone == null) encoded.push(' ');
                    else encoded.push(stone.player.toString());
                }

            return encoded.join('');
        }
        tryPlaceStone(gameState: GameEngine, stone?: Stone) {
            if (stone) {
                let opponentAdjacentGroups: StoneGroup[] = [];
                let friendAdjacentGroups: StoneGroup[] = [];

                gameState._getStatesOfAdjacentLocation(stone.location)
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

                gameState._updateLocationState(stone.location, stone);
                let stoneCaptured = 0;
                opponentAdjacentGroups
                    .filter((group) => !gameState._hasLiberty(group))
                    .forEach((group) => {
                        stoneCaptured += gameState.captureGroup(group);
                    });
                friendAdjacentGroups
                    .forEach((group) => {

                        group.stones.forEach((s) => {
                            gameState._updateLocationState(
                                s.location,
                                s.transferToAnotherGroup(stone.belongingGroup))
                        })
                    });

                if (!stoneCaptured && !gameState._hasLiberty(stone.belongingGroup)) {
                    throw new SuicideNotAllowedError(gameState.getNextMoveNumber(),
                        stone.player, stone.location, friendAdjacentGroups);
                }
            }

            let situation = ChineseRuleEngine._encodeState(gameState);

            if (this._situationMap.has(situation))
                throw new PositionRecreatedError(stone.moveNumber,
                    stone.player, stone.location, this._situationMap.get(situation));

            this._situationMap.set(situation, stone.moveNumber);
        }
    }

    export class ChineseRuleGameEngineInitializer implements GameEngineInitializer {
        private _firstMovePlayer: Player = Player.BLACK;
        private _presetStone: Array<{player: Player, location: Location}> = [];
        constructor(readonly width: number,
                    readonly height: number) {}
        applyPresetStone(location: Location, player: Player):this {
            if (location.x < 0
                || location.x >= this.width
                || location.y < 0
                || location.y >= this.height)
                throw new IllegalLocationError();
            this._presetStone.push({player, location});
            return this;
        }

        setFirstMovePlayer(player: Player):this {
            this._firstMovePlayer = player;
            return this;
        }

        build(): GameEngine {
            return new GameEngine(this.width, this.height, this._firstMovePlayer, this._presetStone, new ChineseRuleEngine());
        }

        
    }
    export class ChineseRule implements GameRule {
        prepareGameBoard(width: number, height: number):  ChineseRuleGameEngineInitializer {
            return new ChineseRuleGameEngineInitializer(width, height);
        }
    }
}

export const ChineseRule : GameRule = new Implement.ChineseRule();


