//inspired https://medium.com/welldone-software/usecallback-might-be-what-you-meant-by-useref-useeffect-773bc0278ae
import {cloneElement, createRef, useCallback, useDebugValue, useLayoutEffect, useRef} from "react";
import {useLetMap, useRun, useArrayToMap} from '@perymimon/react-hooks';

const META = Symbol("meta");
const transitionTemplate = (key) => ({
    dx: 0, dy: 0, isMove: false, offsetLeft: NaN, offsetTop: NaN
});

export function useTraceMovement(records, keyName, options = {}) {
    const {onMove} = options;
    const recordMap = useArrayToMap(records, keyName)
    const motionMap = useLetMap(transitionTemplate)
    useDebugValue(motionMap)
    const jsxFactory = useRef(null)

    const jsxTemplate = useCallback((record, motion) => {
        return cloneElement(jsxFactory.current(record, motion), {
            key: record[keyName], ref: createRef()
        })
    }, [keyName])

    const thereIsCallback = onMove instanceof Function;
    const jsxMap = useLetMap(key => jsxTemplate(recordMap.get(key), motionMap.let(key)))

    // run every time after layout is done, to update records change,
    useLayoutEffect(() => {
        {
            // skip this update if user not read the second parameter, one with the movement state
            const funcParameters = jsxFactory.current?.length
            const jsxGeneratorUseMoveStateParameter = funcParameters >= 2
            if (!jsxGeneratorUseMoveStateParameter || !thereIsCallback) return;
        }
        for (let record of records) {
            let key = record[keyName]
            let motion = motionMap.let(key)
            let dom = jsxMap.get(key).ref.current
            record.dom = dom
            let move = {
                dx: (motion.offsetLeft - dom.offsetLeft) || 0,
                dy: (motion.offsetTop - dom.offsetTop) || 0,
            }
            motion.offsetLeft = dom.offsetLeft
            motion.offsetTop = dom.offsetTop
            if (move.dx !== 0 || move.dy !== 0) {
                Object.assign(motion, {
                    ...move,
                    dom, // todo: maybe should be record.dom
                    offsetLeft: dom.offsetLeft,
                    offsetTop: dom.offsetTop,
                    isMove: true
                });

                let callRerender = onMove?.(record, motion) // if user want to force rerender, return explicit true
                jsxMap.set(key, jsxTemplate(record, motion) , !thereIsCallback || callRerender === true)
            }
        }
    }, [records])
    // update cache before useEEffect  but external to `transitions` to let useEEffect do it thing
    useRun(() => {
        // clear it so transitions will create them from scratch JIT and then serve after effect version
        jsxMap.clear()
    }, [records])
    // todo: what happen if map will run 2th with two callbacks ?
    const transitions = useCallback((jsxCallback) => {
        jsxFactory.current = (jsxCallback)
        return records.map(record => jsxMap.let(record[keyName]))
    }, [records])

    const reset = useCallback(function done(key) {
        let motion = motionMap.get(key)
        motion.isMove = false
        motion.dx = motion.dy =  0;
    },[])

    return [transitions, reset]

}