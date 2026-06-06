export type Command = "redact" | "unredact";

export interface CliOptions {
  command?: Command;
  terms?: string;
  text?: string;
  key?: string;
  json: boolean;
}
