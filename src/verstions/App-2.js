import '../App.css';
import '@animxyz/core'
import React, {useRef, useState, useEffect, useLayoutEffect, Children} from "react";
// ReactDOM.findDOMNode(component)

const usePrevious = (value, initialValue) => {

    const ref = useRef(initialValue);

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref.current;
};
const useDiffBoundingBoxes = children => {

    const refBoxes = useRef({});
    const refDiff = useRef({});
    const prevBoxes = refBoxes.current;

    useEffect(() => {
        const boxes = calculateBoundingBoxes(children);
        children.forEach(child => {
            const box1 = boxes[child.key];
            const box2 = prevBoxes[child.key];

            refDiff.current[child.key] = {
                x: box2 ? box2.x - box1.x : 0,
                y: box2 ? box2.y - box1.y : 0
            }
        })
        refBoxes.current = boxes;
    }, [children]);


    return refDiff.current
};

function arrayToMap(array, key) {
    return array.reduce((map, item) => {
        map[item[key]] = item
        return map;
    }, {})
}

const calculateBoundingBoxes = children => {
    const boundingBoxes = {};

    React.Children.forEach(children, child => {
        const domNode = child.ref.current;
        const nodeBoundingBox = domNode.getBoundingClientRect();

        boundingBoxes[child.key] = nodeBoundingBox;
    });

    return boundingBoxes;
};

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
    const save = [...array];
    const prevArray = usePrevious(save, []);

    const inserters = difference(array, prevArray);
    const removed = difference(prevArray, array);

    removed.forEach((item, i) => save.splice(i, 0, item));


    return {inserters, removed, moved, union:save};
}

function useAppear() {
    const flag = useRef(true);

    useEffect(_ => {
        flag.current = false;
        return _ => flag.current = true;
    });

    return flag.current;
}

/*
* steps to make it work
* 1) if item in previous render not exist add it back to the same position as before and mark it with "delete" flag
*   a) listen to endanimation or endtranstion event or done() callback to remove it completely from the list
*   b) render the list again by React render
* 2) if item on the new children not exist at previous marked it as "new" flag
*
* */
function Anime({children, ...props}) {
    const {
        classIn = 'xyz-in', classOut = 'xyz-out',
        xCssProperty = '--xyz-translate-x', yCssProperty = '--xyz-translate-y',
        xyzAppear, xyz, xyzMove
    } = props;

    const isAppear = useAppear();

    children = children.map(child => React.cloneElement(child, {ref: React.createRef()}))

    const {inserters, removed, moved, joined} = useChangeIntersection(children, 'key');
    // /*add removed childes*/
    // removed.forEach((child, i) => {
    //     children.splice(i, 0, child)
    // });

    const [animeChildren, setChildren] = useState(children);
    // const diffBoxes = useDiffBoundingBoxes(children)


    const handleRemove = (child) => {
        return function (event) {
            let i = children.findIndex(c => child.key === c.key)
            children.splice(i, 1);
            // event.target.classList.remove(classIn,classOut)
            setChildren([...children])
        }
    }
    const handleInsert = (child) => {
        return function (event) {
            // event.target.classList.remove(classIn, classOut)
        }
    }

    useLayoutEffect(_ => {
        const boxes = calculateBoundingBoxes(children);

        children.forEach((child, i) => {
            const domNode = child.ref.current;
            const from = moved[i], to = i;
            if (from !== to) {
                domNode.setAttribute('xyz', '');
                const box1 = boxes[to], box2 = boxes[from];
                const diffX = box1.x - box2.x;
                const diffY = box1.y - box2.y;
                xCssProperty && domNode.style.setProperty(xCssProperty, `${diffX}px`);
                yCssProperty && domNode.style.setProperty(yCssProperty, `${diffY}px`);
                domNode.classList.toggle(classIn, false);
                domNode.classList.toggle(classOut, false);
                requestAnimationFrame(_=>{
                    domNode.classList.toggle(classIn, true);
                })
            }
        })
        inserters.forEach((child, i) => {
            const domNode = child.ref.current;
            domNode.setAttribute('xyz', isAppear ? xyzAppear : xyz);
            domNode.classList.toggle(classIn, true);
            domNode.classList.toggle(classOut, false);
            domNode.onanimationend = handleInsert(child)
        })

        removed.forEach((child, i) => {
            const domNode = child.ref.current;
            domNode.setAttribute('xyz', xyz);
            domNode.classList.toggle(classOut, true);
            domNode.classList.toggle(classIn, false);
            domNode.onanimationend = handleRemove(child)
        })


    })

    return children;
}


let counter = 3;

function App() {
    const [list, setList] = useState([1, 2, 3])

    function add() {
        // let pos = ~~(Math.random() * list.length);
        // list.splice(pos, 0, ++counter);
        list.push(++counter);
        setList([...list])
    }

    function remove() {
        // let pos = ~~(Math.random() * list.length);
        // list.splice(pos, 1)
        list.pop();
        setList([...list]);
    }

    return (
        <div className="App">
            <ul>
                <Anime xyzAppear="stagger-2 narrow-100%" xyz="narrow-100%">
                    {list.map((number) => <li key={number} className="item">{number}</li>)}
                </Anime>
            </ul>
            <button onClick={add.bind(0)}>add in random</button>
            <button onClick={remove.bind(0)}>remove from random</button>
        </div>

    );
}

export default App;
