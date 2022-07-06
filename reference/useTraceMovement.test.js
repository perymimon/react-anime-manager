import {act, renderHook, cleanup, addCleanup} from "@testing-library/react-hooks";
import useRenderCount from "@perymimon/react-hooks/src/debuging/useRenderCount.js";

import {useTraceMovement} from "./useTraceMovement.js";
import {useLayoutEffect} from "react";

describe.only('testing useDeltaMovement', () => {
    it('should not throw when input are not valid', () => {
        let states = void 0;
        const {error, rerender} = renderHook(() => {
            return [
                useTraceMovement(states),
                useRenderCount()
            ]
        });
        expect(error).toBeUndefined();

        states = [];
        rerender()
        expect(error).toBeUndefined();
        expect(states).toMatchObject([]);

        states = [{ref: null}]
        rerender()
        expect(error).toBeUndefined();
        expect(states).toMatchObject([{ref: null}]);

        rerender([{ref: {offsetLeft: 10, offsetTop: 10}}])
    })

    it('should compare dx,dy between before and after effect', async () => {
        let states = [{ref: {current: {offsetLeft: 10, offsetTop: 10}}}];
        let afterStates = [{ref: {current: {offsetLeft: 40, offsetTop: 40}}}];

        renderHook(() => {
            useLayoutEffect(() => {
                Object.assign(states ?? [], afterStates ?? [])
            })
            return [
                useTraceMovement(states),
                useRenderCount()
            ]
        });
        expect(states).toMatchObject([{
            afterMovement: true,
            time_dx: -30,
            time_dy: -30,
        }]);
    })

    it('should return 0 if before not have define yet', async () => {
        let states = [{ref: {current: null}}];
        let afterStates = [{ref: {current: {offsetLeft: 40, offsetTop: 40}}}];

        renderHook(() => {
            useLayoutEffect(() => {
                Object.assign(states ?? [], afterStates ?? [])
            })
            return [
                useTraceMovement(states),
                useRenderCount()
            ]
        });
        expect(states).toMatchObject([{
            afterMovement: true,
            time_dx: 0,
            time_dy: 0,
        }]);
    })
})

