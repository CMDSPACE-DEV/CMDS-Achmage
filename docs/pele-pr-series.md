# Pele implementation review series

The owner explicitly requested all 39 scoped PRs for developer review on
2026-10-18, despite the measured bundle failure. This supersedes R-059's
instruction to stop dependent implementation pending packaging approval.
The size gate stays unchanged. Review publication is authorized; merge and
release are not. Every dependent PR is Draft while release gates remain open.

The PRs form a stack: each targets the preceding feature branch, so its Files
changed view contains only that feature. After prerequisites merge, rebase and
retarget in order. Do not merge the last PR directly into main as one package.

Baseline: ab18f96. Exact measured research:
research:rr-20638be978a7deba03447d7a238f7ad0:3fb1b3476572929dd34c53132ee5199f04a728b16c34e85033e607d621109a68.

Each adapter documents its supported grammar subset. Preserved unsupported
syntax is not a claim that every possible gesture is implemented. Real Obsidian
interaction tests and the bundle gate remain explicit release requirements.
