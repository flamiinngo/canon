/** Generated from LEDGER.md: real NEAR testnet transactions recorded by scripts/deploy.sh. */
export const REGISTRY_ACCOUNT = "canonhq.testnet";
export const LEDGER: { step: string; expected: string; refused: boolean; ok: boolean; hash: string }[] = [
 {
  "step": "Publish vault code as NEP-591 global contract Anq6HuuCn243gdRdBjudqvR1uCe8NB8JQzTD5DF9KKtw",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "ArCB71nem4FTMQuiishHYyPt8H6VLiWWYRY4jEBCXELS"
 },
 {
  "step": "Deploy registry to canonhq.testnet and initialise with the vault hash",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "CXtZrr1AbYp7cXfg1YznSGR1vSkCoT1w4w19L3xAxc3h"
 },
 {
  "step": "ada registers Ember Field",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "BZjdTYgQfnsmaQ36uMa4iqJSXe56N1wprjSA1mJjrsKX"
 },
 {
  "step": "ben registers Ember Field — Relief as a derivative of ember",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "9dCPz73Mi6LmQDE3E86eh9pu5btSrKxWnuJXZfSrvUsC"
 },
 {
  "step": "ada approves Relief into canon",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "6SiCx6ATJdkQ2Rvrkw1qkJMgETDr8sGQFf5eC2EQwJJp"
 },
 {
  "step": "dee registers Ember Field — Motion as a derivative of ember-relief",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "7ECKs8sPFKPaXisnRLowfFgNkLwCxn7SHAGXxVdUPSpR"
 },
 {
  "step": "ada (not the parent's owner) tries to approve Motion",
  "expected": "ERR_NOT_PARENT_OWNER",
  "refused": true,
  "ok": true,
  "hash": "HbPJrGFZJrUJF4K3LwbQ8xBJ1S9bfkoMFLMw1njYU1iM"
 },
 {
  "step": "studio tries to license Motion before it is approved",
  "expected": "ERR_NOT_CLEARED",
  "refused": true,
  "ok": true,
  "hash": "6HrquxkqPHfyfYFmEZ12GN9LMkXewBKeiZU8skfK4bBU"
 },
 {
  "step": "ben approves Motion into canon",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "4iLLvMbhf49XKqUzpXnNyRhCQmbwfTu8ttU3bub3Na6z"
 },
 {
  "step": "gil registers Ember Field — Nocturne as a derivative of ember",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "4eiYEmnozqTJ5yDGHEqWCk7gyVqvpM3FXXgaPRQVf4hG"
 },
 {
  "step": "ada approves Nocturne",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "4S2wbwSJ5CpA1wbHVzWo8QaUw5GyHQ2To1jT7MHERKSu"
 },
 {
  "step": "hal registers Ember Field — Pixel as a derivative of ember",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "4frNdqussE5dnPVBnW9S488BFHYC8gu8V7pFyUeghxNF"
 },
 {
  "step": "ivy registers Moth Light",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "CooAeYpwYMVhrjxkB3nV5DG9C3bTUxvuQgT28DP77WGA"
 },
 {
  "step": "jun registers Moth Light — Fragments as a derivative of moth-light",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "3aPqBWSu19YBrDAW4xQ6Y5StcC1eZxNU64UrEimYJTbw"
 },
 {
  "step": "ivy approves Fragments",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "HmtcuUaAk8qS6WA9iHDJzLvR4mmSG6V5JcjTa1BVgSbi"
 },
 {
  "step": "studio tries to license Fragments (parent forbids commercial use)",
  "expected": "ERR_NOT_CLEARED",
  "refused": true,
  "ok": true,
  "hash": "4bSvXfN9AWuoMbN4mmzS8rMB71nwfDGqzngQRN9czHwQ"
 },
 {
  "step": "lea registers Tidal",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "DjRXAp5JcD1rYwsJr8RFwQgRb2S9rb1Rje9kDdo7r9kt"
 },
 {
  "step": "nox registers Tidal — Neon Remix as a derivative of tidal",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "7hmtbWTDSfydsJ6NLzuuViWGfRarMnPSoQt3tCD9MjR5"
 },
 {
  "step": "lea approves Neon Remix",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "2MTBMtttihATc62Gzx4s9tVULQbkmeiPM59t1uCsTH8K"
 },
 {
  "step": "lea revokes Neon Remix",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "8JKH48xcsAg3oeyAKv9GrfLyCT3E4gW7pmK8sQQc8YcZ"
 },
 {
  "step": "studio tries to license the revoked Neon Remix",
  "expected": "ERR_NOT_CLEARED",
  "refused": true,
  "ok": true,
  "hash": "4goc1MyPKzs8rak9boq7bdnSnmdMoi2fm97DeMgYpDYF"
 },
 {
  "step": "kai registers Quarry",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "9cySegDzkxNgDUQ5ptdnvEjMHCYGeusHoUx8VFCmPBCC"
 },
 {
  "step": "hal tries to derive from Quarry (derivatives closed)",
  "expected": "ERR_DERIVATIVES_CLOSED",
  "refused": true,
  "ok": true,
  "hash": "6S7b5nYG2De1rHVQMEnbqXdjoBiTrPYYrwmxQULDoctJ"
 },
 {
  "step": "ada registers splits totalling 90%",
  "expected": "ERR_BAD_SPLITS",
  "refused": true,
  "ok": true,
  "hash": "GQNgq9VrPjEMjnA2nVdFbrHoBwFGzRz5Hr2TwKvYR7wx"
 },
 {
  "step": "studio licenses Ember Field — Motion for 1.5 Ⓝ (splits: dee vault 0.9, fay 0.225, ben vault 0.21, cy 0.09, ada vault 0.075)",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "HrgXySX1m4uHA21ynYgLrCvCBxJNg2n8syFSWGAm8U2a"
 },
 {
  "step": "studio licenses Quarry for 0.8 Ⓝ",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "Eu9RgUUbrbgKc69uegD7eBbiTv7gyFXhXmQxVtJKqHf8"
 },
 {
  "step": "eve (not the owner) tries to withdraw Relief's vault",
  "expected": "ERR_NOT_OWNER",
  "refused": true,
  "ok": true,
  "hash": "AAeV3SwDaLqRPkaZpnYr5JVrcN1gCvNN1RgEoiuWtZMH"
 },
 {
  "step": "ben lists Relief on a marketplace (nft_approve)",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "6wr4yTjWKK4TNsZ8q9bYhTcjoEY6aeW6PEY9J9KnKNE6"
 },
 {
  "step": "ben tries to drain Relief's vault while it is listed",
  "expected": "ERR_TOKEN_LISTED",
  "refused": true,
  "ok": true,
  "hash": "6825sV2P2vweDqrmfRebjBU9j413tpipeWV5G56reuvH"
 },
 {
  "step": "eve's marketplace sells Relief for 1 Ⓝ via NEP-199 nft_transfer_payout: payout = ben 0.8, ember vault 0.2 (resale royalty)",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "F2G9dcGT33nxmmsmCKngJ67UKQhd5c3rD9i2Dq1vBDVo"
 },
 {
  "step": "marketplace pays the seller ben 0.8 Ⓝ",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "EwpCiJPV1HqWpxyv1psK6YbHbVFmMweXUowJDttCoLRU"
 },
 {
  "step": "marketplace pays the 0.2 Ⓝ royalty straight into Ember's vault",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "EbYDjVU4Jv7oVvZxJqkCWeQcpVYu22cNyph9GjMaEQgv"
 },
 {
  "step": "ben (the seller) tries to withdraw after the sale",
  "expected": "ERR_NOT_OWNER",
  "refused": true,
  "ok": true,
  "hash": "BV24rL8mdsXAFYFPsUEYngqGXhSsUEECWc1dr57BkRu3"
 },
 {
  "step": "eve calls Relief's vault release directly, bypassing the registry",
  "expected": "ERR_ONLY_REGISTRY",
  "refused": true,
  "ok": true,
  "hash": "6fxRFGxnNw1ws7XTRw3pEctBtmjVegZuUaYf5iqFBuKG"
 },
 {
  "step": "eve (the buyer) withdraws 0.21 Ⓝ earned before she bought it",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "663gSSN18Rz6ZTwjgr1pzdC7xBVSDbkQnV6W6GXnztyc"
 },
 {
  "step": "cy claims 0.09 Ⓝ: her credit did not move with the sale",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "jDdxY5UAxXtRW1D5ATn5hRNSNFpbzYZF4YJCD6Rt7iy"
 },
 {
  "step": "dee withdraws Motion's vault (0.9 Ⓝ)",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "5X5uSG6h8Vvu5PREbBcrmT1ctoR4atftJA8RoJmUkpXt"
 },
 {
  "step": "ada withdraws Ember's vault: 0.075 Ⓝ licence share + 0.2 Ⓝ resale royalty",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "BKJvR3RrVDgsro4G4PRL6DWkr187VLitmSjCrzVt6GVH"
 },
 {
  "step": "fay claims her 0.225 Ⓝ score share",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "ArW18FesbU5HkmWqimCAifnZexGWqUYb5hNiKjkk9neh"
 },
 {
  "step": "fay tries to claim twice",
  "expected": "ERR_NOTHING_TO_CLAIM",
  "refused": true,
  "ok": true,
  "hash": "5mNeHjdts6zGeUpwiZs2Mn7j1vaUyJKTe15nnT2VyngB"
 },
 {
  "step": "Delete registry access key ed25519:4T7JEo26gy…",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "Ck5zh9yc4mYKkbfRndWQazufKViYokjqn7wihpsn1eKD"
 }
];
