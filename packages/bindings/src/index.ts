import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CAL5JXN7KJYLMBB3ZEIGRQXWIIGBOG3636T3OSHTB6CCREVFCB3SWZOM",
  }
} as const

export const Errors = {
  1: {message:"NotInitialized"},
  2: {message:"BadConfig"},
  3: {message:"WrongStatus"},
  4: {message:"ZeroAmount"},
  5: {message:"Overshoot"},
  6: {message:"NotInOrder"},
  7: {message:"CapExceeded"},
  8: {message:"NotApproved"},
  9: {message:"AlreadyRefunded"},
  10: {message:"NothingToRefund"},
  11: {message:"CapsTooLarge"},
  12: {message:"SupplierNotApproved"}
}

export type Status = {tag: "Open", values: void} | {tag: "Funded", values: void} | {tag: "Complete", values: void} | {tag: "Failed", values: void};

export interface Client {
  /**
   * Construct and simulate a spend transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  spend: ({idx, category, to, amount}: {idx: u32, category: string, to: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a refund transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  refund: ({contributor}: {contributor: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_cap transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_cap: ({idx, category}: {idx: u32, category: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a set_caps transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_caps: ({idx, caps}: {idx: u32, caps: Array<readonly [string, i128]>}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_spent transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_spent: ({idx, category}: {idx: u32, category: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_state transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_state: (options?: MethodOptions) => Promise<AssembledTransaction<readonly [Status, i128, i128, i128, u32]>>

  /**
   * Construct and simulate a contribute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  contribute: ({from, amount}: {from: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_config: (options?: MethodOptions) => Promise<AssembledTransaction<readonly [string, string, string, string]>>

  /**
   * Construct and simulate a is_supplier transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  is_supplier: ({addr}: {addr: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a add_supplier transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  add_supplier: ({supplier}: {supplier: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_milestone transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_milestone: ({idx}: {idx: u32}, options?: MethodOptions) => Promise<AssembledTransaction<readonly [u32, i128, boolean]>>

  /**
   * Construct and simulate a get_remaining transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_remaining: ({idx, category}: {idx: u32, category: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_refundable transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * 0 unless the pool has failed and this address has not yet claimed.
   */
  get_refundable: ({addr}: {addr: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_contribution transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_contribution: ({addr}: {addr: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a reject_milestone transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  reject_milestone: ({idx}: {idx: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a approve_milestone transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  approve_milestone: ({idx}: {idx: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_milestone_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_milestone_count: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin, verifier, recipient, token, goal, milestones_bps}: {admin: string, verifier: string, recipient: string, token: string, goal: i128, milestones_bps: Array<u32>},
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({admin, verifier, recipient, token, goal, milestones_bps}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAADAAAAAAAAAAOTm90SW5pdGlhbGl6ZWQAAAAAAAEAAAAAAAAACUJhZENvbmZpZwAAAAAAAAIAAAAAAAAAC1dyb25nU3RhdHVzAAAAAAMAAAAAAAAAClplcm9BbW91bnQAAAAAAAQAAAAAAAAACU92ZXJzaG9vdAAAAAAAAAUAAAAAAAAACk5vdEluT3JkZXIAAAAAAAYAAAAAAAAAC0NhcEV4Y2VlZGVkAAAAAAcAAAAAAAAAC05vdEFwcHJvdmVkAAAAAAgAAAAAAAAAD0FscmVhZHlSZWZ1bmRlZAAAAAAJAAAAAAAAAA9Ob3RoaW5nVG9SZWZ1bmQAAAAACgAAAAAAAAAMQ2Fwc1Rvb0xhcmdlAAAACwAAAAAAAAATU3VwcGxpZXJOb3RBcHByb3ZlZAAAAAAM",
        "AAAAAgAAAAAAAAAAAAAABlN0YXR1cwAAAAAABAAAAAAAAAAAAAAABE9wZW4AAAAAAAAAAAAAAAZGdW5kZWQAAAAAAAAAAAAAAAAACENvbXBsZXRlAAAAAAAAAAAAAAAGRmFpbGVkAAA=",
        "AAAAAAAAAAAAAAAFc3BlbmQAAAAAAAAEAAAAAAAAAANpZHgAAAAABAAAAAAAAAAIY2F0ZWdvcnkAAAARAAAAAAAAAAJ0bwAAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
        "AAAAAAAAAAAAAAAGcmVmdW5kAAAAAAABAAAAAAAAAAtjb250cmlidXRvcgAAAAATAAAAAA==",
        "AAAAAAAAAAAAAAAHZ2V0X2NhcAAAAAACAAAAAAAAAANpZHgAAAAABAAAAAAAAAAIY2F0ZWdvcnkAAAARAAAAAQAAAAs=",
        "AAAAAAAAAAAAAAAIc2V0X2NhcHMAAAACAAAAAAAAAANpZHgAAAAABAAAAAAAAAAEY2FwcwAAA+oAAAPtAAAAAgAAABEAAAALAAAAAA==",
        "AAAAAAAAAAAAAAAJZ2V0X3NwZW50AAAAAAAAAgAAAAAAAAADaWR4AAAAAAQAAAAAAAAACGNhdGVnb3J5AAAAEQAAAAEAAAAL",
        "AAAAAAAAAAAAAAAJZ2V0X3N0YXRlAAAAAAAAAAAAAAEAAAPtAAAABQAAB9AAAAAGU3RhdHVzAAAAAAALAAAACwAAAAsAAAAE",
        "AAAAAAAAAAAAAAAKY29udHJpYnV0ZQAAAAAAAgAAAAAAAAAEZnJvbQAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=",
        "AAAAAAAAAAAAAAAKZ2V0X2NvbmZpZwAAAAAAAAAAAAEAAAPtAAAABAAAABMAAAATAAAAEwAAABM=",
        "AAAAAAAAAAAAAAALaXNfc3VwcGxpZXIAAAAAAQAAAAAAAAAEYWRkcgAAABMAAAABAAAAAQ==",
        "AAAAAAAAAAAAAAAMYWRkX3N1cHBsaWVyAAAAAQAAAAAAAAAIc3VwcGxpZXIAAAATAAAAAA==",
        "AAAAAAAAAB5EZXBsb3kgYW5kIHNldCB1cCBpbiBvbmUgc3RlcC4AAAAAAA1fX2NvbnN0cnVjdG9yAAAAAAAABgAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAh2ZXJpZmllcgAAABMAAAAAAAAACXJlY2lwaWVudAAAAAAAABMAAAAAAAAABXRva2VuAAAAAAAAEwAAAAAAAAAEZ29hbAAAAAsAAAAAAAAADm1pbGVzdG9uZXNfYnBzAAAAAAPqAAAABAAAAAA=",
        "AAAAAAAAAAAAAAANZ2V0X21pbGVzdG9uZQAAAAAAAAEAAAAAAAAAA2lkeAAAAAAEAAAAAQAAA+0AAAADAAAABAAAAAsAAAAB",
        "AAAAAAAAAAAAAAANZ2V0X3JlbWFpbmluZwAAAAAAAAIAAAAAAAAAA2lkeAAAAAAEAAAAAAAAAAhjYXRlZ29yeQAAABEAAAABAAAACw==",
        "AAAAAAAAAEIwIHVubGVzcyB0aGUgcG9vbCBoYXMgZmFpbGVkIGFuZCB0aGlzIGFkZHJlc3MgaGFzIG5vdCB5ZXQgY2xhaW1lZC4AAAAAAA5nZXRfcmVmdW5kYWJsZQAAAAAAAQAAAAAAAAAEYWRkcgAAABMAAAABAAAACw==",
        "AAAAAAAAAAAAAAAQZ2V0X2NvbnRyaWJ1dGlvbgAAAAEAAAAAAAAABGFkZHIAAAATAAAAAQAAAAs=",
        "AAAAAAAAAAAAAAAQcmVqZWN0X21pbGVzdG9uZQAAAAEAAAAAAAAAA2lkeAAAAAAEAAAAAA==",
        "AAAAAAAAAAAAAAARYXBwcm92ZV9taWxlc3RvbmUAAAAAAAABAAAAAAAAAANpZHgAAAAABAAAAAA=",
        "AAAAAAAAAAAAAAATZ2V0X21pbGVzdG9uZV9jb3VudAAAAAAAAAAAAQAAAAQ=" ]),
      options
    )
  }
  public readonly fromJSON = {
    spend: this.txFromJSON<null>,
        refund: this.txFromJSON<null>,
        get_cap: this.txFromJSON<i128>,
        set_caps: this.txFromJSON<null>,
        get_spent: this.txFromJSON<i128>,
        get_state: this.txFromJSON<readonly [Status, i128, i128, i128, u32]>,
        contribute: this.txFromJSON<null>,
        get_config: this.txFromJSON<readonly [string, string, string, string]>,
        is_supplier: this.txFromJSON<boolean>,
        add_supplier: this.txFromJSON<null>,
        get_milestone: this.txFromJSON<readonly [u32, i128, boolean]>,
        get_remaining: this.txFromJSON<i128>,
        get_refundable: this.txFromJSON<i128>,
        get_contribution: this.txFromJSON<i128>,
        reject_milestone: this.txFromJSON<null>,
        approve_milestone: this.txFromJSON<null>,
        get_milestone_count: this.txFromJSON<u32>
  }
}