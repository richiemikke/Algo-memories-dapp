import algosdk from "algosdk";
import {
  algodClient,
  indexerClient,
  memoryNote,
  minRound,
  myAlgoConnect,
  numGlobalBytes,
  numGlobalInts,
  numLocalBytes,
  numLocalInts,
} from "./constants";
/* eslint import/no-webpack-loader-syntax: off */
import approvalProgram from "!!raw-loader!../contracts/memory_contract_approval.teal";
import clearProgram from "!!raw-loader!../contracts/memory_contract_clear.teal";
import { base64ToUTF8String, utf8ToBase64String } from "./conversions";

class Memory {
  constructor(
    description,
    helpful,
    nothelpful,
    appId,
    owner,
    userOptedIn,
    userFeedback
  ) {
    this.description = description;
    this.helpful = helpful;
    this.nothelpful = nothelpful;
    this.appId = appId;
    this.owner = owner;
    this.userOptedIn = userOptedIn;
    this.userFeedback = userFeedback;
  }
}

// Compile smart contract in .teal format to program
const compileProgram = async (programSource) => {
  let encoder = new TextEncoder();
  let programBytes = encoder.encode(programSource);
  let compileResponse = await algodClient.compile(programBytes).do();
  return new Uint8Array(Buffer.from(compileResponse.result, "base64"));
};

// CREATE PRODUCT: ApplicationCreateTxn
export const createMemoryAction = async (senderAddress, memory) => {
  console.log("Adding a new memory to the algorand block-chain...");

  let params = await algodClient.getTransactionParams().do();

  // Compile programs
  const compiledApprovalProgram = await compileProgram(approvalProgram);
  const compiledClearProgram = await compileProgram(clearProgram);

  // Build note to identify transaction later and required app args as Uint8Arrays
  let note = new TextEncoder().encode(memoryNote);
  let description = new TextEncoder().encode(memory.description);

  let appArgs = [description];

  // Create ApplicationCreateTxn
  let txn = algosdk.makeApplicationCreateTxnFromObject({
    from: senderAddress,
    suggestedParams: params,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    approvalProgram: compiledApprovalProgram,
    clearProgram: compiledClearProgram,
    numLocalInts: numLocalInts,
    numLocalByteSlices: numLocalBytes,
    numGlobalInts: numGlobalInts,
    numGlobalByteSlices: numGlobalBytes,
    note: note,
    appArgs: appArgs,
  });

  // Get transaction ID
  let txId = txn.txID().toString();

  // Sign & submit the transaction
  let signedTxn = await myAlgoConnect.signTransaction(txn.toByte());
  console.log("Signed transaction with txID: %s", txId);
  await algodClient.sendRawTransaction(signedTxn.blob).do();

  // Wait for transaction to be confirmed
  let confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

  // Get the completed Transaction
  console.log(
    "Transaction " +
      txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );

  // Get created application id and notify about completion
  let transactionResponse = await algodClient
    .pendingTransactionInformation(txId)
    .do();
  let appId = transactionResponse["application-index"];
  console.log("Created new app-id: ", appId);
  return appId;
};

// Send Feedback: ApplicationCallTxn
export const sendFeedbackAction = async (senderAddress, memory, feedback) => {
  console.log("Sending Feedback...");

  if (feedback !== 0 && feedback !== 1) return;

  let params = await algodClient.getTransactionParams().do();

  // Build required app args as Uint8Array
  let feedbackArg = new TextEncoder().encode("feedback");

  let _feedback = algosdk.encodeUint64(feedback);

  let appArgs = [feedbackArg, _feedback];

  // OptIn Transaction
  let optInTxn = algosdk.makeApplicationOptInTxnFromObject({
    from: senderAddress,
    suggestedParams: params,
    appIndex: memory.appId,
  });

  // Create ApplicationCallTxn
  let appCallTxn = algosdk.makeApplicationCallTxnFromObject({
    from: senderAddress,
    appIndex: memory.appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams: params,
    appArgs: appArgs,
  });

  if (!memory.userOptedIn) {
    let txnArray = [optInTxn, appCallTxn];

    // Create group transaction out of previously build transactions
    let groupID = algosdk.computeGroupID(txnArray);
    for (let i = 0; i < 2; i++) txnArray[i].group = groupID;

    // Sign & submit the group transaction
    let signedTxn = await myAlgoConnect.signTransaction(
      txnArray.map((txn) => txn.toByte())
    );
    console.log("Signed group transaction");
    let tx = await algodClient
      .sendRawTransaction(signedTxn.map((txn) => txn.blob))
      .do();

    // Wait for group transaction to be confirmed
    let confirmedTxn = await algosdk.waitForConfirmation(
      algodClient,
      tx.txId,
      4
    );

    // Notify about completion
    console.log(
      "Group transaction " +
        tx.txId +
        " confirmed in round " +
        confirmedTxn["confirmed-round"]
    );
  } else {
    // Get transaction ID
    let txId = appCallTxn.txID().toString();

    // Sign & submit the transaction
    let signedTxn = await myAlgoConnect.signTransaction(appCallTxn.toByte());

    console.log("Signed transaction with txID: %s", txId);
    await algodClient.sendRawTransaction(signedTxn.blob).do();

    // Wait for transaction to be confirmed
    const confirmedTxn = await algosdk.waitForConfirmation(
      algodClient,
      txId,
      4
    );

    // Get the completed Transaction
    console.log(
      "Transaction " +
        txId +
        " confirmed in round " +
        confirmedTxn["confirmed-round"]
    );
  }
};

