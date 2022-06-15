//# inspiration from https://codesandbox.io/s/reorder-elements-with-slide-transition-and-react-hooks-flip-211f2?file=/src/AnimateBubbles.js
import React, {
    createRef,
    useRef,
    useState,
    useEffect,
    useLayoutEffect,
    useMemo, useTransition,
} from "react";
import LetMap from './let-map-basic'

export const STAY = 'STAY', APPEAR = 'APPEAR', DISAPPEAR = 'DISAPPEAR', SWAP = 'SWAP';

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
    const ref = useRef({value: initialValue, ver: 1});
    const {current: {value: before, ver}} = ref;
    useEffect(() => {
        ref.current = {value, ver: ver + 1};
    }, [changedTracker ?? value].flat());
    return [before, ver];
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
    const [isPending, startTransition] = useTransition();
    useEffect(_ => {
        for (let res of resolvers) res()
        resolvers.length = 0;
    })

    function render() {
        return new Promise((res, rej) => {
            resolvers.push(res)
            if (resolvers.length > 1) return;
            startTransition(_ => {
                forceRender([])
            })
        })
    }

    return [render, cacheBuster];
}

function debounce(fn, ms) {
    let timer;
    return function (...args) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            fn.apply(this, args);
        })
    }
}

function useLongTimeMemory(time) {
    // todo: why useref can't take init function
    const {current: memory} = useRef(new LetMap(key => ({
        item: null,
        pipe: [],
        key: key,
        resetOverTimeWarning: debounce(function () {
            const record = this
            WARNS(record.phase !== STAY, 'overtime', record.phase, time, record)
        }, time)
    })))

    useMemo(_ => {
        memory.shift = function (key) {
            let record = this.get(key);
            record.pipe.shift()
            return Object.assign(record, record.pipe[0])
        }
        memory.assign = function (record) {
            return Object.assign(record, record.pipe[0])
        }
        memory.push = function (k, state, v) {
            let record = memory.let(k)
            let {item, key, ...rest} = state
            record.item = item;
            record.key = key;
            // if two state with same version, pop the oldest one
            if (record.pipe.at(-1)?.ver === v) {
                record.pipe.pop()
            }

            rest.ver = v
            record.pipe.push(rest)
            if (record.pipe.length === 1) {
                record.resetOverTimeWarning()
            }
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

/**
 * Main Hook
 */
export function useAnimeManager(tracking = [], options = {}) {
    // test(useAnimeManager.name, tracing, options)
    const {onMotion, onDone, instantChange = false, overTimeWarning = 1000} = options;
    const {skipPhases = []} = options;
    const memory = useLongTimeMemory(overTimeWarning)
    options.exportHash = false;
    const intersection = useChangeIntersection(tracking, options);
    const [forceRender, cacheBuster] = useDebounceRender();

    useMemo(function memoizeStates() {
        for (let state of intersection) {
            if (state.phase !== STAY && !skipPhases.includes(state.phase))
                memory.push(state.key, state, intersection[version])
        }
    }, [intersection])

    const metaItems = useMemo(function rebuild() {
        const meta = [...memory.values()]
        for (let record of meta) {
            record.done = done.bind(record, memory, forceRender, onDone)
        }
        let needResort;
        do {
            let needResort = false
            meta.sort((a, b) => {
                let cmp = a.to - b.to || a.from - b.from || b.ver - a.ver
                if (cmp != 0) return cmp;
                if (a.phase == b.phase) return 0;
                if (a.phase == DISAPPEAR) return -1;
                if (b.phase == DISAPPEAR) return 1;
                return 0
            })
            // must care case that
            let compensation = 0
            for (let [i, state] of meta.entries()) {
                state.meta_from ??= i
                state.meta_to = i - compensation
                if (state.phase == DISAPPEAR) compensation++
                // todo:make it under flag
                else if (state.phase === SWAP && state.meta_from === state.meta_to) {
                    memory.shift(state.key)
                    needResort = true
                }
            }
        }
        while (needResort)
        /** warn from slow removed animations */
        WARNS(memory.size > 0 && (memory.size % 10) == 0, 'overflow', memory.size)
        return meta
    }, [cacheBuster, intersection])

    useMotion(metaItems, onMotion, cacheBuster)
    return metaItems
}

async function done(memory, forceRender, onDone) {
    const record = this;
    record.resetOverTimeWarning()
    let {key, phase} = record;
    if (phase == STAY) return;
    record.dx = record.dy = record.meta_dx = record.meta_dy = 0;
    record.meta_from = record.meta_to     // make next animation smooth
    if (phase === APPEAR || phase === SWAP) {
        record.phase = STAY;
        record.from = record.to;
    } else if (phase === DISAPPEAR) {
        memory.delete(key)
    }
    record.pipe.shift()
    await forceRender()
    await onDone?.(record)
    if (record.pipe.length > 0) {
        memory.assign(record)
        memory.set(key, record)
        await forceRender()
    }
}


function useMotion(metaItems, onMotion) {
    const {current: positionMemory} = useRef(new Map())
    useMemo(_ => {
        for (let [index, state] of metaItems.entries()) {
            state.dx = state.dy = state.abs_dx =
                state.abs_dy = state.meta_dx = state.meta_dy = 0
            state.ref ??= createRef()
            try {
                const {phase, ref: {current: dom}} = state;
                if (phase === APPEAR) continue
                const {offsetLeft, offsetTop} = dom ?? {};
                positionMemory.set(index, {offsetLeft, offsetTop})
            } catch (e) {
                console.log('the next error in the state', state)
                console.error(e)
            }
        }
    }, [metaItems])

    useLayoutEffect(_ => {
        const locationCache = new LetMap(index => {
            let dom = metaItems[index].ref.current
            const {offsetLeft, offsetTop} = dom ?? {};
            return {offsetLeft, offsetTop}
        })

        for (let [i, state] of metaItems.entries()) {

            let {ref: {current: dom}, from, to, phase} = state
            state.dom = dom
            if (!dom) continue
            calculateVanillaTransform:{
                try {
                    if (state.phase === APPEAR) break calculateVanillaTransform
                    let {offsetLeft: leftFrom, offsetTop: topFrom} = positionMemory.get(i)
                    let {offsetLeft: leftTo, offsetTop: topTo} = dom ?? {}
                    state.trans_dx = leftFrom - leftTo;
                    state.trans_dy = topFrom - topTo;
                } catch {
                    state.trans_dy = state.trans_dx = 0
                }
            }
            calculateStrictTransform:{
                try {
                    if (phase !== SWAP) break calculateStrictTransform
                    let [posFrom, posTo] = [from, to].map(i => locationCache.let(i))
                    state.dx = posFrom.offsetLeft - posTo.offsetLeft;
                    state.dy = posFrom.offsetTop - posTo.offsetTop;
                } catch {
                    state.dx = state.dy = 0
                }
            }
            calculateMetaDiff:{
                try {
                    const {meta_from, meta_to} = state
                    let [posFrom, posTo] = [meta_from, meta_to].map(i => locationCache.let(i))
                    state.meta_dx = posFrom.offsetLeft - posTo.offsetLeft;
                    state.meta_dy = posFrom.offsetTop - posTo.offsetTop;
                } catch {
                    state.meta_dx = state.meta_dy = 0
                }
            }
        }
        // do callback after calculation so triggered it not disruption calculation
        for (let state of metaItems) {
            onMotion?.(state)
        }
    }, [metaItems])
    // because it runs on different timing
}

/** using the key on two runs of the running component ( with different array reference )
 to find which item added or removed */
const version = Symbol('ver')

export function useChangeIntersection(tracking, options = {}, postProcessing) {
    let {key, withRemoved = true, cacheBuster, exportHash} = options;
    key = key ?? options /*options consider as string*/;
    const current = [tracking].flat(1) // convert tracking to array
    const [before, ver] = usePrevious(current, [], [cacheBuster, tracking]);

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
        intersection[version] = ver;
        // register current items and assume they ADD
        for (let [i, item] of current.entries()) {
            let k = getKey(item, i);
            let state = {item, key: k, phase: APPEAR, from: i, to: i}
            hashMap.set(k, state)
            intersection.push(state)
        }
        // register previous items,compare location to understand if they Removed,Static, Move
        for (let [beforeIndex, item] of before.entries()) {
            let k = getKey(item, beforeIndex);
            let state = hashMap.get(k);
            let phase = state ? (beforeIndex === state.to) ? STAY : SWAP : DISAPPEAR;

            if (phase === DISAPPEAR) {
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

function WARNS(test, code, arg0, arg1, arg2) {
    const codes = {
        'overflow':
            `above then ${arg0} items pending to draw. consider faster your animation`,
        'deltaStyle':
            `delta style can be: "byPosition" or "byLocation", current:${arg0}`,
        'overtime':
            `the phase ${arg0} take more then ${arg1}ms to done, consider faster your animation or 
          add ${arg0} to options.skipPhases`,
    }

    test && console.warn(codes[code])
}

export default useAnimeManager