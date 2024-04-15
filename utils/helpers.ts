export function pick<T, K extends keyof T>(obj: T, ...props: K[]): Pick<T, K> {
    const result: any = {};
    
    props.forEach((prop) => {
      if (prop in obj) {
        result[prop] = obj[prop];
      }
    });
    return result;
}