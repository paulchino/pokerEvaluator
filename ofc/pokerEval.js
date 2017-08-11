
var testStrings = {
    'broadway': 'as kd qh js th',
    'wheel': '2d ac 3s 5d 4s',
    'straight': '8d ts jc 9h qc',
    'flush': '3s 5s as 8s qs',
    'strightFlush': '3d 5d 2d 4d 6d',
    'royalFlush': 'ah kh qh jh th'
}


var pineappleEvaluator = {
    // Points Value base on card rank. Ace = 12
    CARD_VALUE: {
        'a': 14,
        '2': 2,
        '3': 3,
        '4': 4,
        '5': 5,
        '6': 6,
        '7': 7,
        '8': 8,
        '9': 9,
        't': 10,
        'j': 11,
        'q': 12,
        'k': 13
    },

    SUIT_NAMES: {
        'h': 'heart',
        'd': 'diamond',
        's': 'spade',
        'c': 'club'
    },

    // Strength for hand comparision
    RANKING_STRENGTH: {
        'highCard': 1,
        'pair': 2,
        'twoPair': 3,
        'set': 4,
        'straight': 5,
        'flush': 6,
        'fullHouse': 7,
        'quads': 8,
        'straightFlush': 9,
        'royalFlush': 10
    },
    // reset everytime hand is eval'ed
    cardHistogram: {
        'a': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
        '7': 0,
        '8': 0,
        '9': 0,
        't': 0,
        'j': 0,
        'q': 0,
        'k': 0
    },

    _resetHistogram: function() {
        for (k in this.cardHistogram) {
            this.cardHistogram[k] = 0;
        }
    },

    _createCardList: function(cards) {
        var cardList;

        if (typeof cards === 'string') {
            cardList = cards.toLowerCase().split(' ');
        }
        if (Array.isArray(cards)) {
            cardList = cards;
        }

        // TODO: Error handling
        return cardList;
    },


    _orderCards: function(cardList) {
        var orderedCardValues = [],
        self = this

        cardList.forEach(function(card) {
            var cardValue = self.CARD_VALUE[card[0]];
            orderedCardValues.push(cardValue);
        });
        return orderedCardValues.sort(function(a, b) {
            return a - b;
        });
    },

    // hand checks accepts string OR array.
    isStraight: function(cards, skipFlushCheck) {
        var cardList = this._createCardList(cards),
        orderedCardValues = this._orderCards(cardList),
        straight = false,
        lowCard = orderedCardValues[0],
        highCard = orderedCardValues[orderedCardValues.length - 1];

        if (highCard - lowCard === 4) {
            straight = true;
        } else if (highCard === 14 && lowCard === 2) {
            straight= true;
        }

        if (skipFlushCheck) {
            return straight;
        }

        return !this.isFlush(cardList, true) && straight;
    },

    isBroadwayStraight: function(cards, skipFlushCheck) {
        var cardList = this._createCardList(cards),
        orderedCardValues,
        lowCard,
        highCard,
        isBroadwayStraight = false;
        // TODO: Validation
        if (!this.isStraight(cards, skipFlushCheck)) {
            return false;
        }

        orderedCardValues = this._orderCards(cardList);
        lowCard = orderedCardValues[0];
        highCard = orderedCardValues[orderedCardValues.length - 1];

        if (highCard === 14 && (highCard - lowCard === 4)) {
            isBroadwayStraight = true;
        }

        if (skipFlushCheck) {
            return isBroadwayStraight;
        }

        return !(this.isFlush(cardList) && isBroadwayStraight);
    },

    isFlush: function(cards, skipStraightCheck) {
        var cardList = this._createCardList(cards),
        isFlush = !!cardList.reduce(function(a, b) {
            return (a[1] === b[1]) ? a: NaN;
        });

        if (skipStraightCheck) {
            return isFlush;
        }

        return (!this.isStraight(cardList, true) && isFlush);
    },

    isStraightFlush: function(cards) {
        var cardList = this._createCardList(cards);

        return this.isStraight(cardList, true) && this.isFlush(cardList, true);
    },

    analyzeHand: function(cards) {
        var cardList = this._createCardList(cards),
        hasOnePair = false,
        hasTwoPair = false,
        hasSet = false,
        hasQuads = false,
        isFlush = false,
        isStraight = false,
        isBroadway = false,
        checkFlushOrStraight = true,
        self = this,
        handStruct;

        // TODO: Validation, convert 10 to t


        cardList.forEach(function(card) {
            if (card[0] in self.cardHistogram) {
                self.cardHistogram[card[0]] += 1;
                if (self.cardHistogram[card[0]] > 1) {
                    checkFlushOrStraight = false;
                }
            }
        });

        // none of ranks match
        if (checkFlushOrStraight) {
            isFlush = this.isFlush(cardList, true);
            isStraight = this.isStraight(cardList, true);

            if (isFlush && isStraight) {
                handStruct = this.straightFlushStruct(cardList);
            } else if (isFlush) {
                handStruct = this.flushStruct(cardList);
            } else if (isStraight) {
                handStruct = this.straightStruct(cardList);
            } else {
                // high hand
            }
        } else {
            for (count in this.cardHistogram) {
                if (this.cardHistogram[count] === 4) {
                    handStruct = this.quadStruct();
                } else if (this.cardHistogram[count] === 2) {
                    if (!hasOnePair) {
                        hasOnePair = true;
                    } else {
                        hasTwoPair = true;
                    }
                } else if (this.cardHistogram[count] === 3) {
                    hasSet = true;
                }
            }

            if (hasSet && hasOnePair) {
                handStruct = this.fullHouseStruct();
            } else if (hasSet) {
                handStruct = this.setStruct();
            } else if (hasTwoPair) {
                handStruct = this.twoPairStruct();
            } else if (hasOnePair) {
                handStruct = this.pairStruct();
            }
        }

        this._resetHistogram();
        return handStruct;
    },

    /*
    Pair type hands (quad, two pair, ect)
    */

    quadStruct: function() {
        var quadValue,
        kickerValue;

        for (k in this.cardHistogram) {
            if (this.cardHistogram[k] === 4) {
                quadValue = this.CARD_VALUE[k];
            }
            if (this.cardHistogram[k] === 1) {
                kickerValue = this.CARD_VALUE[k];
            }
        }

        return {
            quadValue: quadValue,
            kickerValue: kickerValue,
            rankStrength: 8,
            name: 'quads'
        }
    },

    fullHouseStruct: function() {
        var setValue,
        pairValue;

        for (k in this.cardHistogram) {
            if (this.cardHistogram[k] === 3) {
                setValue = this.CARD_VALUE[k];
            }
            if (this.cardHistogram[k] === 2) {
                pairValue = this.CARD_VALUE[k];
            }
        }

        return {
            setValue: setValue,
            pairValue: pairValue,
            rankStrength: 7,
            name: 'fullHouse'
        }
    },

    setStruct: function() {
        var setValue,
        kickers = [];

        for (k in this.cardHistogram) {
            if (this.cardHistogram[k] === 3) {
                setValue = this.CARD_VALUE[k];
            }
            if (this.cardHistogram[k] === 1) {
                kickers.push(this.CARD_VALUE[k]);
            }
        }
        this.reverseSort(kickers);

        return {
            setValue: setValue,
            kickerValues: kickers,
            rankStrength: 4,
            name: 'set'
        }
    },

    twoPairStruct: function() {
        var pairs = [],
        kickers = [];

        for (k in this.cardHistogram) {
            if (this.cardHistogram[k] === 2) {
                pairs.push(this.CARD_VALUE[k]);
            }
            if (this.cardHistogram[k] === 1) {
                kickers.push(this.CARD_VALUE[k]);
            }
        }
        this.reverseSort(pairs);

        return {
            pairValue: pairs,
            kickerValues: kickers,
            rankStrength: 3,
            name: 'twoPair'
        }
    },

    pairStruct: function() {
        var pair,
        kickers = [];

        for (k in this.cardHistogram) {
            if (this.cardHistogram[k] === 2) {
                pair = this.CARD_VALUE[k];
            }
            if (this.cardHistogram[k] === 1) {
                kickers.push(this.CARD_VALUE[k]);
            }
        }
        this.reverseSort(kickers);

        return {
            pairValue: pair,
            kickerValues: kickers,
            rankStrength: 2,
            name: 'pair'
        }
    },

    convertCardsToValues: function(cardList) {
        var valueList = [];

        cardList.forEach(function(card) {
            valueList.push(this.CARD_VALUE[card]);
        });

        return valueList;
    },

    /*
    flush / stright type
    */

    flushStruct: function(cardList) {
        var highValue,
        suit = cardList[0][1],
        cardValue = this._orderCards(cardList);

        highValue = cardValue.pop();
        this.reverseSort(cardValue);

        return {
            rankStrength: 6,
            name: 'flush',
            highValue: highValue,
            kickers: cardValue,
            suit: this.SUIT_NAMES[suit]
        };
    },

    straightFlushStruct: function(cardList) {
        var highValue,
        hasAce,
        isRoyal = false,
        name = 'straightFlush',
        rankStrength = 9,
        suit = cardList[0][1],
        cardValue = this._orderCards(cardList);

        highValue = cardValue[cardValue.length - 1];
        hasAce = highValue === 14;
        if (hasAce) {
            // check if royal or 5 high
            if (this.isBroadwayStraight(cardList, true)) {
                highValue = 14;
                name = 'royalFlush';
                rankStrength = 10;
            } else {
                highValue = 5;
            }
        }

        return {
            name: name,
            rankStrength: rankStrength,
            highValue: highValue,
            suit: this.SUIT_NAMES[suit]
        };
    },

    straightStruct: function(cardList) {
        var highValue,
        hasAce,
        cardValue = this._orderCards(cardList);

        highValue = cardValue[cardValue.length - 1];
        hasAce = highValue === 14;
        if (hasAce) {
            highValue = this.isBroadwayStraight(cardList, true) ? 14 : 5;
        }

        return {
            name: 'straight',
            rankStrength: 5,
            highValue: highValue
        }
    },

    highHandStruct: function() {

    },



    reverseSort: function(arr) {
        arr.sort(function(a,b) {
            return b - a;
        });
    }
}
