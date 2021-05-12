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
            })
        })
    }

    return render;
}

export function useAnimeManager(tracking, options = {}) {
    let {oneAtATime, useEffect, protectFastChanges = true} = options;
    // todo: hold Map to save all item until the explicit done to removed
    const {current: map} = useRef(new Map())

    let stateItems = useChangeIntersection(tracking, options);

    const forceRender = useDebounceRender();

    useMemo((_) => {
        const tempMap = new Map();

        stateItems.forEach(function (stateItem) {
            stateItem.done = doneFactory(stateItem, forceRender, stateItems, map);

            /** fix fast change */
            let prevItem = map.get(stateItem.key);
            tempMap.set(stateItem.key, stateItem);
            map.delete(stateItem.key);

            /**retrieve items*/
            stateItem.nextPhases = stateItem.nextPhases || prevItem?.nextPhases || [];

            let phase = stateItem.phase,
                prevPhase = stateItem.prevPhase = prevItem?.phase ?? STATIC
            if (
                protectFastChanges &&
                !(phase == STATIC || prevPhase == STATIC || prevPhase == phase)
            ) {
                stateItem.nextPhases.push(phase);
                stateItem.phase = prevPhase;
            }
        })
        /** protect from fast disappear */
        WARNS(map.size > 0 && (map.size % 50) == 0 && oneAtATime, 'overflow', map.size)

        for (let [key, state] of map) {
            /** assume that state.phase == REMOVE so using `from` instead of `to`*/
            stateItems.splice(state.from, 0, state)
        }
        for (let [key, state] of tempMap) {
            map.set(key, state);
        }

    }, [stateItems])
    if (useEffect) useAnimeEffect(stateItems, options)

    return oneAtATime ? stateItems[0] : stateItems;
}

function doneFactory(state, forceRender, stateItems, map) {
    return function done() {
        const {key, phase} = state;

        if (phase === ADD || phase === MOVE) {
            state.phase = STATIC;
            return forceRender().then(_ => {
                if (state.nextPhases.length) {
                    state.phase = state.nextPhases.pop();
                    return forceRender()
                }
            });
        }
        if (phase === REMOVE) {
            // todo:find a better way to remove
            const index = stateItems.findIndex((state) => state.key === key);
            stateItems.splice(index, 1);
            map.delete(state.key)
            return forceRender();
        }
    }
}

/** just use the key on two runs of the running component ( with different array reference )
 to find which item added or removed */
export function useChangeIntersection(tracking, options = {}) {
    let {key, generateKey} = options;
    key = key ?? options/*consider as string*/;
    const currentArray = [tracking].flat(1)
    const prevArray = usePrevious(currentArray, [], tracking);

    const getKey = (item) => generateKey ? keyGenerator(item) : item[key] ?? item
    return useMemo(_ => {
        const unionMap = new Map()

        for (let [i, item] of prevArray.entries()) {
            let k = getKey(item);
            unionMap.set(k, {item, key: k, phase: REMOVE, from: i, to: Infinity})
        }

        for (let [i, item] of currentArray.entries()) {
            let k = getKey(item);
            let state = unionMap.get(k);
            let phase = state ? (i === state.from) ? STATIC : MOVE : ADD;
            unionMap.set(k, {
                key: k, from: Infinity, ...state, item, phase, to: i,
            })
        }

        const unionOrder = currentArray.map(item => item[key] ?? item);
        for (let [key, obj] of unionMap) {
            if (obj.phase !== REMOVE) continue;
            unionOrder.splice(obj.from, 0, obj.key);
        }

        return unionOrder.map(key => unionMap.get(key))
    }, [tracking])
}


function madeBoxesGetter(by, states, boxMap) {
    if (by == 'byLocation') return createLocationBoxes(states);
    if (by == 'byPosition') return timeBoxes;
    return WARNS.bind('noDeltaStyle', by);

    function timeBoxes(state) {
        const {key, dom} = state;
        const box = dom?.getBoundingClientRect() ?? null;
        const prevBox = boxMap.get(key);
        boxMap.set(key, box);
        return {box, prevBox}
    }

    function createLocationBoxes(states) {
        const list = [];
        for (const state of states) list[state.to] = state;
        delete list[Infinity]

        return function locationBoxes(state) {
            const {from, to} = state;
            const box = list[to].dom?.getBoundingClientRect();
            const prevBox = list[from].dom?.getBoundingClientRect()
            return {box, prevBox}
        }
    }

}

export function useAnimeEffect(states, options = {}) {
    const {deltaStyle = 'byPosition'} = options
    const {current: boxMap} = useRef(new Map());
    const forceRender = useDebounceRender();
    const getBoxes = madeBoxesGetter(deltaStyle, states, boxMap)

    useMemo((_) => states.forEach((state, i) => {
        state.ref = React.createRef();
        state.dx = state.dx ?? 0;
        state.dy = state.dy ?? 0;
        state.nextPhases.push(state.phase);
        if (state.phase == MOVE) state.phase = state.prevPhase;
        const done = state.done;
        state.done = function () {
            done();
            boxMap.set(state.key, state?.dom.getBoundingClientRect());
        }
    }), [states])

    useLayoutEffect(function () {

        for (const state of states) {
            const {key, from, to, ref: {current: dom = null}} = state;
            state.phase = state.nextPhases.pop();
            state.dom = dom;
            const {box, prevBox} = getBoxes(state)
            if (prevBox && box) {
                state.dx = prevBox.x - box.x;
                state.dy = prevBox.y - box.y;
            }
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

