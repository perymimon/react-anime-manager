//# inspiration from https://codesandbox.io/s/reorder-elements-with-slide-transition-and-react-hooks-flip-211f2?file=/src/AnimateBubbles.js
import {useCallback, useDebugValue} from "react";
import {WARNS} from "./warns.js";
import {debounce} from "./helpers.js";
import {useDataIntersectionWithFuture, VERSION, DISAPPEAR, STAY, SWAP, APPEAR} from "./useDataIntersectionWithFuture.js";
import {useTraceMovement} from "./useTraceMovement.js";
import {useRun} from "@perymimon/react-hooks";

export {DISAPPEAR, STAY, SWAP, APPEAR, VERSION}

function timeoutWarning(record, time) {
    WARNS(record.phase !== STAY, 'overtime', record.phase, time, record)
}

const META = Symbol('meta');

/** * Main Hook */
export function useAnimeManager(tracking = [], key, options = {}) {
    const {onDone, maxAnimationTime = 1000} = options;

    const handleDone = useCallback(function (record) {
        record[META].timeoutWarning()
        record.meta_from = record.meta_to;
        onDone?.(record)
    })
    options.onDone = handleDone;
    options.exportHash = false;
    options.withRemoved = true;
    // note: records change reference when tracking change, but each record have persisted reference
    const [records, done] = useDataIntersectionWithFuture(tracking, key, options);
    const [transitions,reset] = useTraceMovement(records, 'key', options );

    useRun(() => {
        for (let [i, record] of records.entries()) {
            record.done ??= () => {
                done(record.key)
                reset(record.key)
            }
            record[META] ??= {
                timeoutWarning: debounce(timeoutWarning.bind(null, record), maxAnimationTime)
            }
            record.meta_from ??= i
            record.meta_to = i

            // [v] check overTimeWarning
            // [v] call onDone
            // [v] track meta_from and meta_to
            // [v] done reset also meta_from and meta_to
            // [v] attach done() to every record
            // [v] add dx,dy to every record
            // [v] update dx,dy just after move

            // use motion to trigger onMotion
        }
    }, records)

    useDebugValue(records)
    return [records, transitions , done]
}


/**
 * USE_MOTION
 */

/** using the key on two runs of the running component ( with different array reference )
 to find which item added or removed */




export default useAnimeManager