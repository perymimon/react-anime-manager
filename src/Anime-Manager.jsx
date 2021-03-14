//# inspiration from https://codesandbox.io/s/reorder-elements-with-slide-transition-and-react-hooks-flip-211f2?file=/src/AnimateBubbles.js
import React, {useRef, useState, useEffect, useLayoutEffect, useMemo} from "react";
import {func} from "prop-types";

const STATIC = 'static', ADDED = 'added', REMOVED = 'removed', MOVE = 'move';

const usePrevious = (value, initialValue, refValue) => {
    const ref = useRef(initialValue);
    useEffect(() => {
        ref.current = value;
    }, [refValue ?? value]);
    return ref.current;
};

function useAppear() {
    const flag = useRef(true);

    useEffect(_ => {
        flag.current = false;
        return _ => flag.current = true;
    }, []);

    return flag.current;
}

/** just use the key on two runs of the running component ( with different array reference )
 to find which item added or removed */
function useChangeIntersection(array, key) {
    const currentArray = [array].flat(1)
    const prevArray = usePrevious(currentArray, []);

    return useMemo(_ => {
        const unionMap = new Map()

        for (let [i, item] of prevArray.entries()) {
            unionMap.set(item[key], {
                item, key: item[key], phase: REMOVED, from: i, to: -1
            })
        }

        for (let [i, item] of currentArray.entries()) {
            let k = item[key];
            let state = unionMap.get(k);
            let phase = state ? (i === state.from) ? STATIC : MOVE : ADDED;
            unionMap.set(k, {
                key: k, from: -1, ...state, item, phase, to: i,
            })
        }

        const unionOrder = currentArray.map(item => item.key);
        for (let [key, obj] of unionMap) {
            if (obj.phase !== REMOVED) continue;
            unionOrder.splice(obj.from, 0, obj.key);
        }

        return unionOrder.map(key => unionMap.get(key))
    }, [array])
}

function useDebounceRender() {
    const [renderRequested, forceRender] = useState(false);

    function render() {
        if (renderRequested === true) return;
        window.requestAnimationFrame(_ => {
            console.log('forceRender');
            forceRender(true);
            forceRender(false);
        })
    }

    return render;
}

function useAnimeManager(children, key, layoutEffect) {
    let statedChildren = useChangeIntersection(children, key);
    const forceRender = useDebounceRender();

    function doneFactory(state) {
        const {item, phase} = state;
        return function done() {
            console.log('done factory');

            if (phase === ADDED || phase === MOVE) {
                state.phase = STATIC;
                return forceRender();
            }
            if (phase === REMOVED) {
                const index = statedChildren.findIndex((state) => state.key === item.key);
                statedChildren.splice(index, 1);
                return forceRender();
            }
        }
    }

    return useMemo((_)=> statedChildren.map(function (state) {
        state.ref = React.createRef();
        state.done = doneFactory(state);
        return state;
    }),[statedChildren])
}

function useAnimeEffect(states) {
    const boxMap = new Map();
    const prevBoxMap = usePrevious(boxMap, null, states);
    const forceRender = useDebounceRender();
    states.forEach((state, i) => {
        state.dx = state.dx ?? 0;
        state.dy = state.dy ?? 0;
    })

    useLayoutEffect(function () {
        console.log('useAnimeEffect');
        states.forEach((state, i) => {
            const {ref, key, from, to} = state;
            let dom = state.dom = ref.current ?? null;
            if (!dom) return;
            const box = dom?.getBoundingClientRect() ?? null;
            boxMap.set(key, box);
            const prevBox = prevBoxMap?.get(key);
            if(prevBox){
                state.dx = prevBox.x - box.x;
                state.dy = prevBox.y - box.y;
            }
        })
        forceRender();

    },[states]);
}

/**
 * ANIME
 * @param children
 * @param props
 * @returns Components
 * @constructor
 */
export default function AnimeManager({children, ...props}) {
    const {
        classIn = 'xyz-in', classOut = 'xyz-out', classNested = 'xyz-nested',
        classAppear = 'xyz-appear', classMove = 'xyz-in',
        xCssProperty = '--xyz-translate-x', yCssProperty = '--xyz-translate-y',
        ...restProps
    } = props;

    const isAppear = useAppear();
    /** if children is not Array convert it to array
     and add 'ref' so we can reference to the DOM later */

    const childrenState = useAnimeManager(children, 'key');
    const state2class = {
        "added": (isAppear ? classAppear : classIn) ?? classIn,
        "removed": classOut,
        "move": classIn,
        "static": ''
    }

    useAnimeEffect(childrenState)

    const childrenAnime = childrenState.map(function ({item: child, phase, dx, dy, ref, done}) {
        let {className} = child.props;
        return React.cloneElement(child, {
            className: [className, state2class[phase]].join(' '),
            xyz: phase == MOVE ? '' : undefined,
            ref: ref,
            style:{[yCssProperty]:`${dy}px`},
            onAnimationEnd: done
        })
    })

    return <xyz-context {...restProps} style={props.style}>
        {childrenAnime}
    </xyz-context>;
}

