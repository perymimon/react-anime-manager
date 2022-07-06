import {useLayoutEffect, useMemo, useRef} from "react";
import {useLetMap} from "@perymimon/react-hooks";

export function useTraceMovement(refs = [], onMotion) {
       const memory =  useLetMap()
    /** before render **/
    useMemo(_ => {
        for (let [i, state] of refs.entries()) {
            state.afterMovement = false
            const {offsetLeft, offsetTop} = state.ref?.current ?? {}
            memory.set(i, {offsetLeft, offsetTop})
            // state.meta_from ??= i
            // state.meta_to = i
        }
    }, [refs])

    /** after render **/
    useLayoutEffect(_ => {
        // reset all stat's dom before calculation
        for (let [i, state] of refs.entries()){
            state.dom = state.ref?.current
        }
        for (let [i, state] of refs.entries()) {
            if (!state.dom) continue;
            beforeNowCompare:{
                const before = memory.get(i), after = state.dom;
                state.time_dx = (before?.offsetLeft - after.offsetLeft) || 0;
                state.time_dy = (before?.offsetTop - after.offsetTop) || 0;
            }
            // fromToCompare:{
            //     state.fromTo_dx = state.fromTo_dy = 0;
            //     const {from, to} = state;
            //     if (from === to) break fromToCompare
            //     const _from = refs[from]?.dom ?? memory.get(from),
            //     state.fromTo_dx = refs[from]?.dom.offsetLeft - refs[to]?.dom.offsetLeft;
            //     state.fromTo_dy = _from.offsetTop - _to.offsetTop;
            // }
            // metaFromToCompare:{
            //     const from = refs[meta_from]?.dom ?? memory.get(meta_from),
            //         to = refs[meta_to].dom
            //     state.meta_dx = (from?.offsetLeft - to.offsetLeft) ?? 0;
            //     state.meta_dy = (from?.offsetTop - to.offsetTop) ?? 0;
            // }
        }
        // do callback after calculation so triggered it not disruption calculation
        for (let state of refs) {
            state.afterMovement = true
            onMotion?.(state)
        }
    }, refs)
    // because it runs on different timing
}

export default useTraceMovement