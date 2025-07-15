class Localstorage {
  add<T>(key: string, val: T) {
    localStorage.setItem(key, this.strinigify(val));
    return val;
  }

  get<T>(key: string) {
    return this.parseData(localStorage.getItem(key) as string) as T
  }

  remove(key: string) {
    localStorage.removeItem(key);
  }

  clear() {
    localStorage.clear();
  }

  strinigify<T>(val: T) {
    try {
      return JSON.stringify(val);
    } catch (err) {
      return val as string;
    }
  }

  parseData<T>(val: string) {
    try {
      return JSON.parse(val) as T;
    } catch (err) {
      return val;
    }
  }
}
export default new Localstorage();