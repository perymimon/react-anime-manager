import React from "react";
import ReactDOM from "react-dom";
import '@animxyz/core'
import './index.css'
import './user.css'

import App from "./App";
import { MOVE, ADD, REMOVE, STATIC } from "@perymimon/react-anime-manager";
const rootElement = document.getElementById("root");

const state2class = {
    [ADD]: "xyz-appear",
    [REMOVE]: "xyz-out xyz-absolute",
    [MOVE]: "xyz-in",
    [STATIC]: ""
};
const args = {
    xyz:"appear-stagger-2 appear-narrow-50% appear-fade-100% out-right-100%"
}

ReactDOM.render(<App state2class={state2class} args={args} />, rootElement);
