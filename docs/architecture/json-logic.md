# Restricted JSON Logic grammar

MyoStat uses `json-logic-js` as an evaluator, but claims do **not** get the
library's full language. [`claim-schema.ts`](../../app/src/advice/claim-schema.ts)
accepts only the grammar below. Runtime validates again and surfaces a claim
only when evaluation returns literal `true`; invalid, throwing, false, or merely
truthy rules fail closed.

## Grammar

```text
rule          ::= { operator: arguments }       # exactly one key

operator      ::= "and" | "or" | "!"
                | "==" | "!=" | "<" | "<=" | ">" | ">="
                | "var" | "some"

and/or        ::= { "and"|"or": [value, value, ...] }  # at least 2
not           ::= { "!": [value] }                     # exactly 1
comparison    ::= { comparison-op: [value, value] }     # exactly 2
variable      ::= { "var": variable-name }             # string name
some          ::= { "some": [
                    { "var": "muscleSets" },
                    some-scope-rule
                  ] }                                   # root only

value         ::= rule | finite-number | string | boolean | null
                | [value, ...]
```

Every rule object has exactly one operator. Operator arguments are arrays except
for `var`, whose operand is one variable-name string. Numbers must be finite;
`NaN` and infinities are rejected.

### Variable scopes

At the root, these are the only variable names:

| Variable | Runtime value |
| --- | --- |
| `goal` | `cut`, `bulk`, or `maintain` |
| `deficitWeeks` | Weeks in the current deficit clock |
| `weightTrend` | `down_fast`, `down`, `flat`, `up`, or `unknown` |
| `e1rmTrend` | `up`, `holding`, `down`, or `insufficient_data` |
| `proteinPerKg7d` | Seven-day protein average in g/kg, or `null` |
| `numbersHidden` | Boolean preference |
| `muscleSets` | Derived array of `{ muscle, sets }` from weekly totals |

Inside `some`, only `muscle` and `sets` are legal. Root variables are not
visible there; `muscle` and `sets` are not legal outside. `some` cannot be
nested, and its collection must be exactly `{ "var": "muscleSets" }`.

## Valid examples

A root rule:

```json
{
  "and": [
    { "==": [{ "var": "goal" }, "cut"] },
    { ">=": [{ "var": "deficitWeeks" }, 4] },
    { "==": [{ "var": "e1rmTrend" }, "holding"] }
  ]
}
```

A scoped per-muscle rule:

```json
{
  "some": [
    { "var": "muscleSets" },
    {
      "and": [
        { "==": [{ "var": "muscle" }, "chest"] },
        { "<": [{ "var": "sets" }, 10] }
      ]
    }
  ]
}
```

An ordered comparison against nullable protein data needs an exact non-null
guard **earlier in the same `and`**:

```json
{
  "and": [
    { "!=": [{ "var": "proteinPerKg7d" }, null] },
    { "<": [{ "var": "proteinPerKg7d" }, 1.6] }
  ]
}
```

Validation walks `and` left to right; a later guard cannot make an earlier
comparison safe. The guard is required for `<`, `<=`, `>`, and `>=` because
JSON Logic null coercion could otherwise turn missing data into a match.

## Invalid examples

Unknown root variable:

```json
{ ">=": [{ "var": "bodyFatPercent" }, 12] }
```

Wrong arity—comparisons require two arguments:

```json
{ "==": [{ "var": "goal" }] }
```

Nested `some`:

```json
{
  "some": [
    { "var": "muscleSets" },
    {
      "some": [
        { "var": "muscleSets" },
        { ">": [{ "var": "sets" }, 20] }
      ]
    }
  ]
}
```

Unsafe protein order:

```json
{
  "and": [
    { "<": [{ "var": "proteinPerKg7d" }, 1.6] },
    { "!=": [{ "var": "proteinPerKg7d" }, null] }
  ]
}
```

Also invalid: unknown operators; zero- or multi-key rule objects; non-array
operator arguments; one-item `and`/`or`; root fields inside `some`;
`muscle`/`sets` outside it; a different `some` collection; or non-finite
numeric literals.

## Authoring and runtime behavior

At authoring time, Zod calls `validatePredicate`; the claim build reports the
offending YAML and does not update the generated bundle. At runtime,
`evaluateClaims` validates again before `jsonLogic.apply`, catches errors, and
returns no item for that claim.

Runtime acceptance uses `result === true`. A bare
`{ "var": "deficitWeeks" }` may evaluate to a non-zero number, but it still
cannot surface advice. Silence is safer than treating an ambiguous rule as
evidence that a claim applies.

See [the advice engine](advice-engine.md) for selection and rendering, and the
authoritative [claim schema](../../app/claims/schema.md) for the YAML contract.
