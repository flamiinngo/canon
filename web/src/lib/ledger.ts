/** Generated from JUDGES.md: real NEAR testnet transactions recorded by scripts/deploy.sh. */
export const REGISTRY_ACCOUNT = "canon-bootstate.testnet";
export const LEDGER: { step: string; expected: string; refused: boolean; ok: boolean; hash: string }[] = [
 {
  "step": "Publish vault code as NEP-591 global contract 8CsdQ7aVrqG9YXSUoxjuE8YMVnnPiEiCYjjfTHUoaBUH",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "DykHfH3rM3UfdtkWz87FfGBZVZGxVj1TNZMmriWe4U4d"
 },
 {
  "step": "Deploy registry to canon-bootstate.testnet and initialise with the vault hash",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "3CZKvxw4WF9FdCcTpwjAbQjkDMYQueRcUPBQ3AywSoYs"
 },
 {
  "step": "ada registers Ember Field",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "DWBG8aKhjZnNCXMu9SuS2cPnWQ6T8TQxXVT2jtAcUmww"
 },
 {
  "step": "ben registers Ember Field — Relief as a derivative of ember",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "AqU1VLtdpNke9QSjhzRZ3Gu2bKtf7HNH8Y6kgqNvyMtN"
 },
 {
  "step": "ada approves Relief into canon",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "BJUfFT4qCaymLsP54tJtM1uLQKVQMJ1G8FChTk8DiPtN"
 },
 {
  "step": "dee registers Ember Field — Motion as a derivative of ember-relief",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "7sntFJbwnUCs8svAa5zWqY7m5qyLCewVvso1DAjcuV36"
 },
 {
  "step": "ada (not the parent's owner) tries to approve Motion",
  "expected": "ERR_NOT_PARENT_OWNER",
  "refused": true,
  "ok": true,
  "hash": "EPa2WsTM7bUhEZVQQF2ZDTTSavFzatuY3oPHEwJmxrT7"
 },
 {
  "step": "studio tries to license Motion before it is approved",
  "expected": "ERR_NOT_CLEARED",
  "refused": true,
  "ok": true,
  "hash": "947NfYdnrtym2eeozWJwWi3BMvzK2g1gHhTRwXow931e"
 },
 {
  "step": "ben approves Motion into canon",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "HC556mCGMHYpHBCLRkvDz3DJaVrHZN1ddmi5ZfuQPAuf"
 },
 {
  "step": "gil registers Ember Field — Nocturne as a derivative of ember",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "EgPQ6wueGvw6CkE5iNeCD7RZMNUXxovzvhBQbPAN5LEQ"
 },
 {
  "step": "ada approves Nocturne",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "A1AbyED1JYQLxZ58FH5wXRSaU9skYHMSqMcRMfbvuDiw"
 },
 {
  "step": "hal registers Ember Field — Pixel as a derivative of ember",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "FozgXUfj6CVYTygyMCAxM3KzFXTiP7SKgVmB28yhajoo"
 },
 {
  "step": "ivy registers Moth Light",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "A1rEBNSfojVhEQHnys8Gkv5p51ALXzXQDbhPdUiZKBSP"
 },
 {
  "step": "jun registers Moth Light — Fragments as a derivative of moth-light",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "FtCt4ZGdKSE4PL61ATgakZ2bwLnQeBtxaLQhbnoep4ab"
 },
 {
  "step": "ivy approves Fragments",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "GuW4zJRPz2gHShiRTyFDiTDysPMzYbujLGibKAwDqzGn"
 },
 {
  "step": "studio tries to license Fragments (parent forbids commercial use)",
  "expected": "ERR_NOT_CLEARED",
  "refused": true,
  "ok": true,
  "hash": "CzeASXdLC7mFtJTyX1N8HcHdowPdQpkENtZikVTc6acY"
 },
 {
  "step": "lea registers Tidal",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "2RN5zgE83QNQzBY8nmSwdLUeDbaySd1aSfkAibpfSHgy"
 },
 {
  "step": "nox registers Tidal — Neon Remix as a derivative of tidal",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "71u8Cin7SYtC5AKNZiRPA9njNwYfuNidgHEsyiTvoaXb"
 },
 {
  "step": "lea approves Neon Remix",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "3RuQqW6hAha4aAPohk9oktkmj7krMBx6ZDdnXZcy8XiR"
 },
 {
  "step": "lea revokes Neon Remix",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "AciCgWNsn9x1obdoc3dKdXw7fiLgwkdV5sg67kfrYFzw"
 },
 {
  "step": "studio tries to license the revoked Neon Remix",
  "expected": "ERR_NOT_CLEARED",
  "refused": true,
  "ok": true,
  "hash": "FT5gufJ3c5vsUUturgrsbU3BMcce7MjdjExYwiNToAtC"
 },
 {
  "step": "kai registers Quarry",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "BH1QexfUrKxcJRKc2VB889KBMPSv6yeVtvFE1K572RCg"
 },
 {
  "step": "hal tries to derive from Quarry (derivatives closed)",
  "expected": "ERR_DERIVATIVES_CLOSED",
  "refused": true,
  "ok": true,
  "hash": "Ni4CKwb75iQDkVXHFdDcMgMmPrFH4ct8Q8mcj4kVmV7"
 },
 {
  "step": "ada registers splits totalling 90%",
  "expected": "ERR_BAD_SPLITS",
  "refused": true,
  "ok": true,
  "hash": "B7LnZV5uTaDDs3YHyEMzVcrAzEaKnqViBdF7RfCfEbrM"
 },
 {
  "step": "studio licenses Ember Field — Motion for 1.5 Ⓝ (splits: dee vault 0.9, fay 0.225, ben vault 0.21, cy 0.09, ada vault 0.075)",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "AjoPWXFtebxkJTwLVdaDLeVBNz8GxoyySYnijppTxrQD"
 },
 {
  "step": "studio licenses Quarry for 0.8 Ⓝ",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "4o9Sqs7jtzQHxZQijbgB6K2NwQM2NxBVJGfD8gLcXQb8"
 },
 {
  "step": "eve (not the owner) tries to withdraw Relief's vault",
  "expected": "ERR_NOT_OWNER",
  "refused": true,
  "ok": true,
  "hash": "GzD729gi2n3f97MoQ4ArLC37ERh7Xoyvm2UMkbHeNkFf"
 },
 {
  "step": "ben lists Relief on a marketplace (nft_approve)",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "5peYCoWEKKaDthZJLKowggYdx2Bg1Z7SrcQB5QBPjeUR"
 },
 {
  "step": "ben tries to drain Relief's vault while it is listed",
  "expected": "ERR_TOKEN_LISTED",
  "refused": true,
  "ok": true,
  "hash": "CNLgN8gkA8UDDrAQNE4itvjVXxTp89ah871fQ8MWT541"
 },
 {
  "step": "ben sells Relief to eve (nft_transfer)",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "8vmazckjDYiohF8HWeE1vZgQtMQaK5J9gPTZQJNB94Vo"
 },
 {
  "step": "ben (the seller) tries to withdraw after the sale",
  "expected": "ERR_NOT_OWNER",
  "refused": true,
  "ok": true,
  "hash": "FAeoHSyP15ZkjNjRb4tDvRCDSiKnhw5sRuPx34rPWRUZ"
 },
 {
  "step": "eve calls Relief's vault release directly, bypassing the registry",
  "expected": "ERR_ONLY_REGISTRY",
  "refused": true,
  "ok": true,
  "hash": "NaJwfCk58Ba4zqqYyoQvrrKSK6bg9LewrNZKhEADfRR"
 },
 {
  "step": "eve (the buyer) withdraws 0.21 Ⓝ earned before she bought it",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "uvz5MXAvnQBbmBStLstUHzY3X8LzTuo8E7mPeDrwiQP"
 },
 {
  "step": "cy claims 0.09 Ⓝ: her credit did not move with the sale",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "F3P96ahCSzpVztVZFu8vHAxk7JgKqyiUyMvJTeReL5so"
 },
 {
  "step": "dee withdraws Motion's vault (0.9 Ⓝ)",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "3CtXogCoBRz5WLfn5AqvuLvS78rPMgHDFwqcHLh3W1tp"
 },
 {
  "step": "fay claims her 0.225 Ⓝ score share",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "EbQqsXbevpzoQUwLK3Gs1TiUGNjwypL3sckp1PwTqXdr"
 },
 {
  "step": "fay tries to claim twice",
  "expected": "ERR_NOTHING_TO_CLAIM",
  "refused": true,
  "ok": true,
  "hash": "26T2f7ZJWBre6RwEBkoDrGi69cvh7Tf2yX4hVbe16xx5"
 },
 {
  "step": "Delete registry access key ed25519:HZ3WK4XqSi…",
  "expected": "ok",
  "refused": false,
  "ok": true,
  "hash": "45xDjthrVNa2zWBkPk2qSJoBpFyCFQHjjYZFXUuqjUjU"
 }
];
