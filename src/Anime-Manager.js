//# inspiration from https://codesandbox.io/s/reorder-elements-with-slide-transition-and-react-hooks-flip-211f2?file=/src/AnimateBubbles.js
import React, {
    createRef,
    useRef,
    useState,
    useEffect,
    useLayoutEffect,
    useMemo,
} from "react";
import LetMap from './let-map-basic'

export const STATIC = 'static', ADD = 'added', REMOVE = 'removed', MOVE = 'move';
export const PREREMOVE = 'preremoved', PREMOVE = 'premove';
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
    // todo: why useref can't take inti function
    const {current: memory} = useRef(new LetMap(key => []))

    useMemo(_ => {
        memory.shift = function (key) {
            let pipe = this.get(key);
            let state = pipe.shift()
            if (pipe.length === 0)
                this.delete(key)
            return state;
        }
        memory.push = function (key, state) {
            let pipe = memory.let(key)
            pipe.push(state)
        }
        memory.peek = function (key, state){
            let pipe = memory.get(key) || []
            return pipe[0] || state
        }
    },[])
    return memory;
}

export function useAnimeManager(tracking, options = {}) {
    let {oneAtATime = !Array.isArray(tracking), onEffect, onAnimationEnd, instantChange = false} = options;

    /** long time memory */
    const memory = useLongTimeMemory()
    const {current: referenceMemory} = useRef(new LetMap(key => createRef()))

    const [current, currentHash] = useChangeIntersection(tracking, options, true);
    const forceRender = useDebounceRender();

    /**
     * after Intersection
     * 1) enrich the stats with done, ref, dx,dy, dom
     * 2) hold on prev state if it that not done (middle of ADD, MOVE or REMOVE)
     * 3) bring back REMOVE states that not finish and will not show in current phase ( removed before two or more updates )
     */

    useMemo((_) => {
        /** pipes state and use the current-one */
        for (let [index, state] of current.entries()) {

            /*  3.2) next tick update it to next state on the pipe */
            let {item, key} = state;
            delete state.item
            delete state.key
            let pipe = null

            /** 2) if current state not static store it*/
            if (state.phase != STATIC) {
                memory.push(key, state)
            }
            /** 1) if long-memory has entry it means prev animation not done. so return it */
            // also if state === static use long-memory if exist
            // pull out phase that still in action
            state = memory.peek(key,state)

            state = current[index] = Object.create(state)
            state.ref = referenceMemory.let(key)
            state.item = item;
            state.key = key;

            /** 3.1) when done accure update state to static.*/
            state.done ??= done.bind(state, memory, current, forceRender, onAnimationEnd)
            state.dx = state.dy = state.abs_dx = state.abs_dy = 0

            // check edge cases:
            // 1) merge two MOVE
            /// lastState.phase === state.phase are just if the phase === MOVE
            // if (lastState?.phase === state.phase) {
            //     record.pipe.pop()
            //     lastState.to = state.to
            // }
        }

        /** 3) retrieve "old" not finish REMOVE states */
        for (let [key, pipe] of memory) {
            if (currentHash.has(key)) continue
            let state = pipe[0]
            // assuming REMOVE State
            current.splice(state.from, 0, state)
        }

        /** warn from slow removed animations */
        WARNS(memory.size > 0 && (memory.size % 10) == 0 && oneAtATime, 'overflow', memory.size)
    }, [current])

    usePostEffect(current, onEffect)

    return (oneAtATime) ? current[0] : current
}

function usePostEffect(current, onEffect) {
    const {current: positionMemory} = useRef(new Map())
    useMemo(_ => {
        for (let state of current) {
            const {key, phase, ref: {current: dom}} = state;
            if (phase === ADD) continue
            positionMemory.set(key, dom?.getBoundingClientRect())
        }
    }, [current])

    useLayoutEffect(_ => {
        for (let state of current) {
            let {ref: {current: dom}, from, to, phase, key} = state

            state.dom = dom
            if (!dom) continue

            calculateDiffTransform:{
                if (state.phase === ADD) break calculateDiffTransform
                let boxFrom = positionMemory.get(key)
                let boxCurrent = dom?.getBoundingClientRect()
                state.trans_dx = boxFrom.x - boxCurrent.x
                state.trans_dy = boxFrom.y - boxCurrent.y
            }
            calculateDiffFromTo:{
                if (phase === MOVE) {
                    let boxFrom = current[from].ref.current?.getBoundingClientRect()
                    let boxCurrent = current[to].ref.current?.getBoundingClientRect()
                    state.dx = boxFrom.x - boxCurrent.x
                    state.dy = boxFrom.y - boxCurrent.y
                }
            }
        }
        // do callback after calculation so triggered it not disruption calculation
        for (let state of current) {
            onEffect?.(state)
        }
    }, [current])
}

async function done(memory, current, forceRender, onAnimationEnd) {
    const state = this;
    let {key, phase} = state;
    if (phase == STATIC) return;
    let index;
    if (phase === ADD || phase === MOVE) {
        state.phase = STATIC;
        state.from = state.to;
        state.dx = state.dy = 0;

    } else if (phase === REMOVE) {
        index = current.findIndex(s => s.key == key)
        current.splice(index, 1)
    }
    memory.shift(key)
    await onAnimationEnd?.(state)
    await forceRender()
    if (memory.has(key)) {
        Object.assign(state, memory.shift(key))
        if (phase === REMOVE) current.splice(index, 0, state)
        await forceRender()
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
                state = {item, key: k, phase, from: i, to: Infinity,}
                exportOrder.splice(i, 0, state)
                hashMap.set(k, state)
            } else Object.assign(state, {from: i, phase})
        }
        if (exportHash) return [exportOrder, hashMap]
        return exportOrder;

    }, [tracking])
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