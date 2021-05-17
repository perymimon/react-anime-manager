//# inspiration from https://codesandbox.io/s/reorder-elements-with-slide-transition-and-react-hooks-flip-211f2?file=/src/AnimateBubbles.js
import React, {useRef, useState, useEffect, useLayoutEffect, useMemo} from "react";
import {func} from "prop-types";

export const STATIC = 'static', ADD = 'added', REMOVE = 'removed', MOVE = 'move';
const wmKeys = new WeakMap;

function keyGenerator(item) {
    let key = wmKeys.get(item)
    if (key) return key;
    // todo: make it work like a counter instead of random
    const str = 'abcdefghijklmnop1234567890'
    const {random, floor} = Math;
    key = Array.from({length: 4}, (i) => str[floor(random() * str.length)]).join('');
    return key;
}

function usePrevious(value, initialValue, refValue) {
    const ref = useRef(initialValue);
    useEffect(() => {
        ref.current = value;
    }, [refValue ?? value]);
    return ref.current;
}

export function useAppear() {
    const flag = useRef(true);

    useEffect(_ => {
        flag.current = false;
        return _ => flag.current = true;
    }, []);

    return flag.current;
}

function useDebounceRender() {
    const renderRequested = useRef(false);
    const resolvers = useRef([]);

    const [_, forceRender] = useState([]);

    function render() {
        return new Promise((res, rej) => {
            resolvers.current.push(res)
            if (renderRequested.current == true) return;
            renderRequested.current = true;
            window.requestAnimationFrame(_ => {
                // console.log('forceRender');
                renderRequested.current = false;
                forceRender([]);
                for (let res of resolvers.current)
                    res()
                resolvers.current.length = 0;
            })
        })
    }

    return render;
}

export function useAnimeManager(tracking, options = {}) {
    let {oneAtATime, useEffect, protectFastChanges = true} = options;
    options.longMemory = true;

    let [stateItems, longMemoryRemove] = useChangeIntersection(tracking, options);
    WARNS(stateItems.length > 0 && (stateItems.length % 50) == 0 && oneAtATime, 'overflow', stateItems.length)

    const forceRender = useDebounceRender();

    useMemo((_) => {
        stateItems.forEach(function (stateItem, index) {
            stateItem.done = doneFactory(stateItem, forceRender, longMemoryRemove);
            stateItem.nextPhases = stateItem.nextPhases || [];

            /** protect from fast disappear */
            let {phase, prevPhase = STATIC} = stateItem;
            if (
                protectFastChanges &&
                !(prevPhase == phase || [phase, prevPhase].includes(STATIC))
            ) {
                stateItem.nextPhases.push(phase);
                stateItem.phase = prevPhase;
            }
            stateItem.prevPhase = phase;
        })
    }, [stateItems])

    if (useEffect) useAnimeEffect(stateItems, options)

    return oneAtATime ? stateItems[0] : stateItems;
}

function doneFactory(state, forceRender, longMemoryRemove) {
    return function done() {
        const {phase} = state;

        if (phase === ADD || phase === MOVE) {
            state.prevPhase = state.phase = STATIC;
            ;
            return forceRender().then(_ => {
                if (state.nextPhases.length) {
                    state.phase = state.nextPhases.pop();
                    return forceRender()
                }
            });
        }
        if (phase === REMOVE) {
            longMemoryRemove(state)
            return forceRender();
        }
    }
}

/** just use the key on two runs of the running component ( with different array reference )
 to find which item added or removed */
