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

export const STATIC = 'static', ADD = 'added', REMOVE = 'removed', SWAP = 'swap';
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
    }, [changedTracker ?? value].flat());
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
    const [cacheBuster, forceRender] = useState([]);

    useEffect(_ => {
        for (let res of resolvers)
            res()
        resolvers.length = 0;
    })

    function render() {
        return new Promise((res, rej) => {
            resolvers.push(res)
            if (resolvers.length > 1) return;
            window.requestAnimationFrame(_ => forceRender([]))
        })
    }

    return [render, cacheBuster];
}

function useLongTimeMemory() {
    // todo: why useref can't take init function
    const {current: memory} = useRef(new LetMap(key => ({
        item: null,
        pipe: [],
        key:key
    })))

    useMemo(_ => {
        memory.shift = function (key) {
            let {item, pipe} = this.get(key);
            let state = pipe.shift()
            if (pipe.length === 0 && state.phase == REMOVE)
                this.delete(key)
            // return Object.assign(state, {item, key})
        }
        memory.push = function (key, state) {
            let record = memory.let(key)
            record.item = state.item;
            delete state.item;
            delete state.key;
            record.pipe.push(state)
        }
        memory.peek = function (key) {
            if (!this.has(key)) return null;
            let record = memory.get(key)
            let {pipe} = memory.get(key)
            return Object.assign(record, pipe[0])
        }
    }, [])

    //todo: clear memory after unbound
    return memory;
}

function test(name, tracking, options = {}) {

    if (tracking === undefined) throw `${name} can't call without array or object to trace`
    // check if key exist
    let sample = Array.isArray(tracking) ? tracking[0] : tracking;
    let key = typeof options === 'string' ? options : options.key
    if (typeof sample == 'object' && !key)
        throw `when tracing objects key must be provide`
}

export function useAnimeManager(tracking = [], options = {}) {
    // test(useAnimeManager.name, tracing, options)
    const {current: defaults} = useRef({
        oneAtATime: !Array.isArray(tracking)
    })
    let {oneAtATime = defaults.oneAtATime, onEffect, onAnimationEnd, instantChange = false} = options;
    /** long time memory */
    const memory = useLongTimeMemory()
    const {current: refMemory} = useRef(new LetMap(key => createRef()))

    options.exportHash = true;
    const [intersection, currentHash] = useChangeIntersection(tracking, options);
    const [forceRender, cacheBuster] = useDebounceRender();

    /**
     * after Intersection
     * 1) enrich the stats with done, ref, dx,dy, dom
     * 2) hold on prev state if it that not done (middle of ADD, MOVE or REMOVE)
     * 3) bring back REMOVE states that not finish and will not show in current phase ( removed before two or more updates )
     */
    function enrichState(state) {
        state.ref = refMemory.let(state.key)
        state.done ??= done.bind(state, memory, intersection, forceRender, onAnimationEnd, refMemory)
        state.dx ??= state.dy ??= state.abs_dx ??= state.abs_dy ??= state.meta_dx ??= state.meta_dy ??= 0
        return state
    }

    useMemo(function retrieveStats() {
        /** pipes state and use the current-one
         /** 1) if current state not static store it
         /** 2) if long-memory has entry it means prev animation not done. so return it
         /** 3.1) when done accure update state to static.
         /** 3.2) next tick update it to next state on the pipe */

        for (let [index, state] of intersection.entries()) {
            let {item, key, phase} = state;
            /** (1) */
            if (state.phase !== STATIC) {
                memory.push(key, state)
            }
            /** (2) memory.peek */
            // pull out phase that still in action
            state = memory.peek(key) || state;
            intersection[index] = enrichState(state);
            // current.splice(index,1)
            // current.splice(state.to, 0, state)
        }

        /** 3) retrieve "old" not finish REMOVE states */
        //q: can be situation that REMOVE come before ADD so key will be in the `current` there is risk for dupliate
        //a: if ADD is in the current it will be replaced by REMOVE on the main loop
        for (let [key, record] of memory) {
            if (currentHash.has(key)) continue
            let state = memory.peek(key);
            // assuming REMOVE State
            intersection.splice(state.from, 0, enrichState(state))
        }

        /** warn from slow removed animations */
        WARNS(memory.size > 0 && (memory.size % 10) == 0 && oneAtATime, 'overflow', memory.size)
    }, [intersection])

    // to calculate the real check between the result array dev user see between each loop
    // take into accout the real position of the items in the expoter array. after adding back
    // removed items, and accumulate adding items that not finish there animation but push each other
    // on returning array ( so it we render them they MOVED )
    // todo: how to make this hook recalcaulte just when current change, maybe internaly, without make other hook rerender
    // todo: with part of the result we need to use: just from-to? real-from [real-to == index]
    // todo: we not need removed items back as they result of user done()


    useMotion(intersection, onEffect, cacheBuster)

    return (oneAtATime) ? intersection[0] : intersection
}

