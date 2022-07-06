//inspired https://medium.com/welldone-software/usecallback-might-be-what-you-meant-by-useref-useeffect-773bc0278ae
import {cloneElement, createRef, useCallback, useDebugValue, useLayoutEffect, useRef} from "react";
import {useLetMap, useRun, useArrayToMap} from '@perymimon/react-hooks';

const META = Symbol("meta");
const transitionTemplate = (key) => ({
    dx: 0, dy: 0, isMove: false, offsetLeft: NaN, offsetTop: NaN
});

export function useTraceMovement(records, keyName) {
    const recordMap = useArrayToMap(records, keyName)
    const stateMap = useLetMap(transitionTemplate)
    useDebugValue(stateMap)
    const jsxFactory = useRef(null)

    const jsxTemplate = useCallback((record, state) => {
        return cloneElement(jsxFactory.current(record, state), {
            key: record[keyName], ref: createRef()
        })
    }, [keyName])

    const jsxMap = useLetMap(key => jsxTemplate(recordMap.get(key), stateMap.let(key)))

    // run every time after layout is done, to update records change,
    useLayoutEffect(() => {
        // skip this update if user not read the second parameter, one with the movement state
        const funcParameters = jsxFactory.current?.length
        if(funcParameters === undefined || funcParameters < 2) return;

        for (let record of records) {
            let key = record[keyName]
            let state = stateMap.let(key)
            let dom = jsxMap.get(key).ref.current
            let move = {
                dx: (state.offsetLeft - dom.offsetLeft) || 0,
                dy: (state.offsetTop - dom.offsetTop) || 0,
            }
            state.offsetLeft = dom.offsetLeft
            state.offsetTop = dom.offsetTop
            if (move.dx !== 0 || move.dy !== 0) {
                Object.assign(state, {
                    ...move,
                    offsetLeft: dom.offsetLeft,
                    offsetTop: dom.offsetTop,
                    isMove: true
                });
                jsxMap.set(key, jsxTemplate(record, state))
            }
        }
    }, [records])
    // update cache before useEEffect  but external to `transitions` to let useEEffect do it thing
    useRun(() => {
        // if (!jsx.current) return
        // for (let record of records) {
        //     let key = record[keyName]
        //     let state = stateMap.let(key)
        //     jsxMap.set(key, jsxTemplate(record, state))
        // }
        // clear it so transitions will create them from scratch JIT and then serve after effect version
        jsxMap.clear()
    }, [records])
    // todo: what happen if map will run 2th with two callbacks ?
    const transitions = useCallback((jsxCallback) => {
        jsxFactory.current = (jsxCallback)
        return records.map(record => jsxMap.let(record[keyName]))
    }, [records])

    const reset = useCallback(function done(key) {
        let state = stateMap.get(key)
        state.isMove = false
        state.dx = state.dy =  0;
    },[])

    return [transitions, reset]

}