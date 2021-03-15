import {useAnimeManager, useAnimeEffect, MOVE, useAppear} from "../Anime-Manager";
import React, {useRef, useState} from "react";
import '@animxyz/core'
import './Anime-Manger.stories.css'
import {jsxDecorator} from "storybook-addon-jsx";


export default {
    title: 'Components/AnimeManger',
    decorators: [jsxDecorator],
    args: {
        xyz: "appear-stagger-2 appear-narrow-50% appear-fade-100% out-right-100%",
        style:{'--xyz-appear-duration':'3s'},
        classIn: "xyz-in",
        classOut: "xyz-out xyz-absolute",
        classAppear: "xyz-appear",
        xCssProperty: "--xyz-translate-x",
        yCssProperty: "--xyz-translate-y",
    },
    argTypes: {}
}
/* story: List */
export const List = ({list, classAppear,classIn,classOut,  ...args}) => {
    const [internalList, setList] = useState(list)
    const counter = useRef(list.length)
    const items = useAnimeManager(internalList);
    const isAppear = useAppear();
    useAnimeEffect(items);

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
    const state2class = {
        "added": classAppear,
        "removed": classOut,
        "move": classIn,
        "static": ''
    }

    return <div>
        <button onClick={add}>add in random</button>
        <button onClick={remove}>remove from random</button>
        <div>
            Remove from <input type="text" id="remove-from" defaultValue={10}/>
            Add to <input type="text" id="add-from" defaultValue={0}/>
        </div>
        <ol className="list-1" xyz={args.xyz} style={{'animation-duration':'3s'}}>
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

List.args = {
    list: [1],
    addInPosition: 0,
    removeFromPosition: 0,
}
/*story: list of Component*/
// export const ComponentList = ({list, ...args}) => {
//     return <ol className="list-1">
//         <AnimeManager {...args}>
//             {list.map((number) => (
//                 <Li ref={ref} key={'key' + number}>component {number}</Li>
//             ))}
//         </AnimeManager>
//     </ol>
//
// }
//
// function Li(props) {
//     const {children} = props;
//     return <li className="item">
//         {children}
//     </li>
// }
//
// List.args = {
//     list: [1, 2, 3, 4, 5],
// }
//
// /*story: OneChild*/
// export const OneChild = ({showHide, ...args}) => {
//
//     return <ol className="list-2">
//         <AnimeManager {...args}>
//             {showHide && <li className="item">one Child in and out</li>}
//         </AnimeManager>
//     </ol>
// }
//
// OneChild.args = {
//     showHide: true,
// }
// /*story: FunctionControl*/
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