export function useChangeIntersection(tracking, keyOrOptions = {}) {
    let {key, generateKey, longMemory} = keyOrOptions;
    key = key || keyOrOptions/*consider as string*/;
    const currentArray = [tracking].flat(1)
    const prevArray = usePrevious(currentArray, [], tracking);
    const {current: longMemoryMap} = useRef(new Map())

    return useMemo(_ => {
        const getKey = (item) => generateKey ? keyGenerator(item) : (key ? item[key] : item)

        const unionMap = new Map()

        /** add the Prev Array ( Removed potential ) */
        for (let [i, item] of prevArray.entries()) {
            let k = getKey(item);
            unionMap.set(k, {item, key: k, phase: REMOVE, from: i, to: Infinity})
        }
        /** loop fresh array add what missing and mark them as ADD or MOVE or STATIC*/
        for (let [i, item] of currentArray.entries()) {
            let k = getKey(item);
            let state = unionMap.get(k);
            let phase = state ? (i === state.from) ? STATIC : MOVE : ADD;
            unionMap.set(k, {
                key: k, from: Infinity, ...state, item, phase, to: i,
            })
        }


        /** */
        const unionOrder = currentArray.map(item => item[key] ?? item);

        for (let [key, obj] of unionMap) {
            if (obj.phase !== REMOVE) continue;
            unionOrder.splice(obj.from, 0, obj.key);
        }

        if (longMemory) {
            for (let [key, obj] of longMemoryMap) {
                if (obj.phase !== REMOVE) continue;
                unionOrder.splice(obj.from, 0, obj.key);
            }
            /*copy UnionMap to longMemoryMap*/
            for (let [key, obj] of unionMap) {
                var historyObj = longMemoryMap.get(key) || {};
                longMemoryMap.set(key, Object.assign(historyObj, obj));
            }
        }
        const stateItems = longMemory ?
            unionOrder.map(key => longMemoryMap.get(key)) :
            unionOrder.map(key => unionMap.get(key));

        function longMemoryRemove(state) {
            longMemoryMap.delete(state.key);
            stateItems.splice(0, Infinity, ...unionOrder.map(key => longMemoryMap.get(key)).filter(Boolean))
        }

        return longMemory ? [stateItems, longMemoryRemove] : stateItems;
    }, [tracking])
}


function useBoxesGetter(by, states) {
    var boxesGetter;
    if (by == 'byLocation') boxesGetter = locationBoxes;
    if (by == 'byPosition') boxesGetter = timeTravelBoxes;
    if (!boxesGetter) return WARNS.bind('noDeltaStyle', by);

    const {current: boxHistory} = useRef(new Map());
    const {current: boxByTo} = useRef(new Map());

    const stateByTo = [];
    for (const state of states) {
        stateByTo[state.to] = state;
        updateHistory(state, true);
    }

    delete stateByTo[Infinity]

    return [getBox, updateHistory]

    function updateHistory(state, gentle = false) {
        if (gentle && boxHistory.get(state.key)) return;
        boxHistory.set(state.key, state.dom?.getBoundingClientRect());
    }

    function getBox(state) {
        const [box, prevBox] = boxesGetter(state)
        const ready = () => !!(prevBox && box);
        const diff = (x1, x2) => ready() ? x1 - x2 : 0;

        return {
            box, prevBox,
            get ready() {
                return ready()
            },
            get dx() {
                return diff(prevBox?.x, box?.x)
            },
            get dy() {
                return diff(prevBox?.y, box?.y)
            }
        }
    }

    function timeTravelBoxes(state) {
        const {key, dom} = state;
        const box = dom?.getBoundingClientRect() ?? null;
        const prevBox = boxHistory.get(key);
        return [box, prevBox]
    }

    function locationBoxes(state) {
        const {from, to} = state;
        const box = stateByTo[to].dom?.getBoundingClientRect();
        // const fromBox = stateByTo[from].dom?.getBoundingClientRect()
        const fromBox = state.dom?.getBoundingClientRect() ?? null;
        return [box, fromBox]
    }
}

export function useAnimeEffect(states, options = {}) {
    const {deltaStyle = 'byPosition', injectDxDy = false} = options
    const forceRender = useDebounceRender();
    const [getBox, updateHistory] = useBoxesGetter(deltaStyle, states)

    useMemo((_) => states.forEach((state, i) => {
        state.ref = React.createRef();
        state.nextPhases.push(state.phase);
        if (state.phase == MOVE) state.phase = state.prevPhase;
        const done = state.done;
        state.done = function () {
            done();
            // after animation end update Box location for history ref
            updateHistory(state);
        }
        state.dxdy = () => getBox(state);
    }), [states])

    useLayoutEffect(function () {

        for (const state of states) {
            const {ref: {current: dom = null}} = state;
            state.phase = state.nextPhases.pop();
            state.dom = dom || state.dom; //if it is same key the dom not change
            if (injectDxDy)
                Object.assign(state, state.dxdy)
        }

        forceRender();

    }, [states]);
}

function WARNS(test, code, arg0) {
    const codes = {
        'overflow':
            `above then ${arg0} items waiting to draw. consider faster your animation`,
        'deltaStyle':
            `delta style can be: "byPosition" or "byLocation", current:${arg0}`
    }

    test && console.warn(codes[code])
}

