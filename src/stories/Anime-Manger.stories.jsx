import {useAnimeManager, useAnimeEffect, MOVE, useAppear, ADD, REMOVE, STATIC} from "../Anime-Manager";
import React, {useEffect, useRef, useState} from "react";
import '@animxyz/core'
import './Anime-Manger.stories.css'
import {jsxDecorator} from "storybook-addon-jsx";


export default {
    title: 'Components/AnimeManger',
    decorators: [jsxDecorator],
    args: {
        xyz: "appear-stagger-2 appear-narrow-50% appear-fade-100% out-right-100%",
        style: {'--xyz-appear-duration': '3s'},
        xCssProperty: "--xyz-translate-x",
        yCssProperty: "--xyz-translate-y",
    },
    argTypes: {}
}

const state2class = {
    [ADD]: "xyz-appear",
    [REMOVE]: "xyz-out xyz-absolute",
    [MOVE]: "xyz-in",
    [STATIC]: ''
}


export const CounterMultiChildren = function ({...args}) {
    console.log('-------------------------');

    const [count, setCounter] = useState(1)
    const states = useAnimeManager(count)
    // states = [{item:1, phase:'add', from:-1, to:0, done}]
    useEffect(_ => {
        setTimeout(_ => {
            setCounter(count + 1);
        }, 1500)
    }, [count])

    // states = [
    //  {item:1, phase:'remove', from:0, to:-1, done},
    //  {item:2, phase:'add', from:-1, to:0, done}
    // ]
    return states.map(({item: number, key, phase, done}) => (
        <div xyz={args.xyz} key={key} className={"item " + state2class[phase]}
             onAnimationEnd={done}>{number}</div>
    ))
    // after `done()` called on item 2 it phase become `static`
    // states = [
    //  {item:1, phase:'remove', from:0, to:-1, done},
    //  {item:2, phase:'static', from:-1, to:0, done}
    // ]

    // after `done()` called on item 1, it removed
    // states = [
    //  {item:2, phase:'static', from:-1, to:0, done}
    // ]
}
CounterMultiChildren.args = {}

export const CounterOneChild = function ({...args}) {
    console.log('-------------------------');

    const [count, setCounter] = useState(1)
    const {item: number, key, phase, done} = useAnimeManager(count, {oneAtATime: true})
    // states = [{item:1, phase:'add', from:Infinity, to:0, done}]
    useEffect(_ => {
        setTimeout(_ => setCounter(1 + count), 1000)
    }, [count])

    // states = [
    //  {item:1, phase:'remove', from:0, to:-1, done},
    //  {item:2, phase:'add', from:-1, to:0, done}
    // ]
    return <div xyz={args.xyz} key={key}
                className={"item " + state2class[phase]}
                onAnimationEnd={done}>{number}</div>
    // after `done()` called on item 2 it phase become `static`
    // states = [
    //  {item:1, phase:'remove', from:0, to:-1, done},
    //  {item:2, phase:'static', from:-1, to:0, done}
    // ]

    // after `done()` called on item 1, it removed
    // states = [
    //  {item:2, phase:'static', from:-1, to:0, done}
    // ]
}
CounterOneChild.args = {}

/*story: OneChild*/
export const ShowHide = ({...args}) => {
    const [show, setShow] = useState(true);
    const {item: flag, phase, dx, dy, ref, done} = useAnimeManager(show, {
        oneAtATime: true,

    });

    const isAppear = useAppear();

    function toggle() {
        setShow(!show)
    }

    if (!flag) done()

    return <div>
        <button onClick={toggle}>{show ? 'To hide' : 'To show'}</button>
        <ol className="list-2" xyz={args.xyz}>{
            flag && <li
                className={["item", state2class[phase]].join(' ')}
                ref={ref}
                onAnimationEnd={done}
            >one InOut value:{String(flag)}</li>
        }</ol>
    </div>
}

ShowHide.args = {
    showHide: true,
}


// /*story: list of Component*/
export function ComponentList({list, classAppear, classIn, classOut, ...args}) {
    const [internalList, setList] = useState(list)
    const counter = useRef(list.length)
    const items = useAnimeManager(internalList, {useEffect: true});
    const isAppear = useAppear();

    function add() {
        // let pos = ~~(Math.random() * internalList.length);
        let index = document.getElementById('add-from').value;
        internalList.splice(+index, 0, ++counter.current)
        console.log(internalList);
        setList([...internalList]);
    }

    function remove() {
        // let pos = ~~(Math.random() * internalList.length);
        let index = document.getElementById('add-from').value;
        let pos = Math.min(internalList.length - 1, +index);
        setList(internalList.filter((c, i) => i !== pos));
    }


    return <div>
        <button onClick={add}>add in random</button>
        <button onClick={remove}>remove from random</button>
        <div>
            Remove from <input type="text" id="remove-from" defaultValue={10}/>
            Add to <input type="text" id="add-from" defaultValue={0}/>
        </div>
        <ol className="list-1" xyz={args.xyz} style={{'animation-duration': '3s'}}>
            {items.map(({item: number, phase, dx, dy, ref, done}) => (
                <li key={'key' + number}
                    className={["item", state2class[phase]].join(' ')}
                    ref={ref}
                    style={{[args.yCssProperty]: `${dy}px`}}
                    onAnimationEnd={done}

                >{number}</li>
            ))}
        </ol>
    </div>
}

ComponentList.args = {
    list: [1, 2, 3, 4, 5],
    addInPosition: 0,
    removeFromPosition: 0,
}


/*story: FunctionControl*/
// export const FunctionControl = ({list, ...args}) => {
//     return <ol className="list-3">
//         <AnimeManager {...args}>
//             {list.map((number, index) => (
//                 <li key={'key' + number} className="item">{number}</li>
//             ))}
//         </AnimeManager>
//     </ol>
// }
//
// FunctionControl.args = {
//     list: [1, 2, 3, 4, 5],
//     xyz: 'appear-stagger-2 fade-25% perspective origin-top flip-up-25%',
//     classMove: 'my-xyz-move',
//     yCssProperty: false
// }