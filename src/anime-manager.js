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
        for (let res of resolvers) res()
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
        key: key
    })))

    useMemo(_ => {
        memory.shift = function (key) {
            let {item, pipe} = this.get(key);
            let state = pipe.shift()
            if (pipe.length === 0 && state.phase == REMOVE)
                this.delete(key)
            // return Object.assign(state, {item, key})
        }
        memory.push = function (k, state) {
            let record = memory.let(k)
            record.item = state.item;
            let {item, key, ...rest} = state
            record.pipe.push(rest)
            // dense(record.pipe)
        }
        memory.peek = function (key) {
            if (!this.has(key)) return null;
            let record = memory.get(key)
            return Object.assign(record, record.pipe[0])
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
    const defaults = useMemo(_ => ({oneAtATime: !Array.isArray(tracking)}), [])
    const {oneAtATime, onEffect, onAnimationEnd, instantChange = false} = {...defaults, ...options};
    const memory = useLongTimeMemory()
    options.exportHash = false;
    const intersection = useChangeIntersection(tracking, options);
    const [forceRender, cacheBuster] = useDebounceRender();

    /**
     * after Intersection
     * 1) enrich the stats with done, ref, dx,dy, dom
     * 2) hold on prev state if it that not done (middle of ADD, MOVE or REMOVE)
     * 3) bring back REMOVE states that not finish and will not show in current phase ( removed before two or more updates )
     */
    useMemo(function retrieveStats() {
        /** pipes state and use the current-one
         /** 1) if current state not static store it
         /** 2) if long-memory has entry it means prev animation not done. so return it
         /** 3.1) when done accuse update state to static.
         /** 3.2) next tick update it to next state on the pipe */
        for (let state of intersection) {
            if (state.phase !== STATIC)
                memory.push(state.key, state)
        }
    }, [intersection])

    const metaItems = useMemo(function rebuild() {
        const meta = []
        for (let k of memory.keys()) {
            let state = memory.peek(k)
            state.done = done.bind(state, memory, meta, forceRender, onAnimationEnd)
            meta.push(state)
        }
        meta.sort((a, b) => {
            let cmp = a.to - b.to || a.from - b.from
            if (cmp != 0) return cmp;
            if (a.phase == b.phase) return 0;
            if (a.phase == REMOVE) return -1;
            if (b.phase == REMOVE) return 1;
            return 0
        })
        /** warn from slow removed animations */
        WARNS(memory.size > 0 && (memory.size % 10) == 0 && oneAtATime, 'overflow', memory.size)
        return meta
    }, [cacheBuster, intersection])

    useMotion(metaItems, onEffect, cacheBuster)
    return (oneAtATime) ? metaItems[0] : metaItems
}

function useMotion(intersection, onMotion) {
    const {current: positionMemory} = useRef(new Map())

    let compensation = 0
    for (let [i, state] of intersection.entries()) {
        state.meta_from ??= i
        state.meta_to = i - compensation
        if (state.phase == REMOVE) compensation++
    }

    useMemo(_ => {
        for (let [index, state] of intersection.entries()) {
            state.dx ??= state.dy ??= state.abs_dx ??= state.abs_dy ??= state.meta_dx ??= state.meta_dy ??= 0
            state.ref ??= createRef()
            try {
                const {phase, ref: {current: dom}} = state;
                if (phase === ADD) continue
                const {offsetLeft, offsetTop} = dom ?? {};
                positionMemory.set(index, {offsetLeft, offsetTop})
            } catch (e) {
                console.log('the next error in the state', state)
                console.error(e)
            }
        }
    }, [intersection])

    useLayoutEffect(_ => {
        const locationCache = new LetMap(index => {
            let dom = intersection[index].ref.current
            const {offsetLeft, offsetTop} = dom ?? {};
            return {offsetLeft, offsetTop}
        })

        for (let [i, state] of intersection.entries()) {
            let {ref: {current: dom}, from, to, phase} = state
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
                if (phase !== SWAP) break calculateStrictTransform
                let [posFrom, posTo] = [from, to].map(i => locationCache.let(i))
                state.dx = posFrom.offsetLeft - posTo.offsetLeft;
                state.dy = posFrom.offsetTop - posTo.offsetTop;
            }
            calculateMetaDiff:{
                const {meta_from, meta_to} = state
                let [posFrom, posTo] = [meta_from, meta_to].map(i => locationCache.let(i))
                state.meta_dx = posFrom.offsetLeft - posTo.offsetLeft;
                state.meta_dy = posFrom.offsetTop - posTo.offsetTop;
            }
        }
        // do callback after calculation so triggered it not disruption calculation
        for (let state of intersection) {
            onMotion?.(state)
        }
    }, [intersection])
    // because it runs on different timing
}

async function done(memory, intersection, forceRender, onAnimationEnd) {
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
        index = intersection.findIndex(s => s.key == key)
        intersection.splice(index, 1)
    }
    memory.shift(key)
    await onAnimationEnd?.(state)
    await forceRender()
}

/** just use the key on two runs of the running component ( with different array reference )
 to find which item added or removed */
const ver = Symbol('ver')
let counter = 0;

export function useChangeIntersection(tracking, options = {}, postProcessing) {
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
        const intersection = []
        intersection[ver] = ++counter;
        // register current items and assume they ADD
        for (let [i, item] of current.entries()) {
            let k = getKey(item, i);
            let state = {item, key: k, phase: ADD, from: i, to: i}
            hashMap.set(k, state)
            intersection.push(state)
        }
        // register previous items,compare location to understand if they Removed,Static, Move
        for (let [beforeIndex, item] of before.entries()) {
            let k = getKey(item, beforeIndex);
            let state = hashMap.get(k);
            let phase = state ? (beforeIndex === state.to) ? STATIC : SWAP : REMOVE;

            if (phase === REMOVE) {
                if (!withRemoved) continue
                state = {item, key: k, phase, from: beforeIndex, to: beforeIndex,}
                intersection.splice(beforeIndex, 0, state)
                hashMap.set(k, state)
            } else Object.assign(state, {from: beforeIndex, phase})
        }
        if (exportHash) return [intersection, hashMap]
        /** run postProcessing if it not return something return intersection array */
        return postProcessing?.(intersection) ?? intersection
        // return intersection;

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