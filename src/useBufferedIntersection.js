import {useChangeIntersection, VERSION, DISAPPEAR, STAY, SWAP, APPEAR} from "./useChangeIntersection.js";
import {useRun,useLetMapQueue, useLetMap, useAsyncForceRender} from "@perymimon/react-hooks";
import {useRef, useCallback} from "react";


export {DISAPPEAR, STAY, SWAP, APPEAR, VERSION}

const recordTemplate = (key) => ({
    item: null,
    key: key,
    from: 0,
    to: 0,
    phase: STAY,
})


export function useBufferedIntersection(tracking, skip = [], options) {

    const intersection = useChangeIntersection(tracking, options);
    const {push, shift, peek} = useLetMapQueue()
    const [forceRender, cacheBuster] = useAsyncForceRender()
    const map = useLetMap(recordTemplate)
    const records = useRef([]);

    const done = useCallback(async function done(key) {
        let record = map.get(key)
        if (record.phase === STAY) return;
        if (record.phase === DISAPPEAR) {
            map.delete(key)
        }
        record.from = record.to;
        record.phase = STAY;
        records.current = sortedValues(map)
        await forceRender()
        shift(key)
        if (peek(key)) {
            map.set(key, record)
            Object.assign(record, peek(key))
            if (skip.includes(record.phase)) return done(key)
            records.current = sortedValues(map)
            await forceRender()
        }
    })

    useRun(function memoizeStates() {

        for (let state of intersection) {
            const {item, key, ...slimState} = state;
            if (state.phase === STAY) continue;
            let record = map.let(key)
            record.item = item
            state.ver = intersection[VERSION]
            if (push(key, slimState)) {
                Object.assign(record, slimState)
                if (skip.includes(record.phase))
                     done(key)
            }
        }

        records.current = sortedValues(map)

    }, [intersection[VERSION]])



    return [records.current, done]
}

function sortedValues(map) {
    let records = [...map.values()]
    records.sort((a, b) => {
        let cmp = a.to - b.to || a.from - b.from || b.ver - a.ver
        if (cmp !== 0) return cmp;
        if (a.phase === b.phase) return 0;
        if (a.phase === DISAPPEAR) return -1;
        if (b.phase === DISAPPEAR) return 1;
        return 0
    })
    return records
}
