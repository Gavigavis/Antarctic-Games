# SETH-8 Delivery PRD

Source: Linear issue `SETH-8` and linked document `74b381aa-818f-4675-90e7-5fcd4505de10`

## Execution Status
- Last updated: 2026-04-12 17:28 EDT
- Current branch/worktree: `feature/deliver-prd-seth-8-shell-polish-20260412-171704` at `/Users/seth/.codex/worktrees/deliver-prd-seth-8-shell-polish-20260412-171704`
- Active phase: `Phase 2 - verification and docs`
- Active task: `Await approval to push the verified delivery branch`
- Next task: `Push branch, open the remote handoff, and mark the Linear source complete`
- Overall: `8/9` tasks complete
- Verification: `npm run verify` and local commit `b5395d9`

## Goals
- Replace stale proxy-disabled messaging with ready-state fallback proxy wording.
- Improve the signed-in Account layout so buttons and summary content line up cleanly.
- Remove the chat-local back button and use the shell toolbar back control to free chat space.
- Rotate the featured game daily while keeping the card prominent on the Games page.

## Checklist

### Phase 0 - normalize and confirm scope
- [x] Confirm the user-visible scope lives in the frontend shell checkout and create a dedicated delivery worktree.
- [x] Save a normalized PRD in the repo with live execution status.

### Phase 1 - implementation
- [x] Update the proxy overlay copy and boot messaging so the shell advertises the ready fallback path instead of disabled browsing.
- [x] Update the featured game selector so the spotlight rotates daily and still prefers cards with artwork.
- [x] Update the Account pane rendering and styles so the signed-in summary and actions align cleanly.
- [x] Remove the chat-local back button from the wizard flow and reclaim the vertical space for the room view.

### Phase 2 - verification and docs
- [x] Add or update focused tests that cover the new proxy copy, featured rotation behavior, and chat/account shell expectations.
- [x] Run the targeted regression suite for the touched surfaces and fix any failures.
- [x] Run the repo-standard final verification command and confirm the build is green.
- [ ] Update the Linear issue and PRD source with the final outcome, then stage, commit, and push the delivery branch if policy allows.
