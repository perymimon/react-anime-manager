import {ADD, STATIC, useAnimeManager} from '../anime-manager.js'
import {renderHook, act} from '@testing-library/react'
import {useEffect, useRef} from "react";

console.clear()
function useTest(initValue=0) {
    const value = useRef(initValue)
    useEffect(() => {
        value.current +=1
    })
    return value.current;
}

describe.only('auto increment', () => {
    let testedHook;
    beforeAll(() => {
        // const Hook = renderHook((items, options) => useAnimeManager(items, options))
        testedHook = renderHook(() => useTest())
    })
    test('first run', () => {
        expect(testedHook.result.current).toBe(0)
        testedHook.rerender()
        expect(testedHook.result.current).toBe(1)
    })
    test('second run', () => {
        testedHook.rerender()
        expect(testedHook.current).toBe(2)
    })
})