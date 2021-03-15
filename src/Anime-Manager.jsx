//# inspiration from https://codesandbox.io/s/reorder-elements-with-slide-transition-and-react-hooks-flip-211f2?file=/src/AnimateBubbles.js
import React, {useRef, useState, useEffect, useLayoutEffect, useMemo} from "react";
import {func} from "prop-types";

export const STATIC = 'static', ADDED = 'added', REMOVED = 'removed', MOVE = 'move';

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
    const [renderRequested, forceRender] = useState(false);

    function render() {
        if (renderRequested === true) return;
        window.requestAnimationFrame(_ => {
            console.log('forceRender');
            forceRender(true);
            forceRender(false);
        })
    }

    return render;
}

/** just use the key on two runs of the running component ( with different array reference )
 to find which item added or removed */
export function useChangeIntersection(array, options = {}) {
    let {key, boolean, useEffect, deltaStyle} = options;
    key = key ?? options;
    const currentArray = [array].flat(1)
    const prevArray = usePrevious(currentArray, [], array);


    return useMemo(_ => {
        const unionMap = new Map()

        for (let [i, item] of prevArray.entries()) {
            unionMap.set(item[key] ?? item, {
                item, key: item[key] ?? item, phase: REMOVED, from: i, to: -1
            })
        }

        for (let [i, item] of currentArray.entries()) {
            let k = item[key] ?? item;
            let state = unionMap.get(k);
            let phase = state ? (i === state.from) ? STATIC : MOVE : ADDED;
            unionMap.set(k, {
                key: k, from: -1, ...state, item, phase, to: i,
            })
        }

        const unionOrder = currentArray.map(item => item[key] ?? item);
        for (let [key, obj] of unionMap) {
            if (obj.phase !== REMOVED) continue;
            unionOrder.splice(obj.from, 0, obj.key);
        }

        return unionOrder.map(key => unionMap.get(key))
    }, [array])
}

export function useAnimeManager(items, options = {}) {
    let {key, boolean, useEffect} = options;
    key = key ?? options/*key*/

    let statedItems = useChangeIntersection(items, options);
    const forceRender = useDebounceRender();
    if (useEffect) {
        useAnimeEffect(statedItems)
    }

    function doneFactory(item) {
        const {key, phase} = item;
        return function done() {
            if (phase === ADDED || phase === MOVE) {
                item.phase = STATIC;
                return forceRender();
            }
            if (phase === REMOVED) {
                const index = statedItems.findIndex((state) => state.key === key);
                statedItems.splice(index, 1);
                return forceRender();
            }
        }
    }

    useMemo((_) => statedItems.forEach(function (state) {
        state.ref = React.createRef();
        state.done = doneFactory(state);
    }), [statedItems])

    if (boolean && statedItems.length === 2 && statedItems[0].item == false) {
        statedItems.shift();
    }

    return boolean ? statedItems[0] : statedItems;
}

const originalPhase = Symbol('originalPhase');

export function useAnimeEffect(states) {
    const boxMap = new Map();
    const prevBoxMap = usePrevious(boxMap, null, states);
    const forceRender = useDebounceRender();

    useMemo(_ => states.forEach((state, i) => {
        state.dx = state.dx ?? 0;
        state.dy = state.dy ?? 0;
        state[originalPhase] = state.phase;
        state.phase = state.phase === MOVE ? STATIC : state.phase;
    }), [states])

    useLayoutEffect(function () {
        console.log('useAnimeEffect');
        states.forEach((state, i) => {
            const {ref, key, from, to} = state;
            state.phase = state[originalPhase];
            let dom = state.dom = ref.current ?? null;
            if (!dom) return;
            const box = dom?.getBoundingClientRect() ?? null;
            boxMap.set(key, box);
            const prevBox = prevBoxMap?.get(key);
            if (prevBox) {
                state.dx = prevBox.x - box.x;
                state.dy = prevBox.y - box.y;
            }
        })
        forceRender();

    }, [states]);
}