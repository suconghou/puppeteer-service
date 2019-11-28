export default class {

    constructor(category) {
        this.category = category
    }

    mark(label) {
        if (!this.start) {
            this.start = +new Date()
            console.log("%s: %s %d", this.category, label, this.start)
        } else {
            const t = +new Date() - this.start
            console.log("%s: %s %d", this.category, label, t)
            this.start = +new Date()
        }
    }
}