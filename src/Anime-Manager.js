//# inspiration from https://codesandbox.io/s/reorder-elements-with-slide-transition-and-react-hooks-flip-211f2?file=/src/AnimateBubbles.js
import React, {useRef, useState, useEffect, useLayoutEffect, useMemo} from "react";
import LetMap from './let-map-basic'

export const STATIC = 'static', ADD = 'added', REMOVE = 'removed', MOVE = 'move';
const wmKeys = new WeakMap();

function keyGenerator(item, i) {
    let key = wmKeys.get(item)
    if (key) return key;
    // todo: make it work like a counter instead of random
    const str = 'abcdefghijklmnop1234567890'
    const {random, floor} = Math;
    key = Array.from({length: 4}, (i) => str[floor(random() * str.length)]).join('');
    return key;
}

export function usePrevious(value, initialValue, changedTracker) {
    const ref = useRef(initialValue);
    useEffect(() => {
        ref.current = value;
    }, [changedTracker ?? value]);
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
    const {current: resolvers} = useRef([]);
    const [_, forceRender] = useState([]);

    function render() {
        return new Promise((res, rej) => {
            resolvers.push(res)
            if (resolvers.length > 1) return;
            window.requestAnimationFrame(_ => {
                forceRender([]);
                for (let res of resolvers)
                    res()
                resolvers.length = 0;
            })
        })
    }

    return render;
}

function useLongTimeMemory() {
    const {current: memory} = useRef(new LetMap(key =>
        new Proxy({key, item: null, pipe: [], done: null}, proxyHandler)
    ))

    const proxyHandler = {
        get(record, prop, receiver) {
            let exporter = (_ => {
                if (prop in record) return record[prop]
                let state = record.pipe[0]
                if (prop in state) return state[prop]
            })()

            return typeof exporter == 'function' ?
                exporter.bind(receiver) :
                exporter;
        },
        set(record, prop, value) {
            if (prop in record) {
                record[prop] = value
                return true
            }
            record.pipe[0][prop] = value;
            return true
        }
    }
    return memory
}

export function useAnimeManager(tracking, options = {}) {
    let {oneAtATime = !Array.isArray(tracking), useEffect, instantChange = false} = options;

    /** long time memory */

    const memory = useLongTimeMemory()

    const current = useChangeIntersection(tracking, options, false);
    const forceRender = useDebounceRender();

    useMemo((_) => {

        /**
         * after Intersection
         * 1) add done callback
         * 2) hold on prev state if it is not done (it ADD or MOVE or REMOVE)
         * 3) return also a state that not finish to REMOVE
         */
        for (let state of current) {
            // clean item from state
            let {item, key} = state;
            delete state.item
            // create new entry in the long-time-memory
            let record = memory.let(key)
            record.item = item // update item to the most updated one
            record.done = doneFactory(forceRender, memory)
            if(state.phase === STATIC) continue
            if(record.pipe[0]?.phase == STATIC)
                record.pipe.shift()
            record.pipe.push(state)
            // check edge cases:
            // 1) merge two MOVE

            /// lastState.phase === state.phase are just if the phase === MOVE
            // if (lastState?.phase === state.phase) {
            //     record.pipe.pop()
            //     lastState.to = state.to
            // }
        }


    }, [current])
    // if (useEffect) useAnimeEffect(stateItems, options)
    return useMemo(_ => {
        // if it oneAtATime i will send the first record (it change when it remove)
        if(oneAtATime){
            for(let [key,record] of memory){
                return record
            }
        }
        let exporter = []
        let cutInter = new Set(memory.keys())

        for (let state of current) {
            cutInter.delete(state.key)
            exporter.push(memory.get(state.key))
        }
        /**  retrieve old not finish REMOVE items */
        for (let key of cutInter) {
            let record = memory.get(key)
            exporter.splice(record.from, 0, record)
        }
        exporter = exporter.filter(Boolean)
        /** protect from slow removed animations */
        WARNS(memory.size > 0 && (memory.size % 10) == 0 && oneAtATime, 'overflow', memory.size)

        return  exporter;

    }, [memory.size])

}

function doneFactory(forceRender, memory) {
    return async function done() {
        let state = this;
        const {key, phase} = state;
        if (phase == STATIC) return;

        if (phase === ADD || phase === MOVE) {
            state.phase = STATIC;
            state.from = state.to;
            await forceRender();
            if (state.pipe.length > 1) {
                state.pipe.shift();
                forceRender()
            }
            return null;
        }
        if (phase === REMOVE) {
            state.pipe.shift()
            if (state.pipe.length == 0) {
                memory.delete(key)
            }
            return forceRender()
        }


    }
}

/** just use the key on two runs of the running component ( with different array reference )
 to find which item added or removed */
export function useChangeIntersection(tracking, options = {}, exportHash) {
    let {key} = options;
    key = key ?? options /*options consider as string*/;
    const current = [tracking].flat(1) // convert tracking to array
    const before = usePrevious(current, [], tracking);

    // if key not provided, use the keyValue at that position as key
    const getKey = (_ => {
        if (typeof key === 'function') return key // key(item,i);
        if (key === 'index') return (item, i) => i;
        if (key === 'generate') return keyGenerator // (item,i);
        if (typeof key === 'string') return (item, i) => item[key]
        return (item, i) => item;
    })();

    return useMemo(_ => {
        const hashMap = new Map()
        const exportOrder = []
        // register current items and assume they ADD
        for (let [i, item] of current.entries()) {
            let k = getKey(item, i);
            let state = {item, key: k, phase: ADD, from: Infinity, to: i}
            hashMap.set(k, state)
            exportOrder.push(state)
        }
        // register previous items,compare location to understand if they Removed,Static, Move
        for (let [i, item] of before.entries()) {
            let k = getKey(item, i);
            let state = hashMap.get(k);
            let phase = state ? (i === state.to) ? STATIC : MOVE : REMOVE;

            if (phase === REMOVE) {
                state = {key: k, from: i, to: Infinity, item, phase}
                exportOrder.splice(i, 0, state)
                hashMap.set(k, state)
            } else Object.assign(state, {from: i, phase})
        }
        if (exportHash) return [exportOrder, hashMap]
        return exportOrder;

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
    // todo: take forcerender as paramert so it not refresh twice
    const forceRender = useDebounceRender();
    const getBoxes = madeBoxesGetter(deltaStyle, states, boxMap)

    useMemo((_) => states.forEach((state, i) => {
        state.ref = React.createRef();
        state.dx ??= 0;
        state.dy ??= 0;
        state.nextPhases.push(state.phase);
        if (state.phase == MOVE) state.phase = state.prevPhase;
        const done = state.done;
        state.done = function () {
            done();
            boxMap.set(state.key, state?.dom.getBoundingClientRect());
        }
    }), [states, boxMap])

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
            `above then ${arg0} items pending to draw. consider faster your animation`,
        'deltaStyle':
            `delta style can be: "byPosition" or "byLocation", current:${arg0}`
    }

    test && console.warn(codes[code])
}

export default useAnimeManager