# ONNX Model

Use this reference when a user supplies, or plans to upload, an exported `.onnx`
model artifact and wants Alva to run real-data inference, then persist the
prediction as feed data, use it inside a FeedAltra strategy, emit an actionable
signal, or render it in a released playbook. Do not present this as model
training: Alva prepares data, runs inference, backtests or simulates supplied
models, and renders results.

## Model Handoff From Research

Before writing inference code, confirm the user or upstream training pipeline
has supplied the research artifacts Alva needs to reproduce scoring:

- investment thesis: asset/universe, prediction horizon, and decision use
- label definition: return, class, rank, allocation, or signal target
- feature recipe: raw fields, rolling windows, z-score/normalization, smoothing,
  missing-data policy, and timestamp convention
- tensor contract: input name, dtype, shape, flatten order, output name, and
  output semantics
- artifact set: `model.onnx` plus `model_meta.json`
- validation evidence: train/test split, metrics, known failure modes, drift
  risks, and intended retraining or re-upload cadence


## Runtime Inference

Production playbooks load uploaded models from ALFS inside an async entrypoint:

```javascript
const { InferenceSession, Tensor, TensorDataType } = require("@alva/onnx");

(async () => {
  const session = await InferenceSession.createFromAlfs({
    alfs,
    path: modelPath,
  });
  try {
    const outputs = await session.run({
      [inputName]: new Tensor(TensorDataType.Float32, featureVector, dims),
    });
    return outputs;
  } finally {
    await session.release();
  }
})();
```

Rules:

- Use absolute ALFS paths such as
  `/alva/home/${env.username}/models/<model>/v1/model.onnx`.
- `createFromAlfs` delegates to `alfs.readFileBytes`; jagent currently returns
  base64 for bytes, and `@alva/onnx` decodes it internally. It is also compatible
  if a future runtime returns raw bytes. Do not hand-roll `atob`, `Uint8Array`,
  or byte conversion in playbook code.
- `createFromBase64` is for small demos/tests. Production should use uploaded
  artifacts through `createFromAlfs`.
- Tensor dtype, shape, input names, and output names must come from model
  metadata or the training recipe. Trading vectors are usually
  `TensorDataType.Float32`, but do not guess.
- Release every session in `finally`. Sessions belong to the current jagent
  execution and cannot be persisted across cronjob runs.

## Tensor Shapes

Tensor data is flat, and `dims` describes how the ONNX graph interprets that flat
array. The product of `dims` must equal the data length.

Common finance shapes:

| Use case | Typical shape | Flatten order |
| --- | --- | --- |
| Single tabular row | `[1, features]` | `[f0, f1, ...]` |
| Multi-asset row | `[1, assets, features]` | asset-major, then feature order |
| OHLCV window | `[1, bars, 5]` | oldest-to-newest bars, each `[open, high, low, close, volume]` |
| Regression output | `[1, 1]` | `outputs.<name>.data[0]` |
| Classification output | `[1, classes]` | `Array.from(outputs.<name>.data)` |

Examples:

```javascript
const tabular = new Tensor(
  TensorDataType.Float32,
  new Float32Array([f1, f2, f3, f4]),
  [1, 4],
);

const multiAsset = new Tensor(
  TensorDataType.Float32,
  new Float32Array(flatFeatures),
  [1, assets, features],
);

const ohlcv = new Tensor(
  TensorDataType.Float32,
  new Float32Array(flatOhlcv),
  [1, bars, 5],
);
```

## Model Artifacts

Keep model artifacts separate from feed/playbook outputs:

```text
~/models/<model-name>/v1/model.onnx
~/models/<model-name>/v1/model_meta.json
```

Use the directory version for the model contract major version: input names,
shapes, feature order, output semantics, and decision mapping. Put the exact
artifact version or hash in `model_meta.json`.

Do not grant public read on model artifacts unless the user explicitly wants to
share the model. Public playbooks expose feed outputs, not the `.onnx` file.

`model_meta.json` should include:

- model name, contract version, artifact hash/version, owner/source, training
  time, and training data window
- task type: regression, classification, ranking, or allocation
- data contract: universe, asset order, interval, timestamp convention,
  adjusted/unadjusted prices, units/currency, and missing-data policy
