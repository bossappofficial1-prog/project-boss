import { config } from "../config"

export class Console {
    private static should_showed = config.NODE_ENV === "development"

    static setEnabled(enabled: boolean) {
        this.should_showed = enabled
    }

    static log(message: any, ...optionalParams: any[]) {
        this.should_showed && console.log(message, ...optionalParams)
    }

    static info(message: any, ...optionalParams: any[]) {
        this.should_showed && console.info(message, ...optionalParams)
    }

    static debug(message: any, ...optionalParams: any[]) {
        this.should_showed && console.debug(message, ...optionalParams)
    }

    static warn(message: any, ...optionalParams: any[]) {
        this.should_showed && console.warn(message, ...optionalParams)
    }

    static error(message: any, ...optionalParams: any[]) {
        this.should_showed && console.error(message, ...optionalParams)
    }

    static trace(message?: any, ...optionalParams: any[]) {
        this.should_showed && console.trace(message, ...optionalParams)
    }

    static assert(condition: any, message?: any, ...optionalParams: any[]) {
        // console.assert prints only when condition is falsy
        this.should_showed && console.assert(condition, message, ...optionalParams)
    }

    static dir(item: any, options?: any) {
        this.should_showed && console.dir(item, options)
    }

    static table(tabularData: any, properties?: string[]) {
        this.should_showed && console.table(tabularData, properties)
    }

    static group(label?: any) {
        this.should_showed && console.group(label)
    }

    static groupCollapsed(label?: any) {
        this.should_showed && console.groupCollapsed(label)
    }

    static groupEnd() {
        this.should_showed && console.groupEnd()
    }

    static time(label = "default") {
        this.should_showed && console.time(label)
    }

    static timeEnd(label = "default") {
        this.should_showed && console.timeEnd(label)
    }

    static count(label = "default") {
        this.should_showed && console.count(label)
    }

    static countReset(label = "default") {
        // countReset may throw in some environments if label doesn't exist
        try {
            this.should_showed && console.countReset && console.countReset(label)
        } catch (e) {
            this.should_showed && console.warn("countReset failed for", label)
        }
    }

    static clear() {
        this.should_showed && console.clear()
    }
}

export default Console