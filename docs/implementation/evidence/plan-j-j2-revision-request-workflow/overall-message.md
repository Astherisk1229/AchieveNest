# Phase J2 Evidence: Overall Revision Message

## Requirements & Validation
- **Mandatory**: The reviewer must provide a non-empty overall message explaining the core reasons for returning the portfolio.
- **Length Constraint**: Enforced between 1 and 2,000 characters server-side and client-side.
- **Persistence**: Stored in `personnel_evaluations.return_reason` and the canonical `evaluator_remarks` JSON record.
- **Event Metadata**: Included in the payload of the canonical `revision_requested` event.
- **Immutability**: Personnel cannot mutate or erase the reviewer's message.
