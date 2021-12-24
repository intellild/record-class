import record from "./proxy.macro";

@record
export class SomeRecord {
  public readonly name?: string = "";

  public someMethod(): void {
    //
  }
}
