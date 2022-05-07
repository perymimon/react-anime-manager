export default class LetMap extends Map {
    constructor(struct) {
        super();
        this.initStruct(struct);
    }

    /**
     * @param struct can be object function or primitive
     */
    initStruct(struct) {
        this.struct = struct;
    }

    let(k, ...args) {
        const {struct} = this;

        if (struct && !this.has(k)) {
            const s = typeof struct == 'function' ? struct(k, ...args) : structuredClone(struct);
            super.set(k, s)
        }
        return super.get(k);
    }
}

