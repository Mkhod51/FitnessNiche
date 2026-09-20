# JSON Logic subset

**Status:** current scope page; the exact validator-derived grammar and examples are owned by documentation Task 6.

MyoStat accepts a deliberately small JSON Logic subset for claim applicability. Authoring validation rejects unknown variables and unsafe forms; runtime evaluation validates again and fails closed unless the result is literal `true`.

The implementation authority is `app/src/advice/claim-schema.ts`. This page will document the supported operators, variable scopes, arity rules, null guards, and `some(muscleSets)` boundary without implying support for the full JSON Logic language.
