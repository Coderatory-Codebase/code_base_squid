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
      selector: "NewExpression[callee.name='Date']",
      message
    },
    {
      selector: "CallExpression[callee.name='Date']",
      message
    }
  ]
};
