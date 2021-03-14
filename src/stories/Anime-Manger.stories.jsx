import AnimeManager from "../Anime-Manager";
import React, {useRef, useState} from "react";
import '@animxyz/core'
import './Anime-Manger.stories.css'
import {jsxDecorator} from "storybook-addon-jsx";


export default {
    title: 'Components/AnimeManger',
    decorators: [jsxDecorator],
    component: AnimeManager,
    args: {
        xyz: "appear-stagger-2 narrow-50% fade-100%",
        classIn: "xyz-in",
        classOut: "xyz-out xyz-absolute",
        classAppear: "xyz-appear",
        xCssProperty: "--xyz-translate-x",
        yCssProperty: "--xyz-translate-y",
    },
    argTypes: {}
}
/* story: List */
export const List = ({list, ...args}) => {
    const [internalList, setList] = useState(list)
    const counter = useRef(list.length)

    function add() {
        // let pos = ~~(Math.random() * internalList.length);
        let index = document.getElementById('add-from').value;
        internalList.splice(+index, 0, ++counter.current)
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
        <ol className="list-1">
            <AnimeManager {...args}>
                {internalList.map((number) => (
                    <li key={'key' + number} className="item">{number}</li>
                ))}
            </AnimeManager>
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