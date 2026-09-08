export default class Holder<T> {
  promise: Promise<T>
  resolve: (...args: any[]) => any
  reject: (...args: any[]) => any
  constructor() {
    this.promise = new Promise((resolve, reject) => Object.assign(this, { reject, resolve }))
  }
}
