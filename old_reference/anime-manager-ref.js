//# inspiration from https://codesandbox.io/s/reorder-elements-with-slide-transition-and-react-hooks-flip-211f2?file=/src/AnimateBubbles.js
import React, {
    createRef,
    useRef,
    useState,
    useLayoutEffect,
    useMemo, useTransition,
    Component,
    createReactClass,
    useCallback,
} from "react";
import {useStateMemory} from "./hookStateMemory-ref.js";
import {WARNS} from "../src/warns.js";
import {keyGenerator, usePrevious, log} from "../src/helpers.js";
import {useRun, useRerun} from "@perymimon/react-hooks";

export const STAY = 'STAY', APPEAR = 'APPEAR', DISAPPEAR = 'DISAPPEAR', SWAP = 'SWAP';

function useRender() {
    const {current: resolvers} = useRef([]);
    const [cacheBuster, forceRender] = useState([]);
    const [isPending, startTransition] = useTransition();
    useLayoutEffect(_ => {
        for (let res of resolvers) res()
        resolvers.length = 0;
    })

    const render = useCallback(function () {
        return new Promise((res, rej) => {
            resolvers.push(res)
            startTransition(_ => {
                forceRender([])
            })
        })
    },[])

    return [render, cacheBuster , isPending];
}

/** * Main Hook */
export function useAnimeManager(tracking = [], options = {}) {
    const {onMotion, onDone, instantChange = false, overTimeWarning = 1000} = options;
    const {skip = []} = options;
    const memory = useStateMemory(overTimeWarning)
    const [forceRender, cacheBuster] = useRender();
    const intersection = useChangeIntersection(tracking, options);

    /** memoize */
    useRun(function memoizeStates() {
        log('memoize States');
        for (let state of intersection) {
            if (state.phase === STAY) continue;
            if (skip.includes(state.phase)) continue;
            state.ver = intersection[version]
            memory.push(state)
        }
    }, [intersection[version]])

    /** recreate records */
    const  records = useRerun(function rebuild() {
        log('rebuild records');
        const records = memory.sortedValues()
        for (let record of records) {
            record.done = done.bind(record, memory, forceRender, onDone, log)
        }
        WARNS(memory.size > 0 && (memory.size % 10) === 0, 'overflow', memory.size)
        return records
    }, [memory.needFlush])

    useMotion(records, onMotion)

    // const Traverse = useMemo(_ => createReactClass({
    //     render: function () {
    //         return (
    //                 "hello world"
    //
    //         );
    //     }
    // }), [])

    return records

}


async function done(memory, forceRender, onDone, debug) {
    const record = this;
    record.resetOverTimeWarning()
    let {key, phase} = record;
    if (phase === STAY) return;
    clearBetween:{
        record.dx = record.dy = record.meta_dx = record.meta_dy = 0;
        record.meta_from = record.meta_to     // make next animation smooth
        if (phase === APPEAR || phase === SWAP) {
            record.phase = STAY;
            record.from = record.to;
        } else if (phase === DISAPPEAR) {
            memory.delete(key)
        }
        await forceRender()
    }
    await onDone?.(record)
    record.pipe.shift()

    if (record.pipe.length > 0) {
        memory.set(key, record)
        await forceRender()
    }
}


/**
 * USE_MOTION
 */
function useMotion(metaItems, onMotion) {
    const {current: memory} = useRef(new Map())

    useMemo(_ => {
        for (let [i, state] of metaItems.entries()) {
            state.ref ??= createRef()
            state.dom = state.ref.current
            state.afterDelta = false
            if (state.phase === APPEAR) continue
            if (!state.dom) continue
            const {offsetLeft, offsetTop} = state.dom;
            memory.set(i, {offsetLeft, offsetTop})
        }
    }, [metaItems])

    useLayoutEffect(_ => {
        for (let state of metaItems) {
            state.dom = state.ref.current
        }

        for (let [i, state] of metaItems.entries()) {
            let {from, to, meta_from, meta_to, phase} = state
            if (!state.dom) continue
            beforeNowCompare:{
                if ([APPEAR, STAY].includes(state.phase)) break beforeNowCompare
                const before = memory.get(i), after = state.dom
                state.trans_dx = (before?.offsetLeft - after.offsetLeft) ?? 0;
                state.trans_dy = (before?.offsetTop - after.offsetTop) ?? 0;
            }
            fromToCompare:{
                if (phase !== SWAP) break fromToCompare
                const _from = metaItems[from]?.dom ?? memory.get(from),
                    _to = metaItems[to].dom
                state.dx = _from.offsetLeft - _to.offsetLeft;
                state.dy = _from.offsetTop - _to.offsetTop;
            }
            metaFromToCompare:{
                const from = metaItems[meta_from]?.dom ?? memory.get(meta_from),
                    to = metaItems[meta_to].dom
                state.meta_dx = (from?.offsetLeft - to.offsetLeft) ?? 0;
                state.meta_dy = (from?.offsetTop - to.offsetTop) ?? 0;
            }
        }
        // do callback after calculation so triggered it not disruption calculation
        for (let state of metaItems) {
            state.afterDelta = true
            onMotion?.(state)
        }
    }, [metaItems])
    // because it runs on different timing
}

/** using the key on two runs of the running component ( with different array reference )
 to find which item added or removed */
const version = Symbol('ver')

export function useChangeIntersection(tracking, options = {}, postProcessing) {
    let {key, withRemoved = true, exportHash} = options;
    key = key ?? options /*options consider as string*/;
    const current = [tracking].flat(1) // convert tracking to array
    const [before, ver] = usePrevious(current, [], [tracking]);

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

    }, [tracking])
}

export default useAnimeManager