- input contract: input names, dtypes, dims, feature order, lookback, flatten
  order, normalization, scaler fit scope, and imputation policy
- output contract: output names, dtypes, dims, units/classes, horizon, class
  order, probability/logit semantics, thresholds, and sizing/no-trade rules
- validation evidence: train/validation/test or walk-forward windows, metrics,
  cost assumptions, limitations, drift risks, and retraining expectation

If input shape, feature order, normalization, or output meaning is missing, ask
the user before writing inference code.

## FeedAltra Inference

Use FeedAltra when ONNX output drives a backtest, rebalance, simulation, trading
signal, or strategy metric. Follow [altra-trading.md](altra-trading.md) for the
general feature/strategy shape; ONNX adds these constraints:

- Create the session once per jagent execution, not once per bar. A lazy
  `getSession()` may memoize `sessionPromise`; clear cached state after release.
- Reproduce training exactly: identifiers, intervals, bar-close timestamps,
  lookback, missing-data policy, feature order, scaling, target horizon, labels.
- The feature timestamp is the time input evidence is available, not the
  prediction horizon. Never use future bars to build the tensor for time `T`.
- Scalers and normalizers must be fitted on training data or rolling history
  available at or before `T`, never on the full backtest or live window.
- Do not read labels, future returns, future ranks, future volatility/drawdown,
  or other target-derived fields while building the inference tensor.
- `inputConfig` must request every evidence window needed by the model.

Inside an async feature function, keep the ONNX call explicit:

```javascript
const result = await session.run({
  [inputName]: new Tensor(TensorDataType.Float32, row.features, dims),
});
return { date: row.date, prediction: result[outputName].data[0] };
```

The input name, output name, dims, feature builder, and normalization must come
from `model_meta.json` or the user's training recipe. Raw model outputs are
predictions, not trading instructions; thresholds, no-trade bands, and position
sizing must also come from the model metadata or research recipe.

## Feed Outputs

ONNX inference does not create feed outputs by itself. Keep model artifacts under
`~/models/...`, and explicitly write only the derived prediction rows or summaries
that the playbook and downstream consumers need.

Recommended output groups, when the playbook needs them:

| Output | Purpose |
| --- | --- |
| `model/features` | Feature snapshot plus prediction rows for audit and charts |
| `model/summary` | Latest verdict, freshness, model version, compact chart arrays, diagnostics |
| `signal/targets` | Actionable target, if the model emits a trading signal |

If using FeedAltra, its normal `signal`, `sim`, and `perf` outputs are covered by
[altra-trading.md](altra-trading.md); do not duplicate them unless the playbook
needs a custom ONNX-specific view.

If released HTML displays ONNX predictions or metrics, it must read released feed
data at runtime, commonly:

```text
/alva/home/<username>/feeds/<feed-name>/v1/data/model/summary/@last/1
/alva/home/<username>/feeds/<feed-name>/v1/data/model/features/@last/500
```

Preview fixtures must not become the authoritative source or production fallback.
These names are recommendations, not a required schema; choose the smallest feed
surface that supports the playbook and downstream consumers.

## README And Release Additions

Follow the normal README and release rules in `SKILL.md` and
[api/release.md](api/release.md). ONNX only adds these checks:

- README names the model artifact/version, training window, feature contract,
  output meaning, validation evidence, and re-upload or retraining expectation.
- `alva run` proves the script fetches real data, loads the `.onnx` file from
  ALFS, and builds tensors with the documented shape.
- Released HTML reads released feed data, not embedded prediction arrays or
  preview fixtures.
- Public access should normally be granted to released feed outputs, not the
  model artifact.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Session or tensor error | Reusing a released session, wrong dtype, or `dims` product differs from data length | Create one session per run and rebuild the tensor from `model_meta.json` |
| Missing graph key | Wrong ONNX input/output name | Use the names from model metadata or runtime introspection, then update code and docs |
| Local preview works but `alva run` fails | Demo-only base64 or host-file loading leaked into production | Use `InferenceSession.createFromAlfs({ alfs, path })` with absolute ALFS paths |
