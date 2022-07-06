import {useDataIntersection, VERSION, DISAPPEAR, STAY, SWAP, APPEAR} from "./useDataIntersection.js";
import {useRun, useLetMapQueue, useLetMap, useAsyncForceRender} from "@perymimon/react-hooks";
import {useRef, useCallback, useDebugValue} from "react";


export {DISAPPEAR, STAY, SWAP, APPEAR, VERSION}

const recordTemplate = (key) => ({
    item: null,
    key: key,
    from: 0,
    to: 0,
    phase: STAY,
})

// note: array records change reference when tracking change, but each record save reference per tracking id
export function useDataIntersectionWithFuture(tracking, key, options = {}) {
    const {skipPhases = [], onDone} = options
    const intersection = useDataIntersection(tracking, key, options);
    const {push, shift, peek, map} = useLetMapQueue()
    useDebugValue(map)
    const [forceRender, cacheBuster] = useAsyncForceRender()
    const recordsMap = useLetMap(recordTemplate)
    const records = useRef([]);

    const done = useCallback(async function done(key) {
        let record = recordsMap.get(key)
        if (record.phase === STAY) return;
        if (record.phase === DISAPPEAR) {
            recordsMap.delete(key)
        }
        record.from = record.to;
        record.phase = STAY;
        records.current = sortedMapValues(recordsMap, intersection[VERSION])
        onDone?.(record)
        await forceRender()
        shift(key)
        if (peek(key)) {
            recordsMap.set(key, record) // if deleted by DISAPPEAR done
            Object.assign(record, peek(key))
            if (skipPhases.includes(record.phase)) return done(key)
            records.current = sortedMapValues(recordsMap, intersection[VERSION])
            await forceRender()
        }
    })

    useRun(function memoizeStates() {
        for (let state of intersection) {
            const {item, key, ...slimState} = state;
            if (state.phase === STAY) continue;
            let record = recordsMap.let(key)
            record.item = item
            slimState.ver = intersection[VERSION]
            if (push(key, slimState)) {
                Object.assign(record, slimState)
                if (skipPhases.includes(record.phase))
                    done(key)
            }
        }
        records.current = sortedMapValues(recordsMap ,  intersection[VERSION])

    }, [intersection[VERSION]])


    return [records.current, done]
}

function sortedMapValues(map, ver) {
    let records = [...map.values()]
    records.sort((a, b) => {
        let cmp = a.to - b.to || a.from - b.from || b.ver - a.ver
        if (cmp !== 0) return cmp;
        if (a.phase === b.phase) return 0;
        if (a.phase === DISAPPEAR) return -1;
        if (b.phase === DISAPPEAR) return 1;
        return 0
    })
    records[VERSION] = ver
    return records
}
