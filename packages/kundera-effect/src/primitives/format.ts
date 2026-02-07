import * as ParseResult from "effect/ParseResult";

export const formatParseErrorTree = (error: ParseResult.ParseError): string =>
  ParseResult.TreeFormatter.formatErrorSync(error);

export const formatParseErrorArray = (error: ParseResult.ParseError) =>
  ParseResult.ArrayFormatter.formatErrorSync(error);
