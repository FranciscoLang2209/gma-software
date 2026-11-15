declare module "saxen" {
  export class Parser {
    on(
      event: "openTag",
      callback: (
        name: string,
        attributes: () => Record<string, string>,
        decode: (s: string) => string,
        selfClosing: boolean,
      ) => void,
    ): this;
    on(event: "closeTag", callback: (name: string) => void): this;
    on(
      event: "text",
      callback: (value: string, decode: (s: string) => string) => void,
    ): this;
    on(event: "error" | "warn", callback: (error: Error) => void): this;
    parse(xml: string): void;
  }
}
