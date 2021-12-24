import record from "./proxy.macro";

@record
export class SomeRecord {
  public field1?: string = "";
  private readonly field2 = false;
}
