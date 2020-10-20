const fs = require('fs');

/**
 * Process the transaction file named txnlog.dat located in the same directory as this file
 * Note that a debit is considered a positive amount paid by a user
 * Therefore a user with a positive balance of $500 has paid a total of $500
 * A user with a negative amount of $50 received a total of $50 in credit on their credit card
 */
const process = () => {

  let buffer = fs.readFileSync('txnlog.dat');
  let magicString = buffer.slice(0, 4);

  if(magicString.toString() !== 'MPS7') {
    console.log('Error, wrong file format');
    return;
  }

  //These aren't used but are present in the header
  let version    = buffer.slice(4, 5);
  let numRecords = buffer.slice(5, 9).readUInt32BE();

  //chop off the header, new buffer will only contain records
  let records = buffer.slice(9);

  let totalCredit = 0;
  let totalDebit  = 0;
  let autoStart   = 0;
  let autoEnd     = 0;

  //users will be an object to track the userIDs seen in the file.
  let users = {};


  while(records.length) {
    //determine the type of transaction
    let type = records.slice(0, 1);
    let nextRecord;
    let amount = 0;

    if(type[0] === 0 || type[0] === 1) {
      //if the type of transaction was a credit or debit then get the associated dollar amount
      nextRecord = records.slice(0, 21);
      amount = nextRecord.slice(13).readDoubleBE();
    }
    else {
      //if the type of transaction was not credit or debit, only get the record up to the userID
      nextRecord = records.slice(0, 13);
    }

    let userID = parseInt(nextRecord.slice(5, 13).readBigInt64BE().toString());

    //Keep track of user information.  If the user hasn't been seen yet, start a new record
    if(!users[userID]) {
      users[userID] = {'userID': userID, 'balance': 0};
    }

    //depending on the type of transaction, increment the appropriate counter
    //and possibly update the user's balance.  Then chop off the record just processed.
    switch(type[0]) {
      case 0:
        users[userID].balance = users[userID].balance + amount;
        totalDebit = totalDebit + amount;
        records = records.slice(21);
        break;

      case 1:
        users[userID].balance = users[userID].balance - amount;
        totalCredit = totalCredit + amount;
        records = records.slice(21);
        break;

      case 2:
        ++autoStart;
        records = records.slice(13);
        break;

      case 3:
        ++autoEnd;
        records = records.slice(13);
        break;

      default:
        console.log('Transaction type not a valid enum');
        break;
    }
  }

  //Since we are reporting only on this user, make sure it exists
  if(!users[2456938384156277127]) {
    users[2456938384156277127] = {'userID': 2456938384156277127, 'balance': 0};
  }

  console.log(`total credit amount=${totalCredit.toFixed(2)}`);
  console.log(`total debit amount=${totalDebit.toFixed(2)}`);
  console.log(`autopays started=${autoStart}`);
  console.log(`autopays ended=${autoEnd}`);
  console.log(`balance for user 2456938384156277127=${users[2456938384156277127].balance.toFixed(2)}`);
}

process();
