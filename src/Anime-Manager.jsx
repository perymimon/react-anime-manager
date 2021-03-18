//# inspiration from https://codesandbox.io/s/reorder-elements-with-slide-transition-and-react-hooks-flip-211f2?file=/src/AnimateBubbles.js
import React, {useRef, useState, useEffect, useLayoutEffect, useMemo} from "react";
import {func} from "prop-types";

export const STATIC = 'static', ADD = 'added', REMOVE = 'removed', MOVE = 'move';

function keyGenerator() {
    const str = 'abcdefghijklmnop1234567890'
    const {random, floor} = Math;
    Array.from({length: 4}, (i) => str[floor(random() * str.length)]).join('')
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
                console.log('forceRender');
                renderRequested.current = false;
                forceRender([]);
                for (let res of resolvers.current)
                    res()
            })
        })
    }

    return render;
}

export function useAnimeManager(items, options = {}) {
    let {oneAtATime, useEffect} = options;
    // todo: hold Map to save all item until the explicit done to removed
    const itemsMap = useRef(new Map())
    let map = itemsMap.current;

    let stateItems = useChangeIntersection(items, options);
    const forceRender = useDebounceRender();

    if (useEffect) useAnimeEffect(stateItems)

    function doneFactory(item) {
        return function done() {
            console.log('done', JSON.stringify(item));
            const {key, phase} = item;
            let map = itemsMap.current;
            if (phase === ADD || phase === MOVE) {
                console.log('do static after add or move');
                item.phase = STATIC;
                return forceRender().then(_=>{
                    if(item.forcedFromPhase){
                        item.phase = item.forcedFromPhase;
                        delete  item.forcedFromPhase;
                    }
                });
            }
            if (phase === REMOVE) {
                console.log('do remove');
                // todo:find a better way
                const index = stateItems.findIndex((state) => state.key === key);
                stateItems.splice(index, 1);
                map.delete(item.key)
                // debugger;
                return forceRender();
            }
        }
    }

    useMemo((_) => {
        stateItems.forEach(function (stateItem) {
            stateItem.ref = React.createRef();
            stateItem.done = doneFactory(stateItem);

            let prevItem = map.get(stateItem.key);
            map.set(stateItem.key, stateItem);

            if (
                prevItem
                && prevItem.phase != stateItem.phase
                && prevItem.phase != STATIC

            ) {
                stateItem.forcedFromPhase = stateItem.phase;
                stateItem.phase = prevItem.phase;
            }

        })
        // let setItems = new Set(stateItems.map(i => i.key));
        // for (let [key, item] of map) {
        //     /** if it removed with intense add it */
        //     if (!setItems.has(key)) {
        //         stateItems.splice(item.from, 0, item)
        //     }
        // }
        // let items = map.values().sort((t0, t1) => t0.to - t1.to);
        // let rIndex = items.findIndex(it => it.to == -1);
        // if (rIndex == -1) return items;
        // let removedItems = items.splice(rIndex, Infinity)
        // for (let ri of removedItems)
        //     items.splice(ri.from, 0, items)
        // return items

    }, [stateItems])
    // console.log(JSON.stringify(stateItems));

    return oneAtATime ? stateItems[0] : stateItems;
}


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

/** just use the key on two runs of the running component ( with different array reference )
 to find which item added or removed */
export function useChangeIntersection(array, options = {}) {
    let {key, generateKey} = options;
    key = key ?? options;
    const currentArray = [array].flat(1)
    const prevArray = usePrevious(currentArray, [], array);

    const getKey = (item) => generateKey ? keyGenerator() : item[key] ?? item

    return useMemo(_ => {
        const unionMap = new Map()

        for (let [i, item] of prevArray.entries()) {
            let k = getKey(item);
            unionMap.set(k, {item, key: k, phase: REMOVE, from: i, to: -1})
        }

        for (let [i, item] of currentArray.entries()) {
            let k = getKey(item);
            let state = unionMap.get(k);
            let phase = state ? (i === state.from) ? STATIC : MOVE : ADD;
            unionMap.set(k, {
                key: k, from: -1, ...state, item, phase, to: i,
            })
        }

        const unionOrder = currentArray.map(item => item[key] ?? item);
        for (let [key, obj] of unionMap) {
            if (obj.phase !== REMOVE) continue;
            unionOrder.splice(obj.from, 0, obj.key);
        }

        return unionOrder.map(key => unionMap.get(key))
    }, [array])
}


const originalPhase = Symbol('originalPhase');

