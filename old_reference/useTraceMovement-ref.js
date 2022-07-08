import {createRef, useLayoutEffect, useMemo, useRef} from "react";
import {STAY} from "../src/useDataIntersection.js";

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
