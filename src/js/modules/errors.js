// Thrown by transformers/checkers when the input doesn't match the expected
// format (e.g. decoding text that isn't valid Base64). `strTo` catches it and
// surfaces `error.message` to the UI instead of letting it bubble as a crash.
class FormatError extends Error {}

export { FormatError };
