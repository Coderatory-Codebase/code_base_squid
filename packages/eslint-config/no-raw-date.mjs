const message =
  "Do not read the system clock directly. Inject a Clock from '@workspace/kernel' and read time through clock.now() instead.";

export const noRawDateRules = {
  "no-restricted-syntax": [
    "error",
    {
      selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
      message
    },
    {
      // Explicit values (for example parsing an API timestamp) do not read the
      // system clock. Only the zero-argument constructor does.
      selector: "NewExpression[callee.name='Date'][arguments.length=0]",
      message
    },
    {
      selector: "CallExpression[callee.name='Date']",
      message
    }
  ]
};