function useMotion(current, onMotion, cacheBuster) {
    const {current: positionMemory} = useRef(new Map())

    for (let [i, state] of current.entries()) {
        state.meta_from ??= i
        state.meta_to = i
    }

    useMemo(_ => {
        for (let state of current) {
            try {
                const {key, phase, ref: {current: dom}, meta_to} = state;
                if (phase === ADD) continue
                const {offsetLeft, offsetTop} = dom ?? {};
                positionMemory.set(meta_to, {offsetLeft, offsetTop})
            } catch (e) {
                console.log('the next error in the state', state)
                console.error(e)
            }
        }
    }, [current])

    useLayoutEffect(_ => {
        const locationCache = new LetMap(index=>{
            let dom = current[index].ref.current
            const {offsetLeft, offsetTop} = dom ?? {};
            return {offsetLeft, offsetTop}
        })

        for (let [i, state] of current.entries()) {
            let {ref: {current: dom}, from, to, phase, key, meta_to} = state
            state.dom = dom
            if (!dom) continue
            calculateVanillaTransform:{
                if (state.phase === ADD) break calculateVanillaTransform
                let {offsetLeft: leftFrom, offsetTop: topFrom} = positionMemory.get(i)
                let {offsetLeft: leftTo, offsetTop: topTo} = dom ?? {}
                state.trans_dx = leftFrom - leftTo;
                state.trans_dy = topFrom - topTo;
            }
            calculateStrictTransform:{
                if (phase === SWAP) {
                    let {offsetLeft: leftFrom, offsetTop: topFrom} = locationCache.let(from);
                    let {offsetLeft: leftTo, offsetTop: topTo} = locationCache.let(to);
                    state.dx = leftFrom - leftTo;
                    state.dy = topFrom - topTo;
                }
            }
            calculateMetaDiff:{
                const {meta_from, meta_to} = state
                let {offsetLeft: leftFrom, offsetTop: topFrom} = locationCache.let(meta_from);
                let {offsetLeft: leftTo, offsetTop: topTo} = locationCache.let(meta_to);
                state.meta_dx = leftFrom - leftTo;
                state.meta_dy = topFrom - topTo;
            }
        }
        // do callback after calculation so triggered it not disruption calculation
        for (let state of current) {
            onMotion?.(state)
        }
    }, [current])
    // because it runs on different timing
}

async function done(memory, current, forceRender, onAnimationEnd, refMemory) {
    const state = this;
    let {key, phase} = state;
    if (phase == STATIC) return;
    let index;
    state.dx = state.dy = state.meta_dx = state.meta_dy = 0;
    if (phase === ADD || phase === SWAP) {
        state.phase = STATIC;
        state.from = state.to;
        state.meta_from = state.meta_to;
    } else if (phase === REMOVE) {
        index = current.findIndex(s => s.key == key)
        current.splice(index, 1)
        refMemory.delete(key)
    }
    memory.shift(key)
    await onAnimationEnd?.(state)
    await forceRender()
    if (memory.has(key)) {
        index = Math.max(index, state.from)
        Object.assign(state, memory.peek(key))
        if (phase === REMOVE) current.splice(index, 0, state)
        await forceRender()
    }
}

/** just use the key on two runs of the running component ( with different array reference )
 to find which item added or removed */
export function useChangeIntersection(tracking, options = {}, postProcessing) {
    //todo: change phase MOVE to SWAP
    let {key, withRemoved = true, cacheBuster, exportHash} = options;
    key = key ?? options /*options consider as string*/;
    const current = [tracking].flat(1) // convert tracking to array
    const before = usePrevious(current, [], [cacheBuster, tracking]);

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
            let state = {item, key: k, phase: ADD, from: i, to: i}
            hashMap.set(k, state)
            exportOrder.push(state)
        }
        // register previous items,compare location to understand if they Removed,Static, Move
        for (let [beforeIndex, item] of before.entries()) {
            let k = getKey(item, beforeIndex);
            let state = hashMap.get(k);
            let phase = state ? (beforeIndex === state.to) ? STATIC : SWAP : REMOVE;

            if (phase === REMOVE) {
                if (!withRemoved) continue
                state = {item, key: k, phase, from: beforeIndex, to: beforeIndex,}
                exportOrder.splice(beforeIndex, 0, state)
                hashMap.set(k, state)
            } else Object.assign(state, {from: beforeIndex, phase})
        }
        if (exportHash) return [exportOrder, hashMap]
        /** run postProcessing if it not return something return exportOrder array */
        return postProcessing?.(exportOrder) ?? exportOrder
        // return exportOrder;

    }, [cacheBuster, tracking])
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