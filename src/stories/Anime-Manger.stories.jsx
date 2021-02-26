import AnimeManager from "../Anime-Manager";
import React ,{useState} from "react";
import '@animxyz/core'
import './Anime-Manger.stories.css'
import {jsxDecorator} from "storybook-addon-jsx";


export default {
    title: 'Components/AnimeManger',
    decorators:[jsxDecorator],
    component: AnimeManager,
    args:{
        xyz: "appear-stagger-2 narrow-50% fade-100%",
        classIn: "xyz-in",
        classOut: "xyz-out xyz-absolute",
        classAppear:"xyz-appear",
        xCssProperty : "--xyz-translate-x",
        yCssProperty : "--xyz-translate-y",
    },
    argTypes:{

    }
}
export const List = ({list, ...args}) => {
    return <ol className="list-1">
        <AnimeManager {...args}>
            {list.map((number) => (
                <li key={'key' + number} className="item">{number}</li>
            ))}
        </AnimeManager>
    </ol>;
}

List.args = {
    list:[1, 2, 3, 4, 5],
}


export const OneChild = ({showHide,...args})=>{

    return  <ol className="list-2">
        <AnimeManager {...args}>
            {showHide && <li className="item">one Child in and out</li>}
        </AnimeManager>
    </ol>
}

OneChild.args = {
    showHide:true,
}

export const FunctionControl = ({list, ...args}) =>{
    return <ol className="list-3">
        <AnimeManager {...args}>
            {list.map((number, index) => (
                <li key={'key' + number} className="item">{number}</li>
            ))}
        </AnimeManager>
    </ol>
}

FunctionControl.args= {
    list:[1, 2, 3, 4, 5],
    xyz:'appear-stagger-2 fade-25% perspective origin-top flip-up-25%',
    classMove:'my-xyz-move',
    yCssProperty: false
}