export function WARNS(test, code, arg0, arg1, arg2) {
    const codes = {
        'overflow':
            `above then ${arg0} items pending to draw. consider faster your animation`,
        'overtime':
            `the phase ${arg0} take more then ${arg1}ms to done, consider faster your animation or 
          add ${arg0} to options.skipPhases`,
    }

    test && console.warn(codes[code])
}
