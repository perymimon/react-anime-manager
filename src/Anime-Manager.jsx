//# inspiration from https://codesandbox.io/s/reorder-elements-with-slide-transition-and-react-hooks-flip-211f2?file=/src/AnimateBubbles.js
import React, {useRef, useState, useEffect, useLayoutEffect, useMemo} from "react";

const usePrevious = (value, initialValue) => {

    const ref = useRef(initialValue);

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref.current;
};

function useAppear() {
    const flag = useRef(true);

    useEffect(_ => {
        flag.current = false;
        return _ => flag.current = true;
    });

    return flag.current;
}

function difference(array1, array2, key) {
    let exports = [];
    for (let pos1 = 0; pos1 < array1.length; pos1++) {
        let item1 = array1[pos1];
        let pos2 = array2.findIndex(item2 => item1[key] === item2[key])
        if (pos2 === -1) {
            exports[pos1] = item1;
        }
    }
    return exports;
}

function useChangeIntersection(array, key) {
    const prevArray = usePrevious(array, []);
    return useMemo(_ => {
        const inserters = difference(array, prevArray, key);
        const removed = difference(prevArray, array, key);

        const union = [...array];
        removed.forEach((item, i) => union.splice(i, 0, item));

        const moved = {};
        prevArray.forEach((item1, i) => {
            moved[item1[key]] = [i, array.findIndex(item2 => item2[key] === item1[key])]
        })
        return {inserters, removed, moved, union};
    }, [array])
}

const calculateBoundingBoxes = (children, moved) => {
    const boxes = children.map(child => {
        const {x, y} = child.ref.current.getBoundingClientRect();
        return {x, y}
    })
    const diffs = [];
    for (let child, i = 0; child = children[i]; i++) {
        if (!moved[child.key]) continue;
        const [from, to] = moved[child.key];
        if (to === from || to === -1 || from === -1) continue;
        diffs[i] = {
            x: boxes[from].x - boxes[to].x,
            y: boxes[from].y - boxes[to].y
        }
    }

    return diffs;
};

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
        classAppear = 'xyz-appear', classMove='xyz-in',
        xCssProperty = '--xyz-translate-x', yCssProperty = '--xyz-translate-y',
        ...restProps
    } = props;

    const isAppear = useAppear();
    const [_, forceRender] = useState()
    /*
        if children is not Array convert it to array
        and add 'ref' so we can reference to the DOM later
    */
    children = useMemo(_ => {
        children = [children].flat(1).filter(React.isValidElement);
        return children.map(child => ({...child, ref: React.createRef(), key: child.key || 'anime-constant-key'}))
    }, [children])
    const {inserters, removed, union, moved} = useChangeIntersection(children, 'key')

    const handleRemove = (child) => {
        return function (event) {
            let i = union.findIndex(c => child.key === c.key)
            union.splice(i, 1);
            // event.target.classList.remove(classIn,classOut)
            forceRender([])
        }
    }

    useLayoutEffect(_ => {
        const diffs = calculateBoundingBoxes(union, moved);

        diffs.forEach((diff, i) => {
            let dom = union[i].ref.current;
            dom.setAttribute('xyz', '');
            if (xCssProperty && diff.x)
                dom.style.setProperty(xCssProperty, `${diff.x}px`);
            if (yCssProperty && diff.y)
                dom.style.setProperty(yCssProperty, `${diff.y}px`);

            dom.classList.add(... classMove.split(' '));
        })
        removed.forEach(child => {
            let dom = child.ref.current;
            dom.classList.add( ... classOut.split(' '))
            dom.onanimationend = handleRemove(child);
        })

        inserters.forEach(child => {
            let dom = child.ref.current;
            let classes = isAppear ? (classAppear || classIn) : classIn
            dom.classList.add(...classes.split(' '));
        })

    }, [children])

    function handleAnimationEnd(event) {
        const dom = event.target;
        /* normalize classOut='xzy-out xyz-absolute' classIn='xyz-in'*/
        const classes = [classOut, classIn, classNested, classAppear, classMove]
            .join(' ').split(' ').filter(Boolean);
        dom.classList.remove(...classes);
        dom.removeAttribute('xyz');
        dom.style.removeProperty(xCssProperty);
        dom.style.removeProperty(yCssProperty);
    }

    return <xyz-context
        {...restProps}
        style={props.style}
        onAnimationEnd={handleAnimationEnd}>
        {union}
    </xyz-context>;
}

