import {
    useAnimeManager, SWAP,
    ADD, REMOVE, STATIC, PREREMOVE
} from "../../anime-manager"
// LoginForm.stories.js|jsx

import {within, userEvent} from '@storybook/testing-library';
import React, {useEffect, useRef, useState} from "react";
import '@animxyz/core'


export default {
    title: "Test",
    id: "test",
    argTypes: {
        add: {action: true},
    },
    args: {
        list: [3, 2, 1],
        add() {

        }

    },
}


const xyz = "appear-narrow-50% appear-fade-100% out-right-100%";


function ToolBar(props) {
    const {onAdd, onRemove} = props;

    const removeInput = useRef(null);
    const addInput = useRef(null);

    function handleAdd() {
        onAdd(+addInput.current.value);
    }

    function handleRemove() {
        onRemove(+removeInput.current.value);
    }

    return <div style={{display: 'grid', gridTemplateColumns: '10em 10em'}}>
        <button onClick={handleRemove}>remove from</button>
        <input ref={removeInput} type="text" id="remove-from" defaultValue={1}/>
        <button onClick={handleAdd}>add in</button>
        <input ref={addInput} type="text" id="add-from" defaultValue={0}/>
    </div>
}

function add(internalList, setList, counterRef, index) {
    internalList.splice(index, 0, ++counterRef.current);
    setList([...internalList]);
}

function remove(internalList, setList, counterRef, index) {
    let pos = Math.min(internalList.length - 1, +index);
    setList(internalList.filter((c, i) => i !== pos));
}


function onAnimationEnd({dom}) {
    dom.classList.remove('xyz-appear')
    dom.classList.remove('xyz-in')
}

export function List({list}) {
    const [internalList, setList] = useState(list)
    const counterRef = useRef(list.length)
    const items = useAnimeManager(internalList, {onEffect, onAnimationEnd});

    function onEffect({dom, phase, dx, dy}) {
        const state2class = {
            [ADD]: "xyz-appear",
            [REMOVE]: "xyz-out xyz-absolute",
            [PREREMOVE]: "xyz-absolute",
            [REMOVE]: "xyz-out xyz-absolute",
            [SWAP]: "xyz-in",
            [STATIC]: 'static'
        }
        dom.style.setProperty("--xyz-translate-y", `${dy}px`)
        if (!dom.classList.contains(state2class[phase])) {
            dom.classList.add(...state2class[phase].split(' '))
        }
    }

    return <div>
        <ToolBar
            onAdd={add.bind(this, internalList, setList, counterRef)}
            onRemove={remove.bind(this, internalList, setList, counterRef)}
        />
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
}

List.play = async function ({canvasElement}) {
    const canvas = within(canvasElement)

    // // add to row 0
    // // userEvent.type(canvas.getByLabelText('add-from'), '0')
    // // add element
    // await userEvent.click(canvas.getByText('add in'))
    //
    // // remove element
    // await userEvent.click(canvas.getByText('remove from'))
}

export function List2AbsMove({list}) {
    const [internalList, setList] = useState(list)
    const counterRef = useRef(list.length)
    const items = useAnimeManager(internalList, {onEffect, onAnimationEnd});

    function onEffect({dom, phase, trans_dx, trans_dy}) {
        const state2class = {
            [ADD]: "xyz-appear",
            [REMOVE]: "xyz-out xyz-absolute",
            [PREREMOVE]: "xyz-absolute",
            [REMOVE]: "xyz-out xyz-absolute",
            [SWAP]: "xyz-in",
            [STATIC]: 'static'
        }
        dom.style.setProperty("--xyz-translate-y", `${trans_dy}px`)
        if (!dom.classList.contains(state2class[phase])) {
            dom.classList.add(...state2class[phase].split(' '))
        }
    }

    return <div>
        <ToolBar
            onAdd={add.bind(this, internalList, setList, counterRef)}
            onRemove={remove.bind(this, internalList, setList, counterRef)}
        />

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

}

export function List2MetaMove({list}) {
    const [internalList, setList] = useState(list)
    const counterRef = useRef(list.length)
    const items = useAnimeManager(internalList, {onEffect, onAnimationEnd});

    function onEffect({dom, phase, meta_dx, meta_dy}) {
        const state2class = {
            [ADD]: "xyz-appear",
            [REMOVE]: "xyz-out xyz-absolute",
            [SWAP]: "xyz-in",
            [STATIC]: 'static'
        }
        dom.style.setProperty("--xyz-translate-y", `${meta_dy}px`)
        if (!dom.classList.contains(state2class[phase])) {
            dom.classList.add(...state2class[phase].split(' '))
        }
    }

    return <div>
        <ToolBar
            onAdd={add.bind(this, internalList, setList, counterRef)}
            onRemove={remove.bind(this, internalList, setList, counterRef)}
        />
        todo:  make meta run just when item removed from current
        <ol className="list-1" xyz={xyz} style={{animationDuration: '3s'}}>
            {items.map((state) => {
                    const {item: number, meta_phase, phase, ref, done, meta_dx, meta_dy,from,to, meta_from,meta_to,} = state;
                    return <li key={'key' + number}
                               className="item"
                               ref={ref}
                               onAnimationEnd={done}
                    >item:{number} from:{meta_from}({from}) to:{meta_to}({to}) meta_dx:{~~meta_dx} meta_dy:{~~meta_dy} {meta_phase} {phase}</li>
                }
            )}
        </ol>

    </div>

}
