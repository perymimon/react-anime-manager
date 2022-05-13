import {
    useAnimeManager, MOVE,
    ADD, REMOVE, STATIC, PREREMOVE
} from "../../Anime-Manager"

import React, {useEffect, useRef, useState} from "react";
import '@animxyz/core'


export default {
    title: "Test",
    id: "test",
    argTypes: {
        add: {action: true},
    },
    args: {
        list: [1, 2, 3],
        add() {

        }

    },
}

const state2class = {
    [ADD]: "xyz-appear",
    [REMOVE]: "xyz-out xyz-absolute",
    [PREREMOVE]: "xyz-absolute",
    [REMOVE]: "xyz-out xyz-absolute",
    [MOVE]: "xyz-in",
    [STATIC]: 'static'
}
const xyz = "appear-stagger-2 appear-narrow-50% appear-fade-100% out-right-100%";

export function List({list}) {
    const [internalList, setList] = useState(list)
    const counter = useRef(list.length)
    const items = useAnimeManager(internalList, {onEffect, onAnimationEnd});

    function onEffect({dom, phase, dx, dy}) {
        dom.style.setProperty("--xyz-translate-y", `${dy}px`)
        dom.classList.add(...state2class[phase].split(' '))
    }

    function onAnimationEnd({dom}) {
        dom.classList.remove('xyz-appear')
        dom.classList.remove('xyz-in')
    }

    return <div>
        <div style={{display: 'grid', gridTemplateColumns: '10em 10em'}}>
            <button onClick={remove}>remove from</button>
            <input type="text" id="remove-from" defaultValue={1}/>
            <button onClick={add}>add in</button>
            <input type="text" id="add-from" defaultValue={0}/>
        </div>

        <ol className="list-1" xyz={xyz} style={{animationDuration: '3s'}}>
            {items.map((state) => {
                    const {item: number, phase, ref, done, dx, dy, from, to} = state;
                    return <li key={'key' + number}
                               className="item"
                               ref={ref}
                               onAnimationEnd={done}
                    >item:{number} from:{from} to:{to} dx:{~~dx} dy:{~~dy} {phase}</li>
                }
            )}
        </ol>

    </div>

    function add() {
        let index = document.getElementById('add-from').value;
        internalList.splice(+index, 0, ++counter.current)
        setList([...internalList]);
    }

    function remove() {
        let index = document.getElementById('remove-from').value;
        let pos = Math.min(internalList.length - 1, +index);
        setList(internalList.filter((c, i) => i !== pos));
    }
}

export function List2AbsoluteMove({list}) {
    const [internalList, setList] = useState(list)
    const counter = useRef(list.length)
    const items = useAnimeManager(internalList, {onEffect, onAnimationEnd});

    function onEffect({dom, phase, trans_dx, trans_dy}) {
        dom.style.setProperty("--xyz-translate-y", `${trans_dy}px`)
        dom.classList.add(...state2class[phase].split(' '))
    }

    function onAnimationEnd({dom}) {
        dom.classList.remove('xyz-appear')
        dom.classList.remove('xyz-in')
    }

    return <div>
        <div style={{display: 'grid', gridTemplateColumns: '10em 10em'}}>
            <button onClick={remove}>remove from</button>
            <input type="text" id="remove-from" defaultValue={1}/>
            <button onClick={add}>add in</button>
            <input type="text" id="add-from" defaultValue={0}/>
        </div>

        <ol className="list-1" xyz={xyz} style={{animationDuration: '3s'}}>
            {items.map((state) => {
                    const {item: number, phase, ref, done, trans_dx, trans_dy, from, to} = state;
                    return <li key={'key' + number}
                               className="item"
                               ref={ref}
                               onAnimationEnd={done}
                    >item:{number} from:{from} to:{to} trans_dx:{~~trans_dx} trans_dy:{~~trans_dy} {phase}</li>
                }
            )}
        </ol>

    </div>

    function add() {
        let index = document.getElementById('add-from').value;
        internalList.splice(+index, 0, ++counter.current)
        setList([...internalList]);
    }

    function remove() {
        let index = document.getElementById('remove-from').value;
        let pos = Math.min(internalList.length - 1, +index);
        setList(internalList.filter((c, i) => i !== pos));
    }
}
