export class GwFunctionWithContext {
  constructor(readonly context: object, readonly func: (...args: any[]) => any) {}

  execute(...args: any[]): any {
    return this.func.apply(this.context, args);
  }
}