// Edit Description: ApplicationCallTxn
export const editAction = async (senderAddress, memory, newdescription) => {
  console.log("editing  description...");

  let params = await algodClient.getTransactionParams().do();

  // Build required app args as Uint8Array
  let editArg = new TextEncoder().encode("editmemory");
  let description = new TextEncoder().encode(newdescription);

  let appArgs = [editArg, description];

  // Create ApplicationCallTxn
  let appCallTxn = algosdk.makeApplicationCallTxnFromObject({
    from: senderAddress,
    appIndex: memory.appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams: params,
    appArgs: appArgs,
  });

  // Get transaction ID
  let txId = appCallTxn.txID().toString();

  // Sign & submit the transaction
  let signedTxn = await myAlgoConnect.signTransaction(appCallTxn.toByte());

  console.log("Signed transaction with txID: %s", txId);
  await algodClient.sendRawTransaction(signedTxn.blob).do();

  // Wait for transaction to be confirmed
  const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

  // Get the completed Transaction
  console.log(
    "Transaction " +
      txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );
};

// DELETE PRODUCT: ApplicationDeleteTxn
export const deleteMemoryAction = async (senderAddress, index) => {
  console.log("Deleting application...");

  let params = await algodClient.getTransactionParams().do();

  // Create ApplicationDeleteTxn
  let txn = algosdk.makeApplicationDeleteTxnFromObject({
    from: senderAddress,
    suggestedParams: params,
    appIndex: index,
  });

  // Get transaction ID
  let txId = txn.txID().toString();

  // Sign & submit the transaction
  let signedTxn = await myAlgoConnect.signTransaction(txn.toByte());
  console.log("Signed transaction with txID: %s", txId);
  await algodClient.sendRawTransaction(signedTxn.blob).do();

  // Wait for transaction to be confirmed
  const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

  // Get the completed Transaction
  console.log(
    "Transaction " +
      txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );

  // Get application id of deleted application and notify about completion
  let transactionResponse = await algodClient
    .pendingTransactionInformation(txId)
    .do();
  let appId = transactionResponse["txn"]["txn"].apid;
  console.log("Deleted app-id: ", appId);
};

// GET PRODUCTS: Use indexer
export const getMemoriesAction = async (address) => {
  console.log("Fetching memories...");
  let note = new TextEncoder().encode(memoryNote);
  let encodedNote = Buffer.from(note).toString("base64");

  // Step 1: Get all transactions by notePrefix (+ minRound filter for performance)
  let transactionInfo = await indexerClient
    .searchForTransactions()
    .notePrefix(encodedNote)
    .txType("appl")
    .minRound(minRound)
    .do();
  let memories = [];
  for (const transaction of transactionInfo.transactions) {
    let appId = transaction["created-application-index"];
    if (appId) {
      // Step 2: Get each application by application id
      let memory = await getApplication(appId, address);
      if (memory) {
        memories.push(memory);
      }
    }
  }
  console.log("Memories fetched.");
  return memories;
};

const getApplication = async (appId, address) => {
  try {
    // 1. Get application by appId
    let response = await indexerClient
      .lookupApplications(appId)
      .includeAll(true)
      .do();
    if (response.application.deleted) {
      return null;
    }
    let globalState = response.application.params["global-state"];

    // 2. Parse fields of response and return product
    let owner = response.application.params.creator;
    let description = "";
    let helpful = 0;
    let nothelpful = 0;
    let userFeedback = 0;
    let userOptedIn = false;

    const getField = (fieldName, globalState) => {
      return globalState.find((state) => {
        return state.key === utf8ToBase64String(fieldName);
      });
    };

    let userApplocalstate = await indexerClient
      .lookupAccountAppLocalStates(address)
      .applicationID(appId)
      .do();

    let appInfo = userApplocalstate["apps-local-states"];

    if (appInfo.length) {
      let localState = appInfo[0]["key-value"];
      if (getField("FEEDBACK", localState) !== undefined) {
        userOptedIn = true;
        userFeedback = getField("FEEDBACK", localState).value.uint;
      }
    }

    // check for memory description
    for (let i = 0; i < 10; i++) {
      let key_index = i.toString();
      if (getField(key_index, globalState) !== undefined) {
        let field = getField(key_index, globalState).value.bytes;
        description += base64ToUTF8String(field);
      }
    }

    if (getField("HELPFUL", globalState) !== undefined) {
      helpful = getField("HELPFUL", globalState).value.uint;
    }

    if (getField("NOTHELPFUL", globalState) !== undefined) {
      nothelpful = getField("NOTHELPFUL", globalState).value.uint;
    }

    return new Memory(
      description,
      helpful,
      nothelpful,
      appId,
      owner,
      userOptedIn,
      userFeedback
    );
  } catch (err) {
    console.log(err);
    return null;
  }
};
